"use client";

import { useState, useCallback, useRef } from "react";

interface ItemPDF {
  id: string;
  descripcion: string;
  cantidad: number;
  precio: number;
  importe: number;
}

interface Metadata {
  items: number;
  os: string;
  complejo: string;
  identificador: string;
  unidad: string;
  cliente: string;
  fecha: string;
  total: number;
  moneda: string;
  edificio: string;
}

interface ProcessResult {
  success: boolean;
  files: { gastos: string; reintegros: string };
  metadata: Metadata;
  registro: { items: ItemPDF[] };
  error?: string;
  _debug?: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile);
      setResult(null);
      setError(null);
    } else {
      setError("Solo se aceptan archivos PDF");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch("/api/procesar-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al procesar el PDF");
        return;
      }

      setResult(data);
    } catch {
      setError("Error de conexión al servidor");
    } finally {
      setLoading(false);
    }
  };

  const downloadBase64 = (filename: string, base64: string) => {
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Green Park — Automatización
          </h1>
          <p className="text-slate-500">
            Subí un PDF de orden de servicio y generá los Excel de Gastos y
            Reintegros
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl p-10 text-center
              transition-all duration-200 cursor-pointer
              ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : file
                    ? "border-green-400 bg-green-50"
                    : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
              }
            `}
          >
            {file ? (
              <div>
                <div className="text-4xl mb-3">📄</div>
                <p className="text-lg font-medium text-green-700">{file.name}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB — Listo para procesar
                </p>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-3">📁</div>
                <p className="text-lg font-medium text-slate-600">
                  Arrastrá o hacé click para subir un PDF
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Formato: Orden de Servicio (.pdf)
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!file || loading}
              className={`
                flex-1 py-3 px-6 rounded-lg font-semibold text-white
                transition-all duration-200
                ${
                  !file || loading
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg"
                }
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Procesando...
                </span>
              ) : (
                "Procesar PDF"
              )}
            </button>

            {(file || result) && (
              <button
                type="button"
                onClick={reset}
                className="py-3 px-6 rounded-lg font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-all"
              >
                Limpiar
              </button>
            )}
          </div>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {result?.success && (
          <div className="mt-8 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Datos extraídos del PDF
              </h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">O.S.</span>
                  <p className="font-medium text-slate-800">{result.metadata.os || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Identificador</span>
                  <p className="font-medium text-slate-800">{result.metadata.identificador || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Unidad</span>
                  <p className="font-medium text-slate-800">{result.metadata.unidad || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Fecha</span>
                  <p className="font-medium text-slate-800">{result.metadata.fecha || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Cliente</span>
                  <p className="font-medium text-slate-800">{result.metadata.cliente || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Complejo</span>
                  <p className="font-medium text-slate-800">{result.metadata.complejo || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500">N° Edificio</span>
                  <p className="font-medium text-slate-800">{result.metadata.edificio || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Total</span>
                  <p className="font-medium text-slate-800">
                    {result.metadata.moneda}{" "}
                    {result.metadata.total.toLocaleString("es-UY", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {result.registro?.items?.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-slate-600 mb-2">
                    Artículos ({result.registro.items.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-slate-200">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600">
                          <th className="px-2 py-1.5 text-left border-b">ID</th>
                          <th className="px-2 py-1.5 text-left border-b">Descripción</th>
                          <th className="px-2 py-1.5 text-right border-b">Cant.</th>
                          <th className="px-2 py-1.5 text-right border-b">Precio</th>
                          <th className="px-2 py-1.5 text-right border-b">Importe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.registro.items.map((item, idx) => (
                          <tr key={idx} className="border-t border-slate-100">
                            <td className="px-2 py-1.5 font-mono">{item.id}</td>
                            <td className="px-2 py-1.5">{item.descripcion}</td>
                            <td className="px-2 py-1.5 text-right">{item.cantidad}</td>
                            <td className="px-2 py-1.5 text-right">{item.precio.toFixed(2)}</td>
                            <td className="px-2 py-1.5 text-right font-medium">{item.importe.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {result._debug && (
              <details className="bg-slate-800 rounded-xl p-4 text-xs">
                <summary className="text-slate-300 cursor-pointer font-medium">
                  Texto raw del PDF (debug)
                </summary>
                <pre className="mt-3 text-green-400 whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {result._debug}
                </pre>
              </details>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => downloadBase64(`Gastos_OS${result.metadata.os}.xlsx`, result.files.gastos)}
                className="p-5 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all group"
              >
                <div className="text-2xl mb-2">📊</div>
                <p className="font-semibold text-blue-800">Excel Gastos</p>
                <p className="text-xs text-blue-500 mt-1 group-hover:underline">Descargar .xlsx</p>
              </button>

              <button
                onClick={() => downloadBase64(`Reintegros_OS${result.metadata.os}.xlsx`, result.files.reintegros)}
                className="p-5 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-all group"
              >
                <div className="text-2xl mb-2">📋</div>
                <p className="font-semibold text-green-800">Excel Reintegros</p>
                <p className="text-xs text-green-500 mt-1 group-hover:underline">Descargar .xlsx</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
