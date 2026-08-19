import { NextRequest } from "next/server";

/**
 * Registra una narración ya subida a Storage y dispara su transcripción.
 * El navegador sube el audio directamente a Storage con la sesión del usuario;
 * aquí solo pasamos la ruta al motor de agentes.
 */
export async function POST(req: NextRequest) {
  const base = process.env.N8N_WEBHOOK_BASE_URL;
  const nombreHeader = process.env.WEBHOOK_AUTH_HEADER_NAME;
  const valorHeader = process.env.WEBHOOK_AUTH_HEADER_VALUE;

  if (!base || !nombreHeader || !valorHeader) {
    return Response.json(
      { ok: false, error: "El servidor no tiene configurada la conexión con el motor de agentes." },
      { status: 500 }
    );
  }

  let cuerpo: { project_id?: string; storage_path?: string; filename?: string };
  try {
    cuerpo = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  if (!cuerpo.project_id || !cuerpo.storage_path) {
    return Response.json(
      { ok: false, error: "Falta el proyecto o la ubicación del audio." },
      { status: 400 }
    );
  }

  try {
    const r = await fetch(`${base}/piloto-voz`, {
      method: "POST",
      headers: { "Content-Type": "application/json", [nombreHeader]: valorHeader },
      body: JSON.stringify({
        project_id: cuerpo.project_id,
        storage_path: cuerpo.storage_path,
        filename: cuerpo.filename ?? "narracion.webm",
      }),
    });

    if (!r.ok) {
      return Response.json(
        { ok: false, error: "El motor de agentes rechazó la transcripción. Vuelve a intentarlo en unos minutos." },
        { status: 502 }
      );
    }

    return Response.json(await r.json());
  } catch {
    return Response.json(
      { ok: false, error: "No pudimos contactar al motor de agentes. Revisa tu conexión e inténtalo de nuevo." },
      { status: 502 }
    );
  }
}
