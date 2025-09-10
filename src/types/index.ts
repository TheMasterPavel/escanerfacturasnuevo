export type InvoiceField<T> = {
  value: T;
  uncertain: boolean;
};

export type Invoice = {
  id: string;
  fileName: string;
  supplier: InvoiceField<string>;
  date: InvoiceField<string>;
  concept: InvoiceField<string>;
  amount: InvoiceField<number>;
};
