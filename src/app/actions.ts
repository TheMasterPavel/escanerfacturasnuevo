"use server";

import { extractInvoiceData } from "@/ai/flows/extract-invoice-data";
import { z } from "zod";

const InvoiceSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  proveedor: z.string(),
  fecha: z.string(),
  concepto: z.string(),
  importe: z.number(),
  missingFields: z.array(z.string()).optional(),
});

const ProcessInvoiceResult = z.array(InvoiceSchema);

export type ProcessedInvoice = z.infer<typeof InvoiceSchema>;

export async function processInvoice(
  pdfDataUri: string,
  fileName: string
): Promise<z.infer<typeof ProcessInvoiceResult>> {
  try {
    const { facturas } = await extractInvoiceData({ pdfDataUri });

    if (!facturas || facturas.length === 0) {
      return [];
    }

    const processedInvoices = facturas.map((invoiceData) => ({
      ...invoiceData,
      id: crypto.randomUUID(),
      fileName,
    }));

    return processedInvoices;
  } catch (error) {
    console.error("Error processing invoice:", error);
    throw new Error("Failed to process invoice. The AI model might have had an issue or the document is not supported.");
  }
}
