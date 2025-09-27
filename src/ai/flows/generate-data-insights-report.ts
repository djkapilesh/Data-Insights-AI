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
    .describe('A summary of the data being analyzed.'),
  visualizations: z
    .array(z.string())
    .describe('An array of URLs pointing to generated visualizations.'),
});
export type GenerateDataInsightsReportInput = z.infer<
  typeof GenerateDataInsightsReportInputSchema
>;

const GenerateDataInsightsReportOutputSchema = z.object({
  report: z.string().describe('The summarized data insights report.'),
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
  prompt: `You are an expert data analyst. You are tasked with generating a summarized report of key findings and visualizations based on a user query and a summary of the data.

User Query: {{{query}}}
Data Summary: {{{dataSummary}}}
Visualizations: {{#each visualizations}}{{{this}}} {{/each}}

Generate a concise report summarizing the key insights from the data, referencing the provided visualizations.`,
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
