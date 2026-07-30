import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      origem: {
        type: Type.STRING,
        description:
          'The player\'s current zone name (e.g., "XASES-ATRAGLOS"). Ignore any Roman numeral tier prefixes. Located at the top-center of the screen.',
      },
      destino: {
        type: Type.STRING,
        description:
          'The destination zone name from the Avalonian portal tooltip (e.g., "SLEOS-OLUGHAM").',
      },
      minutos_ate_fechar: {
        type: Type.INTEGER,
        description:
          'The total time in minutes until the portal closes. Example: "7 h 57 m" should be converted to 477.',
      },
    },
    required: ["origem", "destino", "minutos_ate_fechar"],
  };

  app.post("/api/extract", async (req, res) => {
    try {
      const { image, apiKey } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Image is required" });
      }

      const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;
      if (!effectiveApiKey) {
        return res.status(401).json({
          error:
            "Nenhuma Chave API fornecida e chave do sistema indisponível.",
        });
      }

      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              text: `You are an expert OCR assistant for the game Albion Online. Your task is to analyze the provided screenshot and extract information about an Avalonian Roads connection.

Follow these steps carefully:
1.  **Identify Current Zone (origem)**: Locate the player's current zone name. It is at the top-center of the screen in all capital letters. You MUST ignore any Roman numeral prefix (like "VI ").
2.  **Identify Destination Zone (destino)**: Find the tooltip for an Avalonian portal. Inside this tooltip, extract the destination zone name.
3.  **Identify Closing Time (minutos_ate_fechar)**: In the same tooltip, find the time remaining until the portal closes (e.g., "closes in 7 h 57 m").

**Important formatting rules:**
*   Zone names are often in the format \`NAME-NAME\` (e.g., \`XASES-ATRAGLOS\`). Be very careful with spelling. Double-check for common OCR errors like mistaking 'O' for '0' or 'I' for 'L'. The names are always uppercase.
*   Convert the closing time to total minutes. For example, "7 h 57 m" becomes 477. "1 h" becomes 60. "30 m" becomes 30.
*   Return the extracted information in a strict JSON format according to the provided schema.

If you cannot confidently identify any piece of information, return \`null\` for that specific field within the JSON structure.`,
            },
            {
              inlineData: {
                mimeType: "image/png",
                data: image,
              },
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      const jsonText = response.text?.trim() || "{}";
      const parsedData = JSON.parse(jsonText);

      if (
        parsedData.origem &&
        parsedData.destino &&
        typeof parsedData.minutos_ate_fechar === "number"
      ) {
        res.json(parsedData);
      } else {
        const missingFields = ["origem", "destino", "minutos_ate_fechar"]
          .filter(
            (f) => parsedData[f] === undefined || parsedData[f] === null
          )
          .join(", ");
        res.status(400).json({
          error: `AI response was missing required fields: ${missingFields}`,
        });
      }
    } catch (error: any) {
      console.error("Error calling Gemini API:", error);
      const errorMessage = error.message || String(error);
      if (errorMessage.includes("API key not valid")) {
        res
          .status(401)
          .json({ error: "The configured Gemini API Key is invalid." });
      } else {
        res
          .status(500)
          .json({ error: "Failed to analyze the image with AI." });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
