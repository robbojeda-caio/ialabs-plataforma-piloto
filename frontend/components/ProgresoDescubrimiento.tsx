"use client";

import { useEffect, useState } from "react";
import { crearClienteNavegador, type AgentRun } from "@/lib/supabase";

/**
 * Progreso en vivo del descubrimiento.
 *
 * Escucha la tabla agent_runs por Realtime: el agente escribe ahí su avance
 * en lenguaje natural, así que la espera muestra qué está pasando y no una
 * barra genérica. Si Realtime se cae, un sondeo de respaldo mantiene la vista viva.
 */

type Props = { agentRunId: string; onCompletado: (procesoId?: string) => void };

const PASOS = [
  { hasta: 20, texto: "Leyendo tus documentos" },
  { hasta: 45, texto: "Recuperando la evidencia del proceso" },
  { hasta: 80, texto: "Reconstruyendo el proceso" },
  { hasta: 100, texto: "Preparando tus entregables" },
];

export default function ProgresoDescubrimiento({ agentRunId, onCompletado }: Props) {
  const [run, setRun] = useState<AgentRun | null>(null);

  useEffect(() => {
    const sb = crearClienteNavegador();
    let vivo = true;

    async function leer() {
      const { data } = await sb
        .from("agent_runs")
        .select("id, status, progress_step, progress_pct, error_detail")
        .eq("id", agentRunId)
        .single();
      if (!vivo || !data) return;
      setRun(data as AgentRun);
      if (data.status === "completado") onCompletado();
    }

    leer();

    const canal = sb
      .channel(`run-${agentRunId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "agent_runs", filter: `id=eq.${agentRunId}` },
        (payload) => {
          const nuevo = payload.new as AgentRun;
          setRun(nuevo);
          if (nuevo.status === "completado") onCompletado();
        }
      )
      .subscribe();

    // Respaldo: si Realtime no llega, seguimos mostrando avance real
    const sondeo = setInterval(leer, 5000);

    return () => {
      vivo = false;
      clearInterval(sondeo);
      sb.removeChannel(canal);
    };
  }, [agentRunId, onCompletado]);

  if (!run) {
    return <p className="progreso-texto">Preparando el análisis…</p>;
  }

  if (run.status === "error") {
    return (
      <div className="progreso-error">
        <h3>No pudimos completar el descubrimiento</h3>
        <p>{run.error_detail ?? "Ocurrió un problema al procesar tus documentos."}</p>
        <p className="sugerencia">
          Puedes volver a intentarlo. Si el problema persiste, avísanos y lo revisamos.
        </p>
      </div>
    );
  }

  const pct = Math.max(5, Math.min(100, run.progress_pct || 5));
  const etapaActual = PASOS.findIndex((p) => pct <= p.hasta);

  return (
    <div className="progreso">
      <div className="barra" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${pct}%` }} />
      </div>

      <p className="progreso-texto">
        {run.progress_step ?? PASOS[Math.max(0, etapaActual)]?.texto ?? "Trabajando…"}
      </p>

      <ol className="etapas">
        {PASOS.map((p, i) => (
          <li key={p.texto} className={i < etapaActual ? "hecha" : i === etapaActual ? "actual" : ""}>
            {p.texto}
          </li>
        ))}
      </ol>

      <p className="tranquilidad">
        Puedes cerrar esta página: el análisis continúa y lo encontrarás listo al volver.
      </p>
    </div>
  );
}
