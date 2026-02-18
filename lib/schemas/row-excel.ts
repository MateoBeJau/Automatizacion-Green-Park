import { z } from "zod";

export const RowGastosSchema = z.object({
  edificio: z.string().optional(),
  nombreEdificio: z.string().optional(),
  fecha: z.string().optional(),
  observaciones: z.string().max(20).optional(),
  rubro: z.number().int().positive(),
  subrubro: z.number().int().positive(),
  tipo: z.string(),
  iva: z.string().optional(),
  comprobante: z.string().max(8),
  cotizacion: z.string().optional(),
  codigo: z.enum(["E", "P"]),
  conceptoCtaParticular: z.string().optional(),
  clase: z.string().optional(),
  empresa: z.string().optional(),
  unidad: z.string().optional(),
  identificador: z.string().optional(),
  importe: z.number().int().nonnegative(),
  moneda: z.enum(["P", "U"]),
  descripcion: z.string().optional(),
});

export const RowReintegrosSchema = z.object({
  edificio: z.string().optional(),
  nombreEdificio: z.string().optional(),
  fecha: z.string().optional(),
  observaciones: z.string().max(20).optional(),
  rubro: z.literal(412),
  subrubro: z.number().int().positive(),
  tipo: z.string(),
  iva: z.string().optional(),
  comprobante: z.string().max(8),
  cotizacion: z.string().optional(),
  codigo: z.enum(["E", "P"]),
  conceptoCtaParticular: z.string().optional(),
  clase: z.string().optional(),
  empresa: z.string().optional(),
  importe: z.number().int().nonnegative(),
  moneda: z.enum(["P", "U"]),
  descripcion: z.string().optional(),
});

export type RowGastos = z.infer<typeof RowGastosSchema>;
export type RowReintegros = z.infer<typeof RowReintegrosSchema>;
