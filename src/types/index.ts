export type Invoice = {
  id: string;
  fileName: string;
  proveedor: string;
  fecha: string;
  concepto: string;
  importe: number;
  missingFields?: string[];
};
