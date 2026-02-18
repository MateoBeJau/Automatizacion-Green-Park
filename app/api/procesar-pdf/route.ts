import { NextRequest, NextResponse } from "next/server";
import { parsePDF } from "@/lib/parsers/pdf-parser";
import { mapToGastosRows, mapToReintegrosRows, calcularEdificio } from "@/lib/mappers";
import { generarExcelGastos, generarExcelReintegros } from "@/lib/generators";
import { cargarCatalogo } from "@/lib/catalogo/articulos";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const entries = formData.getAll("pdfs") as File[];

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: "Se requiere al menos un archivo PDF" },
        { status: 400 }
      );
    }

    const pdfs = entries.filter(
      (f) => f instanceof File && (f.type === "application/pdf" || f.name.endsWith(".pdf"))
    );

    if (pdfs.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron archivos PDF válidos" },
        { status: 400 }
      );
    }

    const catalogo = cargarCatalogo();

    const allGastosRows = [];
    const allReintegrosRows = [];
    const summaries = [];

    for (const file of pdfs) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const registroBase = await parsePDF(buffer);

      const rowsGastos = mapToGastosRows(registroBase);
      const rowsReintegros = mapToReintegrosRows(registroBase, catalogo);

      allGastosRows.push(...rowsGastos);
      allReintegrosRows.push(...rowsReintegros);

      summaries.push({
        os: registroBase.header.numeroOS,
        cliente: registroBase.header.cliente,
        complejo: registroBase.header.complejo,
        edificio: calcularEdificio(registroBase.header),
        unidad: registroBase.header.unidad,
        identificador: registroBase.header.identificador,
        fecha: registroBase.header.fecha,
        items: registroBase.items.length,
        total: registroBase.totales.importeTotal,
        moneda: registroBase.totales.moneda,
      });
    }

    const excelGastos = await generarExcelGastos(allGastosRows);
    const excelReintegros = await generarExcelReintegros(allReintegrosRows);

    return NextResponse.json({
      success: true,
      files: {
        gastos: excelGastos.toString("base64"),
        reintegros: excelReintegros.toString("base64"),
      },
      summaries,
      totalRows: allGastosRows.length,
    });
  } catch (error) {
    console.error("Error procesando PDFs:", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido al procesar los PDFs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
