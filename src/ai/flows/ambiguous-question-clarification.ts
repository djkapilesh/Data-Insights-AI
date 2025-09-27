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
  dataDescription: z.string().describe('A description of the available data.'),
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

You will be provided with a question and a description of the available data.

Your goal is to determine if the question is ambiguous and requires further clarification.

If the question is clear enough to be answered with the available data, return the clarified question and set requiresClarification to false.

If the question is ambiguous, set requiresClarification to true and generate a nextQuestion to ask the user to clarify their intent.

Consider the conversation history when determining if the question is ambiguous.

Data Description: {{{dataDescription}}}

Conversation History:
{{#each conversationHistory}}
  {{role}}: {{content}}
{{/each}}

Question: {{{question}}}

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
