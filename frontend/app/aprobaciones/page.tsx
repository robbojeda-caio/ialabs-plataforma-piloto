import { redirect } from "next/navigation";
import { crearClienteServidor, organizacionActiva } from "@/lib/supabase-servidor";
import ListaAprobaciones from "@/components/ListaAprobaciones";
import SinOrganizacion from "@/components/SinOrganizacion";

export const dynamic = "force-dynamic";

export default async function Aprobaciones() {
  const contexto = await organizacionActiva();
  if (contexto.estado === "sin_sesion") redirect("/entrar");
  if (contexto.estado === "sin_organizacion") return <SinOrganizacion correo={contexto.correo} />;

  const sb = await crearClienteServidor();
  const { data } = await sb
    .from("pending_approvals")
    .select("id, step_name, action_summary, proposed_payload, status, created_at, expires_at")
    .eq("organization_id", contexto.organizacion.id)
    .eq("status", "pendiente")
    .order("created_at", { ascending: true });

  return (
    <main className="lienzo">
      <div className="encabezado">
        <h1>Acciones esperando tu visto bueno</h1>
        <p>
          Los pasos configurados en nivel L2 no se ejecutan sin que alguien los apruebe.
          Aquí ves qué quiere hacer el agente, con qué datos, antes de que ocurra.
        </p>
      </div>

      <ListaAprobaciones iniciales={data ?? []} organizacionId={contexto.organizacion.id} />
    </main>
  );
}
