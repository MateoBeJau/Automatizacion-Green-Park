import fs from "fs";
import path from "path";

export interface Articulo {
  nombre: string;
  subrubro: number;
}

export type CatalogoMap = Map<string, number>;

function normalizar(nombre: string): string {
  return nombre.toLowerCase().trim().replace(/\s+/g, " ");
}

let catalogoCache: CatalogoMap | null = null;

export function cargarCatalogo(): CatalogoMap {
  if (catalogoCache) return catalogoCache;

  const rutaArchivo = path.join(process.cwd(), "data", "Articulos.txt");
  const contenido = fs.readFileSync(rutaArchivo, "utf-8");
  const lineas = contenido.split("\n").slice(1); // skip header

  const catalogo: CatalogoMap = new Map();

  for (const linea of lineas) {
    const trimmed = linea.trim();
    if (!trimmed) continue;

    const ultimoTab = trimmed.lastIndexOf("\t");
    if (ultimoTab === -1) continue;

    const nombre = trimmed.substring(0, ultimoTab).trim();
    const subrubroStr = trimmed.substring(ultimoTab + 1).trim();
    const subrubro = parseInt(subrubroStr, 10);

    if (nombre && !isNaN(subrubro)) {
      catalogo.set(normalizar(nombre), subrubro);
    }
  }

  catalogoCache = catalogo;
  return catalogo;
}

const SUBRUBRO_DEFAULT = 22;

export function buscarSubrubro(
  nombreArticulo: string,
  catalogo: CatalogoMap
): number {
  const nombreNorm = normalizar(nombreArticulo);

  const exacto = catalogo.get(nombreNorm);
  if (exacto !== undefined) return exacto;

  // Fuzzy: buscar si alguna key del catálogo está contenida en el nombre o viceversa
  for (const [key, subrubro] of catalogo) {
    if (nombreNorm.includes(key) || key.includes(nombreNorm)) {
      return subrubro;
    }
  }

  console.warn(
    `⚠️ Artículo no encontrado en catálogo: "${nombreArticulo}" → usando subrubro ${SUBRUBRO_DEFAULT}`
  );
  return SUBRUBRO_DEFAULT;
}
