'use server';
/**
 * @fileOverview Handles ambiguous questions from users by engaging in an iterative clarification process.
 *
 * - clarifyAmbiguousQuestion - A function that initiates the question clarification process.
 * - ClarifyAmbiguousQuestionInput - The input type for the clarifyAmbiguousQuestion function.
 * - ClarifyAmbiguousQuestionOutput - The return type for the clarifyAmbiguousQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClarifyAmbiguousQuestionInputSchema = z.object({
  question: z.string().describe('The ambiguous question asked by the user.'),
  dataDescription: z.string().describe('A description of the available data (e.g. a SQL table schema).'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'system']),
    content: z.string(),
  })).optional().describe('The history of the conversation.'),
});
export type ClarifyAmbiguousQuestionInput = z.infer<typeof ClarifyAmbiguousQuestionInputSchema>;

const ClarifyAmbiguousQuestionOutputSchema = z.object({
  clarifiedQuestion: z.string().describe('The clarified question that can be used to generate an SQL query.'),
  requiresClarification: z.boolean().describe('Whether the question requires further clarification.'),
  nextQuestion: z.string().optional().describe('The next question to ask the user if clarification is required.'),
});
export type ClarifyAmbiguousQuestionOutput = z.infer<typeof ClarifyAmbiguousQuestionOutputSchema>;

export async function clarifyAmbiguousQuestion(input: ClarifyAmbiguousQuestionInput): Promise<ClarifyAmbiguousQuestionOutput> {
  return clarifyAmbiguousQuestionFlow(input);
}

const clarifyAmbiguousQuestionPrompt = ai.definePrompt({
  name: 'clarifyAmbiguousQuestionPrompt',
  input: {schema: ClarifyAmbiguousQuestionInputSchema},
  output: {schema: ClarifyAmbiguousQuestionOutputSchema},
  prompt: `You are a helpful AI assistant that helps clarify ambiguous questions about data.

You will be provided with a question and a description of the available data in the form of a SQL table schema.

Your goal is to determine if the question is ambiguous and requires further clarification from the user.

If the question is clear enough to be answered with the available data, return the original question as the 'clarifiedQuestion' and set 'requiresClarification' to false.

If the question is ambiguous (e.g., uses vague terms, refers to columns that don't exist, is open-ended without specifics), set 'requiresClarification' to true and generate a 'nextQuestion' to ask the user to clarify their intent. Your clarifying question should be specific and guide the user toward providing the necessary information.

Consider the conversation history when determining if the question is ambiguous. The user might be providing an answer to a previous clarifying question.

Data Description:
\`\`\`sql
{{{dataDescription}}}
\`\`\`

Conversation History:
{{#each conversationHistory}}
  {{role}}: {{content}}
{{/each}}

Latest User Question: {{{question}}}

Analyze the latest user question based on the data description and conversation history. Determine if it's clear or needs clarification.

Response (JSON):
`,
});

const clarifyAmbiguousQuestionFlow = ai.defineFlow(
  {
    name: 'clarifyAmbiguousQuestionFlow',
    inputSchema: ClarifyAmbiguousQuestionInputSchema,
    outputSchema: ClarifyAmbiguousQuestionOutputSchema,
  },
  async input => {
    const {output} = await clarifyAmbiguousQuestionPrompt(input);
    return output!;
  }
);
