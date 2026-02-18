"use client";

import { useState, useCallback, useRef } from "react";

interface PDFSummary {
  os: string;
  cliente: string;
  complejo: string;
  edificio: string;
  unidad: string;
  identificador: string;
  fecha: string;
  items: number;
  total: number;
  moneda: string;
}

interface ProcessResult {
  success: boolean;
  files: { gastos: string; reintegros: string };
  summaries: PDFSummary[];
  totalRows: number;
  error?: string;
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | File[]) => {
    const pdfs = Array.from(incoming).filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    if (pdfs.length === 0) {
      setError("Solo se aceptan archivos PDF");
      return;
    }
    setError(null);
    setResult(null);
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const nuevos = pdfs.filter((f) => !existing.has(f.name));
      return [...prev, ...nuevos];
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      for (const f of files) formData.append("pdfs", f);

      const res = await fetch("/api/procesar-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al procesar los PDFs");
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
    setFiles([]);
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
            Subí uno o más PDFs de órdenes de servicio y generá los Excel de Gastos y Reintegros
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Zona de drop */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center
              transition-all duration-200 cursor-pointer
              ${dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
              }
            `}
          >
            <div className="text-3xl mb-2">📁</div>
            <p className="font-medium text-slate-600">
              Arrastrá o hacé click para agregar PDFs
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Podés seleccionar múltiples archivos a la vez
            </p>
          </div>

          {/* Lista de archivos seleccionados */}
          {files.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">📄</span>
                    <span className="text-slate-700 truncate">{f.name}</span>
                    <span className="text-slate-400 shrink-0">
                      {(f.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="ml-3 text-slate-400 hover:text-red-500 transition-colors text-lg leading-none shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="px-4 py-2 bg-slate-50 rounded-b-xl text-xs text-slate-500">
                {files.length} archivo{files.length !== 1 ? "s" : ""} seleccionado{files.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={files.length === 0 || loading}
              className={`
                flex-1 py-3 px-6 rounded-lg font-semibold text-white
                transition-all duration-200
                ${files.length === 0 || loading
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
                  Procesando {files.length} PDF{files.length !== 1 ? "s" : ""}...
                </span>
              ) : (
                `Procesar ${files.length > 0 ? files.length : ""} PDF${files.length !== 1 ? "s" : ""}`
              )}
            </button>

            {(files.length > 0 || result) && (
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
            {/* Resumen de PDFs procesados */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-800">
                  {result.summaries.length} PDF{result.summaries.length !== 1 ? "s" : ""} procesado{result.summaries.length !== 1 ? "s" : ""}
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    — {result.totalRows} fila{result.totalRows !== 1 ? "s" : ""} en total
                  </span>
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {result.summaries.map((s, i) => (
                  <div key={i} className="px-6 py-3 text-sm grid grid-cols-4 gap-2">
                    <div>
                      <span className="text-slate-400 text-xs block">O.S.</span>
                      <span className="font-mono font-medium text-slate-800">{s.os}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Cliente</span>
                      <span className="text-slate-700 truncate block">{s.cliente}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Unidad</span>
                      <span className="text-slate-700">{s.identificador}{s.unidad} · Ed.{s.edificio}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-xs block">Total</span>
                      <span className="font-medium text-slate-800">
                        {s.moneda} {s.total.toLocaleString("es-UY", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de descarga */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => downloadBase64("Gastos.xlsx", result.files.gastos)}
                className="p-5 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all group"
              >
                <div className="text-2xl mb-2">📊</div>
                <p className="font-semibold text-blue-800">Excel Gastos</p>
                <p className="text-xs text-blue-500 mt-1 group-hover:underline">Descargar .xlsx</p>
              </button>

              <button
                onClick={() => downloadBase64("Reintegros.xlsx", result.files.reintegros)}
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
