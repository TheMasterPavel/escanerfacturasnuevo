'use server';

/**
 * @fileOverview Highlights uncertain data fields extracted from an invoice.
 *
 * - flagUncertainData - A function that takes extracted invoice data and flags fields with low confidence.
 * - FlagUncertainDataInput - The input type for the flagUncertainData function.
 * - FlagUncertainDataOutput - The return type for the flagUncertainData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FlagUncertainDataInputSchema = z.object({
  supplier: z.string().describe('The name of the supplier.'),
  date: z.string().describe('The invoice date.'),
  concept: z.string().describe('The description of the invoice.'),
  amount: z.number().describe('The invoice amount.'),
  supplierConfidence: z.number().min(0).max(1).default(1).describe('Confidence level for supplier extraction (0-1).'),
  dateConfidence: z.number().min(0).max(1).default(1).describe('Confidence level for date extraction (0-1).'),
  conceptConfidence: z.number().min(0).max(1).default(1).describe('Confidence level for concept extraction (0-1).'),
  amountConfidence: z.number().min(0).max(1).default(1).describe('Confidence level for amount extraction (0-1).'),
});
export type FlagUncertainDataInput = z.infer<typeof FlagUncertainDataInputSchema>;

const FlagUncertainDataOutputSchema = z.object({
  supplier: z.object({
    value: z.string().describe('The name of the supplier.'),
    uncertain: z.boolean().describe('Whether the supplier data is uncertain.'),
  }),
  date: z.object({
    value: z.string().describe('The invoice date.'),
    uncertain: z.boolean().describe('Whether the date data is uncertain.'),
  }),
  concept: z.object({
    value: z.string().describe('The description of the invoice.'),
    uncertain: z.boolean().describe('Whether the concept data is uncertain.'),
  }),
  amount: z.object({
    value: z.number().describe('The invoice amount.'),
    uncertain: z.boolean().describe('Whether the amount data is uncertain.'),
  }),
});
export type FlagUncertainDataOutput = z.infer<typeof FlagUncertainDataOutputSchema>;

export async function flagUncertainData(input: FlagUncertainDataInput): Promise<FlagUncertainDataOutput> {
  return flagUncertainDataFlow(input);
}

const flagUncertainDataFlow = ai.defineFlow(
  {
    name: 'flagUncertainDataFlow',
    inputSchema: FlagUncertainDataInputSchema,
    outputSchema: FlagUncertainDataOutputSchema,
  },
  async input => {
    const confidenceThreshold = 0.8; // Define a threshold for considering data uncertain

    const output: FlagUncertainDataOutput = {
      supplier: {
        value: input.supplier,
        uncertain: input.supplierConfidence < confidenceThreshold,
      },
      date: {
        value: input.date,
        uncertain: input.dateConfidence < confidenceThreshold,
      },
      concept: {
        value: input.concept,
        uncertain: input.conceptConfidence < confidenceThreshold,
      },
      amount: {
        value: input.amount,
        uncertain: input.amountConfidence < confidenceThreshold,
      },
    };

    return output;
  }
);
