export async function GET() {
  return Response.json({
    ok: true,
    servicio: "plataforma-agentica-ialabs",
    fase: "F1",
    supabase_configurada: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    webhook_n8n_configurado: Boolean(process.env.N8N_WEBHOOK_BASE_URL),
    timestamp: new Date().toISOString(),
  });
}
