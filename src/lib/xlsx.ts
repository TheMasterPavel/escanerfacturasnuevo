"use client";

import type { Invoice } from "@/types";
import * as XLSX from "xlsx";

export function exportToExcel(invoices: Invoice[]) {
  const dataToExport = invoices.map((invoice) => ({
    Proveedor: invoice.supplier.value,
    Fecha: invoice.date.value,
    Concepto: invoice.concept.value,
    Importe: invoice.amount.value,
    Archivo: invoice.fileName,
    "Proveedor Incierto": invoice.supplier.uncertain,
    "Fecha Incierta": invoice.date.uncertain,
    "Concepto Incierto": invoice.concept.uncertain,
    "Importe Incierto": invoice.amount.uncertain,
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Facturas");

  // Format headers
  worksheet["!cols"] = [
    { wch: 30 }, // Proveedor
    { wch: 15 }, // Fecha
    { wch: 50 }, // Concepto
    { wch: 15 }, // Importe
    { wch: 30 }, // Archivo
  ];
  
  // Trigger file download
  XLSX.writeFile(workbook, "facturas_exportadas.xlsx");
}
