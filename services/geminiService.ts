
import { AlbionConnection } from '../types';
import logger from './logger';
import { getApiKey } from './apiKeyService';

export async function extractConnectionFromImage(base64Image: string): Promise<AlbionConnection> {
  const apiKey = getApiKey();
  
  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        apiKey: apiKey || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Chave API Gemini inválida ou não configurada. Por favor, verifique nas configurações.");
      }
      throw new Error(data.error || 'Failed to process image');
    }

    return data as AlbionConnection;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error calling backend API: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

