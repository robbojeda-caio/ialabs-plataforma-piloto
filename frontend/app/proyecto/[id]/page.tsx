import { notFound, redirect } from "next/navigation";
import { crearClienteServidor, organizacionActiva } from "@/lib/supabase-servidor";
import PantallaDescubrimiento from "@/components/PantallaDescubrimiento";
import SinOrganizacion from "@/components/SinOrganizacion";

export const dynamic = "force-dynamic";

export default async function Proyecto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const contexto = await organizacionActiva();
  if (contexto.estado === "sin_sesion") redirect("/entrar");
  if (contexto.estado === "sin_organizacion") return <SinOrganizacion correo={contexto.correo} />;

  const sb = await crearClienteServidor();
  // RLS ya restringe a la organización del usuario; si no aparece, no es suya.
  const { data: proyecto } = await sb
    .from("projects")
    .select("id, name, organization_id")
    .eq("id", id)
    .maybeSingle();

  if (!proyecto) notFound();

  return (
    <main className="lienzo">
      <PantallaDescubrimiento
        organizacionId={proyecto.organization_id}
        proyectoId={proyecto.id}
        nombreProyecto={proyecto.name}
      />
    </main>
  );
}
