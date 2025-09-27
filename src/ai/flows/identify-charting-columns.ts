'use server';
/**
 * @fileOverview Identifies the best columns for generating a chart from a dataset based on a user query.
 *
 * - identifyChartingColumns - A function that suggests columns for charting.
 * - IdentifyChartingColumnsInput - The input type for the function.
 * - IdentifyChartingColumnsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyChartingColumnsInputSchema = z.object({
  query: z.string().describe('The natural language query from the user.'),
  columnNames: z
    .array(z.string())
    .describe('The available column names in the dataset.'),
});
export type IdentifyChartingColumnsInput = z.infer<
  typeof IdentifyChartingColumnsInputSchema
>;

const IdentifyChartingColumnsOutputSchema = z.object({
  categoryColumn: z
    .string()
    .optional()
    .describe(
      'The column that represents the categories or labels for the chart (X-axis). This should be a column with string/categorical values.'
    ),
  valueColumn: z
    .string()
    .optional()
    .describe(
      'The column that represents the numerical values for the chart (Y-axis). This should be a column with numeric values that can be aggregated (e.g., counted or summed).'
    ),
  isChartable: z
    .boolean()
    .describe('Whether a meaningful chart can be generated based on the query and available columns.'),
});
export type IdentifyChartingColumnsOutput = z.infer<
  typeof IdentifyChartingColumnsOutputSchema
>;

export async function identifyChartingColumns(
  input: IdentifyChartingColumnsInput
): Promise<IdentifyChartingColumnsOutput> {
  return identifyChartingColumnsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyChartingColumnsPrompt',
  input: {schema: IdentifyChartingColumnsInputSchema},
  output: {schema: IdentifyChartingColumnsOutputSchema},
  prompt: `You are a data analysis expert. Your task is to identify the best columns for creating a 2D chart based on a user's query and a list of available column names.

You need to select one categorical column (for the X-axis) and one numerical column (for the Y-axis).

- The 'categoryColumn' should be the column that contains distinct labels or groups (e.g., product names, dates, categories).
- The 'valueColumn' should be a column that can be numerically aggregated (e.g., 'Sales', 'Price', or a column whose occurrences can be counted).

If the query is asking for a count of items in a category (e.g., "how many products in each category?"), the valueColumn should be the same as the categoryColumn, as we will count its occurrences.

Analyze the user's query and the column names provided.

If a reasonable chart can be created to answer the query, set 'isChartable' to true and provide the identified 'categoryColumn' and 'valueColumn'.

If the query is too complex, doesn't seem to ask for a chart, or if suitable columns are not available, set 'isChartable' to false.

Available Columns:
{{#each columnNames}}
- {{{this}}}
{{/each}}

User Query: "{{query}}"
`,
});

const identifyChartingColumnsFlow = ai.defineFlow(
  {
    name: 'identifyChartingColumnsFlow',
    inputSchema: IdentifyChartingColumnsInputSchema,
    outputSchema: IdentifyChartingColumnsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
