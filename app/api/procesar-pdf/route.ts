import { NextRequest, NextResponse } from "next/server";
import { parsePDF } from "@/lib/parsers/pdf-parser";
import { mapToGastosRows, mapToReintegrosRows, calcularEdificio } from "@/lib/mappers";
import { generarExcelGastos, generarExcelReintegros } from "@/lib/generators";
import { cargarCatalogo } from "@/lib/catalogo/articulos";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Se requiere un archivo PDF válido" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const catalogo = cargarCatalogo();

    const registroBase = await parsePDF(buffer);

    const rowsGastos = mapToGastosRows(registroBase);
    const rowsReintegros = mapToReintegrosRows(registroBase, catalogo);

    const metadata = {
      complejo: registroBase.header.complejo,
      fecha: registroBase.header.fecha,
    };

    const excelGastos = await generarExcelGastos(rowsGastos, metadata);
    const excelReintegros = await generarExcelReintegros(rowsReintegros, metadata);

    return NextResponse.json({
      success: true,
      files: {
        gastos: excelGastos.toString("base64"),
        reintegros: excelReintegros.toString("base64"),
      },
      metadata: {
        items: registroBase.items.length,
        os: registroBase.header.numeroOS,
        complejo: registroBase.header.complejo,
        identificador: registroBase.header.identificador,
        unidad: registroBase.header.unidad,
        cliente: registroBase.header.cliente,
        fecha: registroBase.header.fecha,
        total: registroBase.totales.importeTotal,
        moneda: registroBase.totales.moneda,
        edificio: calcularEdificio(registroBase.header),
      },
      registro: registroBase,
      _debug: (registroBase as Record<string, unknown>)._rawText,
    });
  } catch (error) {
    console.error("Error procesando PDF:", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido al procesar el PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
