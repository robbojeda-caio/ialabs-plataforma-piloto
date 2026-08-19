import { NextRequest } from "next/server";

/** Dispara la lectura e indexación de un documento ya subido a Storage. */
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

  let cuerpo: { document_id?: string };
  try {
    cuerpo = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  if (!cuerpo.document_id) {
    return Response.json({ ok: false, error: "Falta indicar el documento." }, { status: 400 });
  }

  try {
    const r = await fetch(`${base}/piloto-ingesta`, {
      method: "POST",
      headers: { "Content-Type": "application/json", [nombreHeader]: valorHeader },
      body: JSON.stringify({ document_id: cuerpo.document_id }),
    });
    if (!r.ok) {
      return Response.json(
        { ok: false, error: "El motor de agentes no pudo leer el documento ahora mismo." },
        { status: 502 }
      );
    }
    return Response.json(await r.json());
  } catch {
    return Response.json(
      { ok: false, error: "No pudimos contactar al motor de agentes." },
      { status: 502 }
    );
  }
}
