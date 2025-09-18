// src/ai/flows/improve-ui-alignment.ts
'use server';

/**
 * @fileOverview Analyzes the replica's UI against the original website and suggests improvements.
 *
 * - improveUIAlignment - A function that handles the UI alignment improvement process.
 * - ImproveUIAlignmentInput - The input type for the improveUIAlignment function.
 * - ImproveUIAlignmentOutput - The return type for the improveUIAlignment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveUIAlignmentInputSchema = z.object({
  replicaScreenshotDataUri: z
    .string()
    .describe(
      "A screenshot of the replica's UI, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  originalScreenshotDataUri: z
    .string()
    .describe(
      'A screenshot of the original website, as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});

const ImproveUIAlignmentOutputSchema = z.object({
  suggestions: z
    .string()
    .describe('A list of suggestions to improve the replica UI alignment.'),
});

export async function improveUIAlignment(input: z.infer<typeof ImproveUIAlignmentInputSchema>): Promise<z.infer<typeof ImproveUIAlignmentOutputSchema>> {
  return improveUIAlignmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveUIAlignmentPrompt',
  input: {schema: ImproveUIAlignmentInputSchema},
  output: {schema: ImproveUIAlignmentOutputSchema},
  prompt: `You are an expert UI/UX designer. You are given two screenshots, one of the original website and one of the replica.

  Your task is to provide a list of suggestions to improve the replica's UI alignment with the original website. Be specific and actionable.

  Original Website: {{media url=originalScreenshotDataUri}}
  Replica: {{media url=replicaScreenshotDataUri}}`,
});

const improveUIAlignmentFlow = ai.defineFlow(
  {
    name: 'improveUIAlignmentFlow',
    inputSchema: ImproveUIAlignmentInputSchema,
    outputSchema: ImproveUIAlignmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
