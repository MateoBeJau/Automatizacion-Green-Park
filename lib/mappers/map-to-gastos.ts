import type { RegistroBase, RowGastos } from "@/lib/schemas";
import { calcularEdificio } from "./edificio";

const RUBRO_GASTOS = 113;
const SUBRUBRO_GASTOS = 1;

export function mapToGastosRows(registro: RegistroBase): RowGastos[] {
  const edificio = calcularEdificio(registro.header);

  if (registro.items.length === 0) {
    return [
      {
        edificio,
        rubro: RUBRO_GASTOS,
        subrubro: SUBRUBRO_GASTOS,
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

  return registro.items.map((item) => ({
    edificio,
    rubro: RUBRO_GASTOS,
    subrubro: SUBRUBRO_GASTOS,
    tipo: "C",
    comprobante: registro.header.numeroOS.padStart(8, "0"),
    codigo: "E" as const,
    unidad: registro.header.unidad,
    identificador: registro.header.identificador,
    importe: item.importe,
    moneda: registro.header.moneda,
    descripcion: `${item.cantidad} ${item.descripcion}`,
  }));
}
