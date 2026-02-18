import type { RegistroBase, RowReintegros } from "@/lib/schemas";
import { type CatalogoMap, buscarSubrubro } from "@/lib/catalogo/articulos";
import { calcularEdificio } from "./edificio";

const RUBRO_REINTEGROS = 412;

function convertirMoneda(moneda: string): "P" | "U" {
  return moneda === "USD" ? "U" : "P";
}

export function mapToReintegrosRows(
  registro: RegistroBase,
  catalogo: CatalogoMap
): RowReintegros[] {
  const unidadCompleta = `${registro.header.identificador}${registro.header.unidad}`;
  const edificio = calcularEdificio(registro.header);
  const fecha = registro.header.fecha;
  const moneda = convertirMoneda(registro.header.moneda);

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
        importe: Math.round(registro.totales.importeTotal),
        moneda,
        descripcion: `${registro.header.observacionesOS ?? ""} ${unidadCompleta}`.trim().toUpperCase(),
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
      importe: Math.round(item.importe),
      moneda,
      descripcion: `${item.cantidad} ${item.descripcion} ${unidadCompleta}`.toUpperCase(),
    };
  });
}
