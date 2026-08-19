"use client";

import { useEffect, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase";

/**
 * Visor de los tres entregables. La pestaña de diagrama renderiza el Mermaid
 * generado por el agente; las otras dos muestran el SOP y el flujo ejecutable.
 */

type Pestana = "diagrama" | "sop" | "workflow";

type Entregable = { type: string; content: Record<string, unknown> };

type Proceso = {
  id: string;
  name: string;
  kind: "as_is" | "to_be" | "rediseñado";
  evidence_gaps: string[] | string;
  canonical: Record<string, unknown> | string;
};

const NIVELES: Record<string, { etiqueta: string; clase: string }> = {
  L0: { etiqueta: "Solo informa · criterio humano", clase: "n0" },
  L1: { etiqueta: "Propone y espera decisión", clase: "n1" },
  L2: { etiqueta: "Ejecuta con aprobación", clase: "n2" },
  L3: { etiqueta: "Autónomo con auditoría", clase: "n3" },
};

function comoObjeto<T>(valor: unknown, respaldo: T): T {
  let v = valor;
  for (let i = 0; i < 3 && typeof v === "string"; i++) {
    try {
      v = JSON.parse(v);
    } catch {
      return respaldo;
    }
  }
  return (v as T) ?? respaldo;
}

export default function VisorEntregables({ procesoId }: { procesoId: string }) {
  const [pestana, setPestana] = useState<Pestana>("diagrama");
  const [proceso, setProceso] = useState<Proceso | null>(null);
  const [entregables, setEntregables] = useState<Entregable[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const sb = crearClienteNavegador();
    (async () => {
      const [p, d] = await Promise.all([
        sb.from("processes").select("id, name, kind, evidence_gaps, canonical").eq("id", procesoId).single(),
        sb.from("deliverables").select("type, content").eq("process_id", procesoId),
      ]);
      if (p.data) setProceso(p.data as unknown as Proceso);
      if (d.data) setEntregables(d.data as unknown as Entregable[]);
      setCargando(false);
    })();
  }, [procesoId]);

  useEffect(() => {
    // El runtime de artifacts/mermaid re-renderiza al cambiar de pestaña
    if (pestana === "diagrama" && typeof window !== "undefined") {
      const w = window as unknown as { mermaid?: { run: () => void } };
      w.mermaid?.run();
    }
  }, [pestana, entregables]);

  if (cargando) return <p className="cargando">Cargando tus entregables…</p>;
  if (!proceso) return <p className="cargando">No encontramos este proceso.</p>;

  const diagrama = entregables.find((e) => e.type === "diagrama");
  const sop = entregables.find((e) => e.type === "sop");
  const flujo = entregables.find((e) => e.type === "workflow_n8n");

  const mermaid = comoObjeto<{ mermaid?: string }>(diagrama?.content, {}).mermaid ?? "";
  const markdown = comoObjeto<{ markdown?: string }>(sop?.content, {}).markdown ?? "";
  const flujoDatos = comoObjeto<{
    pasos_automatizados?: number;
    pasos_humanos?: number;
    notas_activacion?: string[];
    workflow?: { nodes?: { name: string; notes?: string }[] };
  }>(flujo?.content, {});

  const canonical = comoObjeto<{ steps?: { id: string; name: string; automation?: { effective_autonomy?: string } }[] }>(
    proceso.canonical,
    {}
  );
  const vacios = comoObjeto<string[]>(proceso.evidence_gaps, []);
  const minutos =
    comoObjeto<{ metrics_estimate?: { automatable_minutes_per_run?: number } }>(proceso.canonical, {})
      .metrics_estimate?.automatable_minutes_per_run ?? 0;

  return (
    <div className="visor">
      <header className="visor-cabecera">
        <div>
          <h2>{proceso.name}</h2>
          <p className="tipo-proceso">
            {proceso.kind === "as_is" ? (
              <span className="sello real">Reconstruido de tu operación real</span>
            ) : (
              <span className="sello propuesto">Diseño propuesto · evidencia insuficiente</span>
            )}
          </p>
        </div>
        {minutos > 0 && (
          <div className="metrica-destacada">
            <strong>{minutos} min</strong>
            <span>automatizables por caso</span>
          </div>
        )}
      </header>

      {proceso.kind !== "as_is" && vacios.length > 0 && (
        <div className="banner-vacios">
          <strong>Diseñamos este proceso en vez de reconstruirlo.</strong> Tus documentos no
          describían el proceso completo. Esto es lo que falta aclarar:
          <ul>
            {vacios.slice(0, 4).map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </div>
      )}

      <nav className="pestanas" role="tablist">
        {(
          [
            ["diagrama", "Diagrama"],
            ["sop", "Procedimiento"],
            ["workflow", "Flujo ejecutable"],
          ] as [Pestana, string][]
        ).map(([id, texto]) => (
          <button
            key={id}
            role="tab"
            aria-selected={pestana === id}
            className={pestana === id ? "activa" : ""}
            onClick={() => setPestana(id)}
          >
            {texto}
          </button>
        ))}
      </nav>

      {pestana === "diagrama" && (
        <div className="panel">
          <div className="leyenda">
            {Object.entries(NIVELES).map(([k, v]) => (
              <span key={k} className={`pastilla ${v.clase}`}>
                <span className="pt" />
                {k} · {v.etiqueta}
              </span>
            ))}
          </div>
          <div className="lienzo-diagrama">
            <pre className="mermaid">{mermaid}</pre>
          </div>
        </div>
      )}

      {pestana === "sop" && (
        <div className="panel">
          <article className="sop">{markdown}</article>
        </div>
      )}

      {pestana === "workflow" && (
        <div className="panel">
          <div className="resumen-flujo">
            <div>
              <strong>{flujoDatos.pasos_automatizados ?? 0}</strong>
              <span>pasos automatizables</span>
            </div>
            <div>
              <strong>{flujoDatos.pasos_humanos ?? 0}</strong>
              <span>reservados a tu criterio</span>
            </div>
          </div>

          <ul className="lista-nodos">
            {(canonical.steps ?? []).map((s) => {
              const nivel = s.automation?.effective_autonomy ?? "L0";
              const info = NIVELES[nivel] ?? NIVELES.L0;
              return (
                <li key={s.id} className={info.clase}>
                  <span className="nombre">{s.name}</span>
                  <span className={`pastilla ${info.clase}`}>
                    <span className="pt" />
                    {nivel}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="aviso-activacion">
            <strong>Antes de activarlo.</strong> El flujo es un borrador funcional: necesita
            credenciales y una revisión tuya. Los pasos de criterio profesional quedan siempre
            en tus manos.
          </div>

          <button className="btn-activar" disabled title="Disponible al conectar tu ambiente">
            Activar en mi ambiente
          </button>
        </div>
      )}
    </div>
  );
}
