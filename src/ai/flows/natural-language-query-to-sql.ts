'use server';
/**
 * @fileOverview This file defines a Genkit flow that translates natural language queries into SQL queries.
 *
 * - naturalLanguageQueryToSQL - A function that takes a natural language query and returns an SQL query.
 * - NaturalLanguageQueryToSQLInput - The input type for the naturalLanguageQueryToSQL function.
 * - NaturalLanguageQueryToSQLOutput - The return type for the naturalLanguageQueryToSQL function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NaturalLanguageQueryToSQLInputSchema = z.object({
  query: z.string().describe('The natural language query to translate to SQL.'),
  tableSchema: z.string().describe('The schema of the SQL table to query.'),
});
export type NaturalLanguageQueryToSQLInput = z.infer<
  typeof NaturalLanguageQueryToSQLInputSchema
>;

const NaturalLanguageQueryToSQLOutputSchema = z.object({
  sqlQuery: z.string().describe('The SQL query that answers the natural language query.'),
});
export type NaturalLanguageQueryToSQLOutput = z.infer<
  typeof NaturalLanguageQueryToSQLOutputSchema
>;

export async function naturalLanguageQueryToSQL(
  input: NaturalLanguageQueryToSQLInput
): Promise<NaturalLanguageQueryToSQLOutput> {
  return naturalLanguageQueryToSQLFlow(input);
}

const naturalLanguageQueryToSQLPrompt = ai.definePrompt({
  name: 'naturalLanguageQueryToSQLPrompt',
  input: {schema: NaturalLanguageQueryToSQLInputSchema},
  output: {schema: NaturalLanguageQueryToSQLOutputSchema},
  prompt: `You are an expert SQL developer.  Given the following table schema and a natural language query, you will generate an SQL query that answers the question.\n\nTable Schema:\n{{tableSchema}}\n\nNatural Language Query:\n{{query}}\n\nSQL Query: `,
});

const naturalLanguageQueryToSQLFlow = ai.defineFlow(
  {
    name: 'naturalLanguageQueryToSQLFlow',
    inputSchema: NaturalLanguageQueryToSQLInputSchema,
    outputSchema: NaturalLanguageQueryToSQLOutputSchema,
  },
  async input => {
    const {output} = await naturalLanguageQueryToSQLPrompt(input);
    return output!;
  }
);
