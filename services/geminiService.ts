
import { GoogleGenAI, Type } from '@google/genai';
import { AlbionConnection } from '../types';
import logger from './logger';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a placeholder check. The environment variable is expected to be set in the runtime environment.
  logger.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    origem: {
      type: Type.STRING,
      description: 'The name of the player\'s current zone. It is usually at the top center of the screen, in all caps, like "VI XASES-ATRAGLOS". Ignore the roman numeral tier prefix "VI ".',
    },
    destino: {
      type: Type.STRING,
      description: 'The name of the destination zone, found within a floating tooltip for an Avalonian portal, for example, "Sleos-Olugham".',
    },
    minutos_ate_fechar: {
      type: Type.INTEGER,
      description: 'The time remaining until the portal closes, from the same tooltip. For example, "closes in 7 h 57 m". This value must be converted into total minutes. "7 h 57 m" would be 477.',
    },
  },
  required: ['origem', 'destino', 'minutos_ate_fechar'],
};

export async function extractConnectionFromImage(base64Image: string): Promise<AlbionConnection> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `You are an OCR assistant specialized in the game Albion Online. Analyze the provided screenshot. Your goal is to extract three key pieces of information and return them in a JSON structure.
            1.  **zona_atual**: Find the player's current zone name.
            2.  **conexao_alvo**: Find the tooltip for an Avalonian portal and extract the destination zone name from it.
            3.  **tempo_restante**: From the same tooltip, extract the closing time and convert it to total minutes.
            If any piece of information cannot be found, return null for that field within the JSON structure.`,
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
        const missingFields = ['origem', 'destino', 'minutos_ate_fechar'].filter(f => !parsedData[f]).join(', ');
        throw new Error(`AI response was missing required fields: ${missingFields}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error calling Gemini API: ${errorMessage}`);
    throw new Error("Failed to analyze the image with AI. The image might be unclear or not contain a valid portal tooltip.");
  }
}
