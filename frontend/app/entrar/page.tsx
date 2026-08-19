"use client";

import { useState } from "react";
import { crearClienteNavegador, faltaConfiguracion } from "@/lib/supabase";

export default function Entrar() {
  const [correo, setCorreo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const sinConfigurar = faltaConfiguracion();

  async function enviarEnlace(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const sb = crearClienteNavegador();
      const { error } = await sb.auth.signInWithOtp({
        email: correo,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) {
        // El mensaje real de Supabase ayuda a distinguir un correo mal escrito
        // de un límite de envío alcanzado o de registros deshabilitados.
        setError(`No pudimos enviar el enlace: ${error.message}`);
        return;
      }
      setEnviado(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos enviar el enlace.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="lienzo" style={{ maxWidth: "26rem", paddingTop: "5rem" }}>
      <div className="encabezado">
        <p className="logo" style={{ marginBottom: "1rem" }}>
          <span className="nombre">IA Labs</span>
          <span className="sufijo">Plataforma Agéntica</span>
        </p>
        <h1>Entrar</h1>
        <p>Te enviamos un enlace de acceso. Sin contraseñas que recordar.</p>
      </div>

      {sinConfigurar && (
        <div className="progreso-error" style={{ marginBottom: "1rem" }}>
          <h3>Falta configuración</h3>
          <p>
            Esta instalación no recibió las llaves públicas de acceso, así que el envío
            del enlace no puede funcionar todavía.
          </p>
          <p className="sugerencia">
            En Vercel, las variables <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no pueden estar marcadas como
            <strong> Sensitive</strong>: deben incrustarse al compilar. Corrige eso y
            vuelve a desplegar.
          </p>
        </div>
      )}

      {enviado ? (
        <div className="panel">
          <p>
            Revisa <strong>{correo}</strong>. El enlace llega en un minuto y te deja dentro
            directamente.
          </p>
        </div>
      ) : (
        <form onSubmit={enviarEnlace} className="via">
          <label htmlFor="correo" style={{ fontSize: ".88rem", fontWeight: 600 }}>
            Tu correo
          </label>
          <input
            id="correo"
            type="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="nombre@estudio.com"
            style={{
              padding: ".7rem .9rem",
              border: "1px solid var(--borde-fuerte)",
              borderRadius: "var(--r)",
              background: "var(--panel)",
              color: "var(--tinta)",
              font: "inherit",
            }}
          />
          <button className="btn" type="submit" disabled={enviando || !correo}>
            {enviando ? "Enviando…" : "Enviarme el enlace"}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
    </main>
  );
}
