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
  queryResult: z.string().describe('The result of the SQL query as a JSON string.'),
  query: z.string().describe('The user query in natural language.'),
  conversationHistory: z.array(z.any()).optional().describe('The history of the conversation.'),
});
export type RealTimeFeedbackAndValueCompletionInput = z.infer<typeof RealTimeFeedbackAndValueCompletionInputSchema>;


// Output schema for the flow.  This can either be the analysis result or a request for missing data.
const RealTimeFeedbackAndValueCompletionOutputSchema = z.object({
  result: z.string().optional().describe('The analysis result, if available.'),
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

Your primary goal is to provide a concise and accurate text-based analysis of the provided data to answer the user's query.

Do not just restate the data from the query result. Provide insights, summaries, or explanations based on the data in relation to the user's question.

Do not use Markdown formatting in your response.

Conversation History:
{{#each conversationHistory}}
    {{role}}: {{content}}
{{/each}}

Query Result Data: {{{queryResult}}}
User's Original Query: {{{query}}}
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
