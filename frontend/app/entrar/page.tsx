"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador, faltaConfiguracion } from "@/lib/supabase";

/**
 * Dos formas de entrar. El enlace por correo es cómodo, pero depende de un
 * servicio de correo con límites: si falla, nadie puede entrar. La contraseña
 * no depende de nada externo, así que la plataforma nunca queda inaccesible.
 */

type Modo = "clave" | "enlace" | "registro";

export default function Entrar() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("clave");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const sinConfigurar = faltaConfiguracion();

  function traducir(mensaje: string): string {
    const m = mensaje.toLowerCase();
    if (m.includes("rate limit")) {
      return "Se alcanzó el límite de correos por hora. Entra con tu contraseña, o espera un rato.";
    }
    if (m.includes("invalid login credentials")) {
      return "Correo o contraseña incorrectos.";
    }
    if (m.includes("email not confirmed")) {
      return "Tu correo aún no está confirmado. Revisa el enlace que te enviamos.";
    }
    if (m.includes("user already registered") || m.includes("already been registered")) {
      return "Ya existe una cuenta con este correo. Entra con tu contraseña.";
    }
    if (m.includes("password should be")) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }
    return mensaje;
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);

    try {
      const sb = crearClienteNavegador();

      if (modo === "enlace") {
        const { error } = await sb.auth.signInWithOtp({
          email: correo,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw new Error(error.message);
        setEnviado(true);
        return;
      }

      if (modo === "registro") {
        const { data, error } = await sb.auth.signUp({ email: correo, password: clave });
        if (error) throw new Error(error.message);
        // Si la confirmación por correo está activa, no hay sesión todavía
        if (!data.session) {
          setEnviado(true);
          return;
        }
        router.push("/");
        router.refresh();
        return;
      }

      const { error } = await sb.auth.signInWithPassword({ email: correo, password: clave });
      if (error) throw new Error(error.message);
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(traducir(e instanceof Error ? e.message : "No pudimos completar la acción."));
    } finally {
      setOcupado(false);
    }
  }

  const estiloCampo = {
    padding: ".7rem .9rem",
    border: "1px solid var(--borde-fuerte)",
    borderRadius: "var(--r)",
    background: "var(--panel)",
    color: "var(--tinta)",
    font: "inherit",
    width: "100%",
  } as const;

  return (
    <main className="lienzo" style={{ maxWidth: "27rem", paddingTop: "4rem" }}>
      <div className="encabezado">
        <p className="logo" style={{ marginBottom: "1rem" }}>
          <span className="nombre">IA Labs</span>
          <span className="sufijo">Plataforma Agéntica</span>
        </p>
        <h1>{modo === "registro" ? "Crear cuenta" : "Entrar"}</h1>
        <p>
          {modo === "clave" && "Usa tu correo y contraseña."}
          {modo === "enlace" && "Te enviamos un enlace de acceso, sin contraseñas."}
          {modo === "registro" && "Elige una contraseña para entrar cuando quieras."}
        </p>
      </div>

      {sinConfigurar && (
        <div className="progreso-error" style={{ marginBottom: "1rem" }}>
          <h3>Falta configuración</h3>
          <p>
            Esta instalación no recibió las llaves públicas de acceso, así que entrar no
            puede funcionar todavía.
          </p>
          <p className="sugerencia">
            En Vercel, <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no pueden estar marcadas como
            <strong> Sensitive</strong>: deben incrustarse al compilar.
          </p>
        </div>
      )}

      {enviado ? (
        <div className="panel">
          <p>
            Revisa <strong>{correo}</strong>. El enlace llega en un minuto y te deja dentro.
          </p>
          <button className="btn-secundario" onClick={() => { setEnviado(false); setModo("clave"); }}>
            Volver
          </button>
        </div>
      ) : (
        <form onSubmit={enviar} className="via">
          <label htmlFor="correo" style={{ fontSize: ".88rem", fontWeight: 600 }}>
            Tu correo
          </label>
          <input
            id="correo"
            type="email"
            required
            autoComplete="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="nombre@estudio.com"
            style={estiloCampo}
          />

          {modo !== "enlace" && (
            <>
              <label htmlFor="clave" style={{ fontSize: ".88rem", fontWeight: 600 }}>
                Contraseña
              </label>
              <input
                id="clave"
                type="password"
                required
                minLength={6}
                autoComplete={modo === "registro" ? "new-password" : "current-password"}
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder={modo === "registro" ? "Al menos 6 caracteres" : ""}
                style={estiloCampo}
              />
            </>
          )}

          <button className="btn" type="submit" disabled={ocupado || sinConfigurar || !correo}>
            {ocupado
              ? "Un momento…"
              : modo === "enlace"
              ? "Enviarme el enlace"
              : modo === "registro"
              ? "Crear cuenta y entrar"
              : "Entrar"}
          </button>

          {error && <p className="error">{error}</p>}

          <div style={{ display: "flex", flexDirection: "column", gap: ".4rem", marginTop: ".3rem" }}>
            {modo !== "clave" && (
              <button type="button" className="enlace-modo" onClick={() => { setModo("clave"); setError(null); }}>
                Entrar con contraseña
              </button>
            )}
            {modo !== "enlace" && (
              <button type="button" className="enlace-modo" onClick={() => { setModo("enlace"); setError(null); }}>
                Prefiero un enlace por correo
              </button>
            )}
            {modo !== "registro" && (
              <button type="button" className="enlace-modo" onClick={() => { setModo("registro"); setError(null); }}>
                ¿Primera vez? Crear cuenta
              </button>
            )}
          </div>
        </form>
      )}
    </main>
  );
}
