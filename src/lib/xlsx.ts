"use client";

import type { Invoice } from "@/types";
import * as XLSX from "xlsx";

export function exportToExcel(invoices: Invoice[]) {
  const dataToExport = invoices.map((invoice) => ({
    Proveedor: invoice.proveedor,
    Fecha: invoice.fecha,
    Concepto: invoice.concepto,
    Importe: invoice.importe,
    Archivo: invoice.fileName,
    "Campos Faltantes": invoice.missingFields?.join(', ') || '',
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
    { wch: 30 }, // Campos Faltantes
  ];
  
  // Trigger file download
  XLSX.writeFile(workbook, "facturas_exportadas.xlsx");
}
