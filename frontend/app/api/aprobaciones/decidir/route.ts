import { NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase-servidor";

/**
 * Registra la decisión y reanuda el paso detenido.
 *
 * Son dos efectos distintos y ambos importan: la fila en base es la evidencia
 * auditable, y el resume_token es lo que despierta al workflow que está esperando.
 * Si solo actualizáramos la base, el paso quedaría congelado hasta expirar.
 */
export async function POST(req: NextRequest) {
  let cuerpo: { aprobacion_id?: string; aprobar?: boolean; motivo?: string };
  try {
    cuerpo = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  if (!cuerpo.aprobacion_id || typeof cuerpo.aprobar !== "boolean") {
    return Response.json({ ok: false, error: "Falta la decisión." }, { status: 400 });
  }

  const sb = await crearClienteServidor();
  const { data: sesion } = await sb.auth.getUser();
  if (!sesion.user) {
    return Response.json({ ok: false, error: "Debes iniciar sesión." }, { status: 401 });
  }

  // RLS garantiza que solo se pueda decidir sobre aprobaciones de la propia organización
  const { data: aprobacion, error: errLectura } = await sb
    .from("pending_approvals")
    .select("id, status, resume_token")
    .eq("id", cuerpo.aprobacion_id)
    .maybeSingle();

  if (errLectura || !aprobacion) {
    return Response.json({ ok: false, error: "No encontramos esta solicitud." }, { status: 404 });
  }
  if (aprobacion.status !== "pendiente") {
    return Response.json(
      { ok: false, error: "Esta solicitud ya fue resuelta." },
      { status: 409 }
    );
  }

  const nuevoEstado = cuerpo.aprobar ? "aprobado" : "rechazado";
  const { error: errEscritura } = await sb
    .from("pending_approvals")
    .update({
      status: nuevoEstado,
      decision_reason: cuerpo.motivo ?? null,
      decided_by: sesion.user.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", aprobacion.id)
    .eq("status", "pendiente"); // evita pisar una decisión simultánea de otra persona

  if (errEscritura) {
    return Response.json(
      { ok: false, error: "No pudimos registrar tu decisión. Inténtalo de nuevo." },
      { status: 500 }
    );
  }

  // Despertar al paso detenido. Si esto falla, la decisión ya quedó registrada:
  // el workflow la leerá al expirar su espera, así que no se pierde.
  let reanudado = false;
  if (aprobacion.resume_token) {
    try {
      const r = await fetch(aprobacion.resume_token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: nuevoEstado, decided_by: sesion.user.id }),
      });
      reanudado = r.ok;
    } catch {
      reanudado = false;
    }
  }

  return Response.json({
    ok: true,
    estado: nuevoEstado,
    reanudado,
    aviso: reanudado
      ? null
      : "Tu decisión quedó registrada. El paso puede tardar unos minutos en reflejarla.",
  });
}
