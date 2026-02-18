import type { HeaderPDF } from "@/lib/schemas";

const GP_II_REGEX = /green\s*park\s*(ii|2)/i;

/**
 * Green Park I → "1"
 * Green Park II + identificador != "P" → "1"
 * Green Park II + identificador == "P" → "4" (torre P = edificio 4)
 */
export function calcularEdificio(header: HeaderPDF): string {
  if (GP_II_REGEX.test(header.complejo)) {
    if (header.identificador.toUpperCase() === "P") {
      return "4";
    }
    return "1";
  }

  return "1";
}
