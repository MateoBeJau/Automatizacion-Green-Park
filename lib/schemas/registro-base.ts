import { z } from "zod";

export const HeaderPDFSchema = z.object({
  numeroDocumento: z.string(),
  numeroOS: z.string(),
  moneda: z.enum(["UYU", "USD"]),
  complejo: z.string(),
  identificador: z.string(),
  unidad: z.string(),
  cliente: z.string(),
  fecha: z.string(),
  funcionario: z.string().optional(),
  observacionesOS: z.string().optional(),
});

export const ItemPDFSchema = z.object({
  id: z.string(),
  descripcion: z.string(),
  cantidad: z.number().positive(),
  precio: z.number().nonnegative(),
  importe: z.number().nonnegative(),
});

export const TotalesSchema = z.object({
  importeTotal: z.number().nonnegative(),
  moneda: z.enum(["UYU", "USD"]),
});

export const RegistroBaseSchema = z.object({
  header: HeaderPDFSchema,
  items: z.array(ItemPDFSchema),
  totales: TotalesSchema,
});

export type HeaderPDF = z.infer<typeof HeaderPDFSchema>;
export type ItemPDF = z.infer<typeof ItemPDFSchema>;
export type Totales = z.infer<typeof TotalesSchema>;
export type RegistroBase = z.infer<typeof RegistroBaseSchema>;
