"use client";

import { useState, useMemo, useRef, ChangeEvent } from "react";
import type { Invoice } from "@/types";
import { processInvoice } from "@/app/actions";
import { exportToExcel } from "@/lib/xlsx";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileClock,
  FileDown,
  FileText,
  FileX,
  Loader2,
  Trash2,
  Upload,
  Wallet,
} from "lucide-react";

export default function InvoiceDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const summary = useMemo(() => {
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount.value, 0);
    const processedCount = invoices.length;
    const needsReviewCount = invoices.filter(inv => 
      inv.supplier.uncertain || inv.date.uncertain || inv.concept.uncertain || inv.amount.uncertain
    ).length;
    return { totalAmount, processedCount, needsReviewCount };
  }, [invoices]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Archivo no válido",
        description: "Por favor, sube un archivo PDF.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const pdfDataUri = reader.result as string;
        try {
          const newInvoices = await processInvoice(pdfDataUri, file.name);
          setInvoices((prev) => [...newInvoices, ...prev]);
          toast({
            title: "Factura(s) procesada(s)",
            description: `Se han extraído ${newInvoices.length} factura(s) exitosamente.`,
          });
        } catch (error) {
            if (error instanceof Error) {
                toast({
                    variant: "destructive",
                    title: "Error al procesar",
                    description: error.message,
                });
            }
        } finally {
          setIsLoading(false);
          // Reset file input
          if(fileInputRef.current) fileInputRef.current.value = "";
        }
      };
    } catch (error) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo leer el archivo.",
      });
    }
  };
  
  const handleDeleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };


  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Factura Inteligente
        </h1>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            className="hidden"
            disabled={isLoading}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Upload />
            )}
            Subir Factura
          </Button>
          <Button variant="outline" onClick={() => exportToExcel(invoices)} disabled={invoices.length === 0}>
            <FileDown />
            Exportar a Excel
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalAmount.toLocaleString("es-ES", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Procesadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.processedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Revisión</CardTitle>
            <FileClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.needsReviewCount}</div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Facturas</CardTitle>
          </CardHeader>
          <CardContent>
             {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Proveedor</TableHead>
                    <TableHead className="w-[120px]">Fecha</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="w-[150px] text-right">Importe</TableHead>
                    <TableHead className="w-[50px] text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className={cn({'bg-accent/20 hover:bg-accent/30': invoice.supplier.uncertain || invoice.date.uncertain || invoice.concept.uncertain || invoice.amount.uncertain})}>
                      <TableCell className={cn('font-medium', {'text-accent-foreground ring-1 ring-accent rounded-md': invoice.supplier.uncertain})}>
                        {invoice.supplier.value}
                      </TableCell>
                      <TableCell className={cn({'text-accent-foreground ring-1 ring-accent rounded-md': invoice.date.uncertain})}>
                        {invoice.date.value}
                      </TableCell>
                      <TableCell className={cn({'text-accent-foreground ring-1 ring-accent rounded-md': invoice.concept.uncertain})}>
                        {invoice.concept.value}
                      </TableCell>
                      <TableCell className={cn('text-right font-mono', {'text-accent-foreground ring-1 ring-accent rounded-md': invoice.amount.uncertain})}>
                        {invoice.amount.value.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                      </TableCell>
                       <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteInvoice(invoice.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <FileX className="w-16 h-16 text-muted-foreground" />
                <h3 className="text-xl font-semibold">No hay facturas</h3>
                <p className="text-muted-foreground">Empieza subiendo tu primer archivo PDF.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
