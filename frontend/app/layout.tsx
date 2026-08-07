import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plataforma Agéntica — IA Labs",
  description:
    "Descubre, rediseña y automatiza tus procesos con agentes de IA operando en tu propio ambiente, con autonomía gobernada y auditoría completa.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
