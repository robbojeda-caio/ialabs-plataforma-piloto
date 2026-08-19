import { NextRequest } from "next/server";

/**
 * Dispara el descubrimiento en n8n.
 *
 * El secreto del webhook vive solo en el servidor: nunca llega al navegador.
 * Por eso el cliente llama a esta ruta en vez de a n8n directamente.
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

  let cuerpo: { project_id?: string; process_type?: string };
  try {
    cuerpo = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  if (!cuerpo.project_id) {
    return Response.json(
      { ok: false, error: "Falta indicar el proyecto a descubrir." },
      { status: 400 }
    );
  }

  try {
    const r = await fetch(`${base}/piloto-descubrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json", [nombreHeader]: valorHeader },
      body: JSON.stringify({
        project_id: cuerpo.project_id,
        process_type: cuerpo.process_type ?? "auto",
      }),
    });

    if (!r.ok) {
      return Response.json(
        { ok: false, error: "El motor de agentes rechazó la solicitud. Vuelve a intentarlo en unos minutos." },
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
