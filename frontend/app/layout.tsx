import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plataforma Agéntica — IA Labs",
  description:
    "Descubre, rediseña y automatiza tus procesos con agentes de IA operando en tu propio ambiente, con autonomía gobernada y auditoría completa.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <header className="barra-superior">
          <div className="barra-interior">
            <Link href="/" className="logo">
              <span className="nombre">IA Labs</span>
              <span className="sufijo">Plataforma Agéntica</span>
            </Link>
            <nav className="nav-links">
              <Link href="/">Procesos</Link>
              <Link href="/aprobaciones">Aprobaciones</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
