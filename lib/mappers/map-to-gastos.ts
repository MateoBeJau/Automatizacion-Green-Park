import type { RegistroBase, RowGastos } from "@/lib/schemas";
import { calcularEdificio } from "./edificio";

const RUBRO_GASTOS = 113;
const SUBRUBRO_GASTOS = 1;

function convertirMoneda(moneda: string): "P" | "U" {
  return moneda === "USD" ? "U" : "P";
}

export function mapToGastosRows(registro: RegistroBase): RowGastos[] {
  const edificio = calcularEdificio(registro.header);
  const fecha = registro.header.fecha;
  const moneda = convertirMoneda(registro.header.moneda);

  if (registro.items.length === 0) {
    return [
      {
        edificio,
        fecha,
        rubro: RUBRO_GASTOS,
        subrubro: SUBRUBRO_GASTOS,
        tipo: "C",
        comprobante: registro.header.numeroOS.padStart(8, "0"),
        codigo: "E",
        unidad: registro.header.unidad,
        identificador: registro.header.identificador,
        importe: Math.round(registro.totales.importeTotal),
        moneda,
        descripcion: registro.header.observacionesOS?.toUpperCase(),
      },
    ];
  }

  return registro.items.map((item) => ({
    edificio,
    fecha,
    rubro: RUBRO_GASTOS,
    subrubro: SUBRUBRO_GASTOS,
    tipo: "C",
    comprobante: registro.header.numeroOS.padStart(8, "0"),
    codigo: "E" as const,
    unidad: registro.header.unidad,
    identificador: registro.header.identificador,
    importe: Math.round(item.importe),
    moneda,
    descripcion: `${item.cantidad} ${item.descripcion}`.toUpperCase(),
  }));
}
