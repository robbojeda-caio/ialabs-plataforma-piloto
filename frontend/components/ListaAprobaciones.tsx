"use client";

import { useEffect, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase";

/**
 * Aprobaciones de nivel L2 en tiempo real.
 *
 * Registrar la decisión en la base es lo que importa: WF-06 la observa para
 * desbloquear o detener el paso. Cada decisión queda además en la auditoría.
 */

type Aprobacion = {
  id: string;
  step_name: string;
  action_summary: string;
  proposed_payload: Record<string, unknown>;
  status: string;
  created_at: string;
  expires_at: string | null;
};

export default function ListaAprobaciones({
  iniciales,
  organizacionId,
}: {
  iniciales: Aprobacion[];
  organizacionId: string;
}) {
  const [lista, setLista] = useState<Aprobacion[]>(iniciales);
  const [ocupada, setOcupada] = useState<string | null>(null);

  useEffect(() => {
    const sb = crearClienteNavegador();
    const canal = sb
      .channel("aprobaciones")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pending_approvals",
          filter: `organization_id=eq.${organizacionId}`,
        },
        async () => {
          const { data } = await sb
            .from("pending_approvals")
            .select("id, step_name, action_summary, proposed_payload, status, created_at, expires_at")
            .eq("organization_id", organizacionId)
            .eq("status", "pendiente")
            .order("created_at", { ascending: true });
          setLista((data ?? []) as Aprobacion[]);
        }
      )
      .subscribe();
    return () => { sb.removeChannel(canal); };
  }, [organizacionId]);

  async function decidir(id: string, aprobar: boolean) {
    setOcupada(id);
    const sb = crearClienteNavegador();
    const { data: sesion } = await sb.auth.getUser();

    let motivo: string | null = null;
    if (!aprobar) {
      motivo = window.prompt("¿Por qué lo rechazas? (queda registrado en la auditoría)") || "Sin motivo indicado";
    }

    const { error } = await sb
      .from("pending_approvals")
      .update({
        status: aprobar ? "aprobado" : "rechazado",
        decision_reason: motivo,
        decided_by: sesion.user?.id ?? null,
        decided_at: new Date().toISOString(),
      })
      .eq("id", id);

    setOcupada(null);
    if (!error) setLista((p) => p.filter((a) => a.id !== id));
  }

  if (lista.length === 0) {
    return (
      <div className="vacio-estado">
        <h2>Nada pendiente</h2>
        <p>Cuando un agente necesite tu aprobación para actuar, aparecerá aquí.</p>
      </div>
    );
  }

  return (
    <div className="rejilla" style={{ gridTemplateColumns: "1fr" }}>
      {lista.map((a) => (
        <div key={a.id} className="aprobacion">
          <div>
            <h3>{a.step_name}</h3>
            <p className="contexto">{a.action_summary}</p>
          </div>

          {a.proposed_payload && Object.keys(a.proposed_payload).length > 0 && (
            <pre className="propuesta">{JSON.stringify(a.proposed_payload, null, 2)}</pre>
          )}

          <div className="acciones">
            <button className="btn-aprobar" disabled={ocupada === a.id} onClick={() => decidir(a.id, true)}>
              {ocupada === a.id ? "Guardando…" : "Aprobar y ejecutar"}
            </button>
            <button className="btn-rechazar" disabled={ocupada === a.id} onClick={() => decidir(a.id, false)}>
              Rechazar
            </button>
          </div>

          {a.expires_at && (
            <p className="contexto" style={{ fontSize: ".8rem" }}>
              Si nadie decide antes del {new Date(a.expires_at).toLocaleString("es")}, se escala
              al administrador.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
