import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteServidor, organizacionActiva } from "@/lib/supabase-servidor";
import SinOrganizacion from "@/components/SinOrganizacion";

export const dynamic = "force-dynamic";

type ProyectoVista = {
  id: string;
  name: string;
  process_type: string;
  procesos: number;
  minutos: number;
  documentos: number;
};

export default async function Dashboard() {
  const contexto = await organizacionActiva();
  if (contexto.estado === "sin_sesion") redirect("/entrar");
  if (contexto.estado === "sin_organizacion") return <SinOrganizacion correo={contexto.correo} />;

  const sb = await crearClienteServidor();
  const { data: proyectos } = await sb
    .from("projects")
    .select("id, name, process_type, created_at")
    .eq("organization_id", contexto.organizacion.id)
    .eq("status", "activo")
    .order("created_at", { ascending: false });

  const vistas: ProyectoVista[] = [];
  for (const p of proyectos ?? []) {
    const [{ count: docs }, { data: procesos }] = await Promise.all([
      sb.from("documents").select("id", { count: "exact", head: true }).eq("project_id", p.id),
      sb.from("processes").select("canonical").eq("project_id", p.id),
    ]);

    let minutos = 0;
    for (const proc of procesos ?? []) {
      let c: unknown = proc.canonical;
      for (let i = 0; i < 3 && typeof c === "string"; i++) {
        try { c = JSON.parse(c); } catch { c = {}; }
      }
      const m = (c as { metrics_estimate?: { automatable_minutes_per_run?: number } })
        ?.metrics_estimate?.automatable_minutes_per_run;
      if (m) minutos += m;
    }

    vistas.push({
      id: p.id,
      name: p.name,
      process_type: p.process_type,
      procesos: procesos?.length ?? 0,
      minutos,
      documentos: docs ?? 0,
    });
  }

  return (
    <main className="lienzo">
      <div className="encabezado">
        <h1>Tus procesos</h1>
        <p>
          Cada proyecto es un proceso que quieres entender y mejorar. Sube lo que tengas o
          cuéntalo hablando: el agente hace el resto.
        </p>
      </div>

      {vistas.length === 0 ? (
        <div className="vacio-estado">
          <h2>Todavía no hay procesos aquí</h2>
          <p>Crea el primero para empezar a descubrir cómo trabaja tu equipo.</p>
        </div>
      ) : (
        <div className="rejilla">
          {vistas.map((p) => (
            <Link key={p.id} href={`/proyecto/${p.id}`} className="tarjeta">
              <span
                className={`estado-linea ${
                  p.procesos > 0 ? "e-listo" : p.documentos > 0 ? "e-proceso" : "e-vacio"
                }`}
              >
                <span className="pt" />
                {p.procesos > 0
                  ? "Proceso descubierto"
                  : p.documentos > 0
                  ? "Materiales cargados"
                  : "Sin materiales"}
              </span>
              <h3>{p.name}</h3>
              {p.minutos > 0 && (
                <span className="ahorro">{p.minutos} min automatizables</span>
              )}
              <span className="meta">
                {p.documentos} {p.documentos === 1 ? "material" : "materiales"}
              </span>
            </Link>
          ))}
        </div>
      )}

      <footer className="pie">
        {contexto.organizacion.name} · nivel máximo de autonomía permitido:{" "}
        <strong>{contexto.organizacion.max_autonomy}</strong>
      </footer>
    </main>
  );
}
