'use server';

/**
 * @fileOverview A flow that provides real-time feedback and completes values based on user input and data.
 *
 * - realTimeFeedbackAndValueCompletion - A function that handles real-time feedback and value completion.
 * - RealTimeFeedbackAndValueCompletionInput - The input type for the realTimeFeedbackAndValueCompletion function.
 * - RealTimeFeedbackAndValueCompletionOutput - The return type for the realTimeFeedbackAndValueCompletion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RealTimeFeedbackAndValueCompletionInputSchema = z.object({
  question: z.string().describe('The user\'s question or prompt.'),
  data: z
    .string()
    .describe('A JSON string representing the data to be analyzed.'),
});
export type RealTimeFeedbackAndValueCompletionInput = z.infer<
  typeof RealTimeFeedbackAndValueCompletionInputSchema
>;

const RealTimeFeedbackAndValueCompletionOutputSchema = z.object({
  report: z.string().describe('A summarized report of key findings and visualizations in Markdown format.'),
});
export type RealTimeFeedbackAndValueCompletionOutput = z.infer<
  typeof RealTimeFeedbackAndValueCompletionOutputSchema
>;

export async function realTimeFeedbackAndValueCompletion(
  input: RealTimeFeedbackAndValueCompletionInput
): Promise<RealTimeFeedbackAndValueCompletionOutput> {
  return realTimeFeedbackAndValueCompletionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'realTimeFeedbackAndValueCompletionPrompt',
  input: {schema: RealTimeFeedbackAndValueCompletionInputSchema},
  output: {schema: RealTimeFeedbackAndValueCompletionOutputSchema},
  prompt: `You are an expert data analyst AI. Your task is to analyze the provided JSON data to answer the user's question and generate a concise, insightful report in Markdown format.

Analyze the data and the user's question carefully. Your report should directly address the user's query.

- If the question is ambiguous or vague (e.g., "is it good?"), ask a clarifying question back to the user to help them refine their query.
- If the data is a single value or a small number of items, state the answer directly.
- If the data is a larger table, summarize the key findings and trends relevant to the question.
- Do not just list the raw data. Provide clear, human-readable analysis.
- If the data appears empty or doesn't seem to contain the answer, state that you couldn't find a specific answer in the provided data.

User Question:
"{{{question}}}"

JSON Data:
\`\`\`json
{{{data}}}
\`\`\`
`,
});

const realTimeFeedbackAndValueCompletionFlow = ai.defineFlow(
  {
    name: 'realTimeFeedbackAndValueCompletionFlow',
    inputSchema: RealTimeFeedbackAndValueCompletionInputSchema,
    outputSchema: RealTimeFeedbackAndValueCompletionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
