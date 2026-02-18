// pdf-parse v1.1.1 — CommonJS module
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
import { RegistroBaseSchema, type RegistroBase, type ItemPDF } from "@/lib/schemas";

export async function parsePDF(buffer: Buffer): Promise<RegistroBase & { _rawText?: string }> {
  const data = await pdfParse(buffer);
  const texto: string = data.text;
  const registro = extractRegistroBase(texto);
  return { ...registro, _rawText: texto };
}

/**
 * Raw text from pdf-parse comes like this (fields concatenated, no spaces):
 *
 *   COBRANZA DE CONSUMOS
 *   NÚMEROMONEDA
 *   4323UYU
 *   O.S.COMPLEJOUNIDAD
 *   53482Green Park ID013
 *   CLIENTE
 *   GRAFF, Nestor
 *   FECHA:
 *   2026-02-18
 *   IDDescripciónFun.CantidadPrecioImporte
 *   1216
 *   MONOCOMANDO PARA BACHA RIMONTTI
 *   Michel Rodríguez
 *   1.001704.001704.00
 *   357
 *   Colilla M-H
 *   Michel Rodríguez
 *   2.00132.00264.00
 *   ...
 *   FORMA DE PAGO
 *   IMPORTE TOTAL
 *   UYU2,568.00
 *   ...
 *   DATOS ORDEN DE SERVICIO
 *   14/02/2026 - canilla pileta baño pierde | Generado: ...
 *   OBSERVACIONES
 */
function extractRegistroBase(texto: string): RegistroBase {
  const lines = texto.split("\n").map((l) => l.trim()).filter(Boolean);

  const header = extractHeader(lines);
  const items = extractItems(lines);

  const importeTotal = items.length > 0
    ? items.reduce((sum, item) => sum + item.importe, 0)
    : extractTotal(lines);

  return RegistroBaseSchema.parse({
    header,
    items,
    totales: {
      importeTotal: Math.round(importeTotal * 100) / 100,
      moneda: header.moneda,
    },
  });
}

function extractHeader(lines: string[]) {
  // --- NÚMERO and MONEDA ---
  // Line: "4323UYU" → número=4323, moneda=UYU
  let numeroDocumento = "";
  let moneda: "UYU" | "USD" = "UYU";
  for (const line of lines) {
    const m = line.match(/^(\d+)(UYU|USD)$/);
    if (m) {
      numeroDocumento = m[1];
      moneda = m[2] as "UYU" | "USD";
      break;
    }
  }

  // --- O.S., COMPLEJO, UNIDAD ---
  // Line: "53482Green Park ID013" → os=53482, complejo=Green Park I, unidadRaw=D013
  // Then "D013" splits into identificador="D" and unidad="013"
  let numeroOS = "";
  let complejo = "";
  let identificador = "";
  let unidad = "";
  for (const line of lines) {
    const m = line.match(/^(\d+)(.*?)([A-Z]\d{2,4})$/);
    if (m && m[2].match(/Green\s*Park/i)) {
      numeroOS = m[1];
      complejo = m[2].trim();
      const unidadRaw = m[3]; // e.g. "D013"
      identificador = unidadRaw.charAt(0); // "D"
      unidad = unidadRaw.substring(1);     // "013"
      break;
    }
  }

  // --- CLIENTE ---
  // Line after "CLIENTE": "GRAFF, Nestor"
  let cliente = "";
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === "CLIENTE" && i + 1 < lines.length) {
      cliente = lines[i + 1].trim();
      break;
    }
  }

  // --- FECHA ---
  // ISO format: "2026-02-18"
  let fecha = "";
  for (const line of lines) {
    const m = line.match(/(\d{4}-\d{2}-\d{2})/);
    if (m) { fecha = m[1]; break; }
  }

  // --- OBSERVACIONES (DATOS ORDEN DE SERVICIO) ---
  let observacionesOS: string | undefined;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/DATOS\s*ORDEN\s*DE\s*SERVICIO/i) && i + 1 < lines.length) {
      const obsLine = lines[i + 1].trim();
      // Format: "14/02/2026 - canilla pileta baño pierde | Generado: ..."
      const parts = obsLine.split("|");
      observacionesOS = parts[0].trim();
      break;
    }
  }

  // --- FUNCIONARIO ---
  // Appears in item rows, grab first occurrence of a name pattern
  let funcionario: string | undefined;
  for (const line of lines) {
    if (line.match(/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/) &&
        !line.match(/^(Green|FORMA|IMPORTE|DATOS|COBRANZA)/i)) {
      funcionario = line.trim();
      break;
    }
  }

  return {
    numeroDocumento,
    numeroOS,
    moneda,
    complejo,
    identificador,
    unidad,
    cliente,
    fecha,
    funcionario,
    observacionesOS,
  };
}

function extractItems(lines: string[]): ItemPDF[] {
  const items: ItemPDF[] = [];

  // Each item is 4 consecutive lines after the header row:
  //   Line 1: ID (just a number, e.g. "1216")
  //   Line 2: Description (text, e.g. "MONOCOMANDO PARA BACHA RIMONTTI")
  //   Line 3: Funcionario name (e.g. "Michel Rodríguez")
  //   Line 4: Numbers concatenated (e.g. "1.001704.001704.00")
  //
  // The numbers line has 3 decimal numbers concatenated: cantidad + precio + importe
  // Each number is \d+\.\d{2}, so we can split with: /^(\d+\.\d{2})(\d+\.\d{2})(\d+\.\d{2})$/

  // Find where items start (after the header row "IDDescripción...")
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^ID.*Descripci[oó]n.*Importe$/i) ||
        lines[i].match(/^IDDescripci[oó]n/i)) {
      startIdx = i + 1;
      break;
    }
  }
  if (startIdx === -1) return items;

  // Find where items end (at "FORMA DE PAGO" or "IMPORTE TOTAL")
  let endIdx = lines.length;
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].match(/^FORMA\s*DE\s*PAGO/i) || lines[i].match(/^IMPORTE\s*TOTAL/i)) {
      endIdx = i;
      break;
    }
  }

  const itemLines = lines.slice(startIdx, endIdx);

  // Parse groups of lines: look for the pattern ID → Description → Funcionario → Numbers
  let i = 0;
  while (i < itemLines.length) {
    const idLine = itemLines[i];

    // ID line: must be a number between 2-5 digits
    if (!idLine.match(/^\d{2,5}$/)) {
      i++;
      continue;
    }

    const id = idLine;

    // Description: next line (text)
    if (i + 1 >= itemLines.length) break;
    const descripcion = itemLines[i + 1].trim();

    // Funcionario: next line (name, skip it)
    // Numbers: could be on line i+2 or i+3 depending on if funcionario is present

    // Look for the numbers line in the next 2-3 lines
    let numbersLine = "";
    let skip = 2;
    for (let j = i + 2; j < Math.min(i + 4, itemLines.length); j++) {
      if (itemLines[j].match(/^\d+\.\d{2}/)) {
        numbersLine = itemLines[j];
        skip = j - i + 1;
        break;
      }
    }

    if (numbersLine) {
      const nums = parseNumbersLine(numbersLine);
      if (nums) {
        items.push({
          id,
          descripcion,
          cantidad: nums.cantidad,
          precio: nums.precio,
          importe: nums.importe,
        });
      }
    }

    i += skip;
  }

  return items;
}

/**
 * Parse concatenated numbers line like "1.001704.001704.00"
 * into { cantidad: 1.00, precio: 1704.00, importe: 1704.00 }
 */
function parseNumbersLine(line: string): { cantidad: number; precio: number; importe: number } | null {
  // Three decimal numbers concatenated: each is \d+\.\d{2}
  const m = line.match(/^(\d+\.\d{2})(\d+\.\d{2})(\d+\.\d{2})$/);
  if (m) {
    return {
      cantidad: parseFloat(m[1]),
      precio: parseFloat(m[2]),
      importe: parseFloat(m[3]),
    };
  }

  // Fallback: try with spaces
  const spaced = line.match(/(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{2})/);
  if (spaced) {
    return {
      cantidad: parseFloat(spaced[1]),
      precio: parseFloat(spaced[2]),
      importe: parseFloat(spaced[3]),
    };
  }

  return null;
}

function extractTotal(lines: string[]): number {
  for (const line of lines) {
    // "UYU2,568.00" or "USD1,234.56"
    const m = line.match(/(?:UYU|USD)([\d,]+\.\d{2})/);
    if (m) return parseNumber(m[1]);
  }
  return 0;
}

function parseNumber(str: string): number {
  const cleaned = str.trim().replace(/,/g, "");
  return parseFloat(cleaned);
}
