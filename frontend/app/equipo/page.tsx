import { redirect } from "next/navigation";
import { crearClienteServidor, organizacionActiva } from "@/lib/supabase-servidor";
import GestionEquipo from "@/components/GestionEquipo";
import SinOrganizacion from "@/components/SinOrganizacion";

export const dynamic = "force-dynamic";

export default async function Equipo() {
  const contexto = await organizacionActiva();
  if (contexto.estado === "sin_sesion") redirect("/entrar");
  if (contexto.estado === "sin_organizacion") return <SinOrganizacion correo={contexto.correo} />;

  const sb = await crearClienteServidor();
  const { data } = await sb
    .from("equipo_organizacion")
    .select("user_id, email, role, estado, last_sign_in_at")
    .eq("organization_id", contexto.organizacion.id)
    .order("estado")
    .order("email");

  const url = process.env.NEXT_PUBLIC_URL_PLATAFORMA ?? "https://ialabs-plataforma-piloto.vercel.app";

  return (
    <main className="lienzo">
      <div className="encabezado">
        <h1>Equipo</h1>
        <p>
          Quiénes pueden ver y trabajar sobre los procesos de {contexto.organizacion.name}.
          El nivel máximo de autonomía permitido en toda la organización es{" "}
          <strong>{contexto.organizacion.max_autonomy}</strong>.
        </p>
      </div>

      <GestionEquipo
        organizacionId={contexto.organizacion.id}
        iniciales={(data ?? []) as never}
        esAdmin={contexto.rol === "admin"}
        urlPlataforma={url}
      />
    </main>
  );
}
