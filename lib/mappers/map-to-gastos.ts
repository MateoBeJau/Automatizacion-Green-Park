import type { RegistroBase, RowGastos } from "@/lib/schemas";
import { type CatalogoMap, buscarSubrubro } from "@/lib/catalogo/articulos";
import { calcularEdificio } from "./edificio";

const RUBRO_GASTOS = 113;

export function mapToGastosRows(
  registro: RegistroBase,
  catalogo: CatalogoMap
): RowGastos[] {
  const edificio = calcularEdificio(registro.header);

  if (registro.items.length === 0) {
    return [
      {
        edificio,
        rubro: RUBRO_GASTOS,
        subrubro: 22,
        tipo: "C",
        comprobante: registro.header.numeroOS.padStart(8, "0"),
        codigo: "E",
        unidad: registro.header.unidad,
        identificador: registro.header.identificador,
        importe: registro.totales.importeTotal,
        moneda: registro.totales.moneda,
        descripcion: registro.header.observacionesOS,
      },
    ];
  }

  return registro.items.map((item) => {
    const subrubro = buscarSubrubro(item.descripcion, catalogo);

    return {
      edificio,
      rubro: RUBRO_GASTOS,
      subrubro,
      tipo: "C",
      comprobante: registro.header.numeroOS.padStart(8, "0"),
      codigo: "E" as const,
      unidad: registro.header.unidad,
      identificador: registro.header.identificador,
      importe: item.importe,
      moneda: registro.header.moneda,
      descripcion: `${item.cantidad} ${item.descripcion}`,
    };
  });
}
