'use server';
/**
 * @fileOverview Implements a Genkit flow that provides real-time feedback during data processing and analysis,
 * requesting user input for missing values to ensure data completeness and accuracy.
 *
 * - realTimeFeedbackAndValueCompletion - The main function to initiate the data processing and analysis flow.
 * - RealTimeFeedbackAndValueCompletionInput - Input type for the realTimeFeedbackAndValueCompletion function, including data and initial query.
 * - RealTimeFeedbackAndValueCompletionOutput - Output type for the flow, providing analysis results or feedback requests.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input schema for the flow, including the data (as a stringified JSON for simplicity) and the initial user query.
const RealTimeFeedbackAndValueCompletionInputSchema = z.object({
  data: z.string().describe('The uploaded data as a JSON string.'),
  query: z.string().describe('The user query in natural language.'),
  conversationHistory: z.array(z.any()).optional().describe('The history of the conversation.'),
});
export type RealTimeFeedbackAndValueCompletionInput = z.infer<typeof RealTimeFeedbackAndValueCompletionInputSchema>;


// Output schema for the flow.  This can either be the analysis result or a request for missing data.
const RealTimeFeedbackAndValueCompletionOutputSchema = z.object({
  result: z.string().optional().describe('The analysis result, if available.'),
  missingValues: z.array(z.string()).optional().describe('A list of missing values that need to be provided by the user.'),
  feedback: z.string().optional().describe('Real-time feedback on the data processing and analysis.'),
});
export type RealTimeFeedbackAndValueCompletionOutput = z.infer<typeof RealTimeFeedbackAndValueCompletionOutputSchema>;

// Main function to initiate the data processing and analysis flow.
export async function realTimeFeedbackAndValueCompletion(input: RealTimeFeedbackAndValueCompletionInput): Promise<RealTimeFeedbackAndValueCompletionOutput> {
  return realTimeFeedbackAndValueCompletionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'realTimeFeedbackAndValueCompletionPrompt',
  input: {schema: RealTimeFeedbackAndValueCompletionInputSchema},
  output: {schema: RealTimeFeedbackAndValueCompletionOutputSchema},
  prompt: `You are an AI data analysis assistant. You are provided with a dataset and a query from the user. You also have the conversation history.

Analyze the data and the user's query. Provide a concise and accurate text-based answer.

If there are missing values that are critical to answering the query, identify them and ask the user to provide them.

Do not use Markdown formatting in your response.

Conversation History:
{{#each conversationHistory}}
    {{role}}: {{content}}
{{/each}}

Dataset: {{{data}}}
Query: {{{query}}}
`,
});

// Genkit flow definition
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
