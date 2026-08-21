"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase";

/**
 * Crear un proceso desde la propia plataforma. Sin esto el cliente no puede
 * empezar nada por su cuenta, que era el hueco más grande del piloto.
 */

const TIPOS = [
  { valor: "auto", etiqueta: "Que lo detecte el agente", ayuda: "Recomendado: lo deduce de tus materiales" },
  { valor: "intake_casos", etiqueta: "Intake de casos", ayuda: "Recepción y asignación de asuntos nuevos" },
  { valor: "revision_contratos", etiqueta: "Revisión de contratos", ayuda: "Análisis, observaciones y aprobación" },
  { valor: "respuesta_requerimientos", etiqueta: "Respuesta a requerimientos", ayuda: "Requerimientos con plazo" },
  { valor: "otro", etiqueta: "Otro", ayuda: "Cualquier otro proceso de tu operación" },
];

export default function NuevoProceso({ organizacionId }: { organizacionId: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("auto");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);

    const sb = crearClienteNavegador();
    const { data, error } = await sb
      .from("projects")
      .insert({ organization_id: organizacionId, name: nombre.trim(), process_type: tipo })
      .select("id")
      .single();

    setOcupado(false);

    if (error || !data) {
      setError("No pudimos crear el proceso. Inténtalo de nuevo.");
      return;
    }

    // Llevarlo directo a cargar materiales: crear un proceso vacío no sirve de nada
    router.push(`/proyecto/${data.id}`);
    router.refresh();
  }

  if (!abierto) {
    return (
      <button className="btn btn-grande" onClick={() => setAbierto(true)}>
        + Nuevo proceso
      </button>
    );
  }

  return (
    <form onSubmit={crear} className="via" style={{ maxWidth: "34rem" }}>
      <h2>Nuevo proceso</h2>
      <p className="desc">¿Qué proceso de tu operación quieres entender y mejorar?</p>

      <label htmlFor="nombre" style={{ fontSize: ".88rem", fontWeight: 600 }}>
        Nombre del proceso
      </label>
      <input
        id="nombre"
        required
        autoFocus
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Ej.: Revisión de contratos laborales"
        style={{
          padding: ".7rem .9rem",
          border: "1px solid var(--borde-fuerte)",
          borderRadius: "var(--r)",
          background: "var(--panel)",
          color: "var(--tinta)",
          font: "inherit",
        }}
      />

      <fieldset style={{ border: "none", display: "flex", flexDirection: "column", gap: ".4rem" }}>
        <legend style={{ fontSize: ".88rem", fontWeight: 600, marginBottom: ".4rem" }}>
          Tipo de proceso
        </legend>
        {TIPOS.map((t) => (
          <label key={t.valor} className={`opcion-tipo ${tipo === t.valor ? "elegida" : ""}`}>
            <input
              type="radio"
              name="tipo"
              value={t.valor}
              checked={tipo === t.valor}
              onChange={() => setTipo(t.valor)}
            />
            <span>
              <strong>{t.etiqueta}</strong>
              <small>{t.ayuda}</small>
            </span>
          </label>
        ))}
      </fieldset>

      {error && <p className="error">{error}</p>}

      <div style={{ display: "flex", gap: ".6rem" }}>
        <button className="btn" type="submit" disabled={ocupado || !nombre.trim()}>
          {ocupado ? "Creando…" : "Crear y añadir materiales"}
        </button>
        <button type="button" className="btn-secundario" onClick={() => setAbierto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
