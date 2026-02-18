import type { RegistroBase, RowReintegros } from "@/lib/schemas";
import { type CatalogoMap, buscarSubrubro } from "@/lib/catalogo/articulos";
import { calcularEdificio } from "./edificio";

const RUBRO_REINTEGROS = 412;

export function mapToReintegrosRows(
  registro: RegistroBase,
  catalogo: CatalogoMap
): RowReintegros[] {
  const unidadCompleta = `${registro.header.identificador}${registro.header.unidad}`;
  const edificio = calcularEdificio(registro.header);
  const fecha = registro.header.fecha;

  if (registro.items.length === 0) {
    return [
      {
        edificio,
        fecha,
        rubro: RUBRO_REINTEGROS,
        subrubro: 22,
        tipo: "C",
        comprobante: registro.header.numeroOS.padStart(8, "0"),
        codigo: "E",
        importe: registro.totales.importeTotal,
        moneda: registro.totales.moneda,
        descripcion: `${registro.header.observacionesOS ?? ""} ${unidadCompleta}`.trim(),
      },
    ];
  }

  return registro.items.map((item) => {
    const subrubro = buscarSubrubro(item.descripcion, catalogo);

    return {
      edificio,
      fecha,
      rubro: RUBRO_REINTEGROS as 412,
      subrubro,
      tipo: "C",
      comprobante: registro.header.numeroOS.padStart(8, "0"),
      codigo: "E" as const,
      importe: item.importe,
      moneda: registro.header.moneda,
      descripcion: `${item.cantidad} ${item.descripcion} ${unidadCompleta}`,
    };
  });
}
