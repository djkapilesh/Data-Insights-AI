'use server';

/**
 * @fileOverview Generates a summarized report of key findings and visualizations based on data queries.
 *
 * - generateDataInsightsReport - A function that generates a data insights report.
 * - GenerateDataInsightsReportInput - The input type for the generateDataInsightsReport function.
 * - GenerateDataInsightsReportOutput - The return type for the generateDataInsightsReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDataInsightsReportInputSchema = z.object({
  query: z
    .string()
    .describe('The user query to generate the data insights report.'),
  dataSummary: z
    .string()
    .describe('A summary of the data being analyzed, in JSON format.'),
  visualizations: z
    .array(z.string())
    .describe('An array of URLs pointing to generated visualizations.'),
});
export type GenerateDataInsightsReportInput = z.infer<
  typeof GenerateDataInsightsReportInputSchema
>;

const GenerateDataInsightsReportOutputSchema = z.object({
  report: z.string().describe('The summarized data insights report in Markdown format.'),
});
export type GenerateDataInsightsReportOutput = z.infer<
  typeof GenerateDataInsightsReportOutputSchema
>;

export async function generateDataInsightsReport(
  input: GenerateDataInsightsReportInput
): Promise<GenerateDataInsightsReportOutput> {
  return generateDataInsightsReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDataInsightsReportPrompt',
  input: {schema: GenerateDataInsightsReportInputSchema},
  output: {schema: GenerateDataInsightsReportOutputSchema},
  prompt: `You are an expert data analyst. You are tasked with generating a summarized report of key findings based on a user query and a JSON dataset that is the result of a SQL query.

User Query: {{{query}}}
Data: {{{dataSummary}}}

Analyze the data and generate a concise report in Markdown format that directly answers the user's query.
- If the data contains a single value or a small number of rows, state the answer directly.
- If the data is a larger table, summarize the key findings.
- Do not just list the raw data. Provide a clear, insightful, and human-readable analysis.
- If the data appears empty or doesn't seem to answer the query, state that you couldn't find a specific answer in the data.
`,
});

const generateDataInsightsReportFlow = ai.defineFlow(
  {
    name: 'generateDataInsightsReportFlow',
    inputSchema: GenerateDataInsightsReportInputSchema,
    outputSchema: GenerateDataInsightsReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
