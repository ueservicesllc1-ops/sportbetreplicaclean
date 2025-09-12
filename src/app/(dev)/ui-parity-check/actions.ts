'use server';

import { improveUIAlignment } from '@/ai/flows/improve-ui-alignment';

export async function performUiCheck(originalScreenshotDataUri: string, replicaScreenshotDataUri: string) {
  try {
    const result = await improveUIAlignment({
      originalScreenshotDataUri,
      replicaScreenshotDataUri,
    });
    return result.suggestions;
  } catch (error) {
    console.error('Error in UI parity check:', error);
    throw new Error('Failed to get suggestions from AI.');
  }
}
