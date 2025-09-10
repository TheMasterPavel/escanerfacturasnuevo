"use server";

import { extractInvoiceData } from "@/ai/flows/extract-invoice-data";
import { flagUncertainData } from "@/ai/flows/flag-uncertain-data";
import { z } from "zod";

const ProcessInvoiceResult = z.array(z.object({
  id: z.string(),
  fileName: z.string(),
  supplier: z.object({
    value: z.string(),
    uncertain: z.boolean(),
  }),
  date: z.object({
    value: z.string(),
    uncertain: z.boolean(),
  }),
  concept: z.object({
    value: z.string(),
    uncertain: z.boolean(),
  }),
  amount: z.object({
    value: z.number(),
    uncertain: z.boolean(),
  }),
}));

export async function processInvoice(
  pdfDataUri: string,
  fileName: string
): Promise<z.infer<typeof ProcessInvoiceResult>> {
  try {
    const extractedData = await extractInvoiceData({ pdfDataUri });

    const processedInvoices = await Promise.all(extractedData.map(async (invoiceData) => {
      // Simulate confidence scores to demonstrate the "Highlight for Review" feature
      const flaggedData = await flagUncertainData({
        ...invoiceData,
        supplierConfidence: Math.random() * 0.3 + 0.7, // 70% - 100% confidence
        dateConfidence: Math.random() * 0.3 + 0.7,
        conceptConfidence: Math.random() * 0.3 + 0.7,
        amountConfidence: Math.random() * 0.3 + 0.7,
      });

      return {
        id: crypto.randomUUID(),
        fileName,
        ...flaggedData,
      };
    }));

    return processedInvoices;
  } catch (error) {
    console.error("Error processing invoice:", error);
    throw new Error("Failed to process invoice. The AI model might have had an issue.");
  }
}
