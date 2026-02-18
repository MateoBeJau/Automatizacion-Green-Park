import ExcelJS from "exceljs";
import type { RowReintegros } from "@/lib/schemas";

const COLUMNS = [
  { header: "N° de edificio/empresa\n(caja/movimiento)", key: "edificio", width: 22 },
  { header: "Fecha", key: "fecha", width: 12 },
  { header: "Unidad", key: "unidad", width: 10 },
  { header: "Identificador", key: "identificador", width: 14 },
  { header: "Importe", key: "importe", width: 12 },
  { header: "Moneda", key: "moneda", width: 8 },
  { header: "Descripción", key: "descripcion", width: 30 },
  {
    header: "Observaciones\n(Máximo 20 caracteres\nnro del concepto mov)",
    key: "observaciones",
    width: 22,
  },
  { header: "Rubro\n(rubro movimiento)", key: "rubro", width: 10 },
  { header: "Subrubro\n(subrubro movimiento)", key: "subrubro", width: 12 },
  { header: "Tipo\n(\"C\" caja/ \"D\" diario)", key: "tipo", width: 10 },
  { header: "IVA\n(Codigo Iva)", key: "iva", width: 8 },
  { header: "Comprobante\n(8 caracteres numéricos)", key: "comprobante", width: 14 },
  { header: "Cotización\n(TC)", key: "cotizacion", width: 10 },
  { header: "Codigo\n(E = Expensas | P = Particular)", key: "codigo", width: 12 },
  { header: "Concepto de\nCta. Particular", key: "conceptoCtaParticular", width: 14 },
  { header: "Clase", key: "clase", width: 8 },
  { header: "Empresa", key: "empresa", width: 10 },
];

export async function generarExcelReintegros(rows: RowReintegros[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Reintegros");

  sheet.columns = COLUMNS;

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 9 };
  headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRow.height = 50;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2EFDA" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  for (const row of rows) {
    // En reintegros: unidad e identificador van vacíos
    const excelRow = sheet.addRow({
      edificio: row.edificio ?? "",
      fecha: row.fecha ?? "",
      unidad: "",
      identificador: "",
      importe: row.importe,
      moneda: row.moneda,
      descripcion: row.descripcion ?? "",
      observaciones: row.observaciones,
      rubro: row.rubro,
      subrubro: row.subrubro,
      tipo: row.tipo,
      iva: row.iva ?? "",
      comprobante: row.comprobante,
      cotizacion: row.cotizacion ?? "",
      codigo: row.codigo,
      conceptoCtaParticular: row.conceptoCtaParticular ?? "",
      clase: row.clase ?? "",
      empresa: row.empresa ?? "",
    });

    excelRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
