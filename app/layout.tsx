import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Green Park — Automatización PDF",
  description: "Extracción de datos PDF y generación de Excel para Gastos y Reintegros",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
