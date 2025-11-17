
import { GoogleGenAI, Type } from '@google/genai';
import { AlbionConnection } from '../types';
import logger from './logger';
import { getApiKey } from './apiKeyService';

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    origem: {
      type: Type.STRING,
      description: 'The player\'s current zone name (e.g., "XASES-ATRAGLOS"). Ignore any Roman numeral tier prefixes. Located at the top-center of the screen.',
    },
    destino: {
      type: Type.STRING,
      description: 'The destination zone name from the Avalonian portal tooltip (e.g., "SLEOS-OLUGHAM").',
    },
    minutos_ate_fechar: {
      type: Type.INTEGER,
      description: 'The total time in minutes until the portal closes. Example: "7 h 57 m" should be converted to 477.',
    },
  },
  required: ['origem', 'destino', 'minutos_ate_fechar'],
};

export async function extractConnectionFromImage(base64Image: string): Promise<AlbionConnection> {
  const apiKey = getApiKey();
  if (!apiKey) {
    const errorMsg = "Gemini API Key is not set. Please set it in the settings.";
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
              mimeType: 'image/png',
              data: base64Image,
            },
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    logger.ai(`Raw AI Response: ${jsonText}`);
    
    const parsedData = JSON.parse(jsonText);
    logger.debug(`Parsed AI Data: ${JSON.stringify(parsedData)}`);
    
    // Simple validation
    if (parsedData.origem && parsedData.destino && typeof parsedData.minutos_ate_fechar === 'number') {
        return parsedData as AlbionConnection;
    } else {
        const missingFields = ['origem', 'destino', 'minutos_ate_fechar'].filter(f => parsedData[f] === undefined || parsedData[f] === null).join(', ');
        throw new Error(`AI response was missing required fields: ${missingFields}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error calling Gemini API: ${errorMessage}`);
    if (errorMessage.includes('API key not valid')) {
       throw new Error("The configured Gemini API Key is invalid. Please set a new one in settings.");
    }
    throw new Error("Failed to analyze the image with AI. The image might be unclear or not contain a valid portal tooltip.");
  }
}
