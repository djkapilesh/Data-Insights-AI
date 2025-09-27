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

// Defines the structure for different visualization types
const VisualizationDataSchema = z.union([
    z.object({
        type: z.literal('barChart'),
        data: z.array(z.record(z.any())).describe("Data for the bar chart. Example: [{ name: 'Jan', total: 1000 }, ...]")
    }),
    z.object({
        type: z.literal('table'),
        data: z.array(z.record(z.any())).describe("Data for the table. Example: [{ column1: 'value1', column2: 123 }, ...]"),
        columns: z.array(z.string()).describe("Array of column headers for the table. Example: ['Product', 'Sales']")
    })
]);


// Output schema for the flow.  This can either be the analysis result or a request for missing data.
const RealTimeFeedbackAndValueCompletionOutputSchema = z.object({
  result: z.string().optional().describe('The analysis result, if available.'),
  missingValues: z.array(z.string()).optional().describe('A list of missing values that need to be provided by the user.'),
  feedback: z.string().optional().describe('Real-time feedback on the data processing and analysis.'),
  visualization: VisualizationDataSchema.optional().describe('A data visualization object (e.g., for a chart or table) if applicable to the query.')
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

If the query asks for a comparison, breakdown, or summary that would be best represented visually (e.g., "show me sales by category", "compare revenue over the last 6 months"), you MUST generate a 'visualization' object in your response.
- For bar charts, provide the data as an array of objects.
- For tables, provide both the data array and an array of column headers.
- Choose a bar chart for comparisons and trends, and a table for detailed data display. Do not generate a visualization if the query is a simple question.

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
