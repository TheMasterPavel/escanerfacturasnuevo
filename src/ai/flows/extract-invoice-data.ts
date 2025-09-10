'use server';

/**
 * @fileOverview Extracts key data from PDF invoices using AI.
 *
 * - extractInvoiceData - A function that handles the invoice data extraction process.
 * - ExtractInvoiceDataInput - The input type for the extractInvoiceData function.
 * - ExtractInvoiceDataOutput - The return type for the extractInvoiceData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractInvoiceDataInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF invoice file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractInvoiceDataInput = z.infer<typeof ExtractInvoiceDataInputSchema>;

const InvoiceSchema = z.object({
    proveedor: z.string().describe('The supplier name. If not found, return "".'),
    fecha: z.string().describe('The invoice date in YYYY-MM-DD format. If not found, return "".'),
    concepto: z.string().describe('A brief description of the invoice content. If not found, return "".'),
    importe: z.number().describe('The total amount of the invoice. If not found, return 0.'),
    missingFields: z.array(z.string()).optional().describe('An array of field names that could not be extracted with high confidence.'),
});

const ExtractInvoiceDataOutputSchema = z.object({
    facturas: z.array(InvoiceSchema).describe('An array of extracted invoices. If no invoices are found or an error occurs, return an empty array.'),
});

export type ExtractInvoiceDataOutput = z.infer<typeof ExtractInvoiceDataOutputSchema>;


export async function extractInvoiceData(input: ExtractInvoiceDataInput): Promise<ExtractInvoiceDataOutput> {
  return extractInvoiceDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractInvoiceDataPrompt',
  input: { schema: ExtractInvoiceDataInputSchema },
  output: { schema: ExtractInvoiceDataOutputSchema },
  prompt: `You are an expert accounting assistant specialized in extracting structured data from PDF documents.
  Your task is to analyze the provided PDF and extract information for ALL invoices contained within it.

  For each invoice, you must extract the following fields:
  - proveedor: The name of the supplier or vendor.
  - fecha: The date of the invoice, formatted as YYYY-MM-DD.
  - concepto: A short description of the invoice purpose or main items.
  - importe: The total numerical amount of the invoice.

  **CRITICAL INSTRUCTIONS**:
  1.  If you cannot determine the value for a field with high confidence:
      - For 'proveedor', 'fecha', or 'concepto' (string fields), you MUST return an empty string ("").
      - For 'importe' (a number field), you MUST return the number 0.
      - For each field you could not confidently extract, you MUST add its name (e.g., "proveedor", "fecha") to the 'missingFields' array.
  2.  The final output MUST be a valid JSON object following the specified output schema.
  3.  If the document contains no invoices, or if you encounter any errors preventing extraction, you MUST return an object with an empty array: { "facturas": [] }.
  4.  Return all found invoices in the 'facturas' array.

  Document to process: {{media url=pdfDataUri}}`,
  config: {
    // Using a more powerful model for better accuracy on complex documents.
    model: 'googleai/gemini-1.5-pro', 
  }
});

const extractInvoiceDataFlow = ai.defineFlow(
  {
    name: 'extractInvoiceDataFlow',
    inputSchema: ExtractInvoiceDataInputSchema,
    outputSchema: ExtractInvoiceDataOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      // Ensure we always return an object with a 'facturas' array, even if the model returns null/undefined.
      return output || { facturas: [] };
    } catch (error) {
      console.error("Error in extractInvoiceDataFlow:", error);
      // On any exception, return the safe, empty structure.
      return { facturas: [] };
    }
  }
);
