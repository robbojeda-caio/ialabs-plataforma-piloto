"use client";

import { useCallback, useEffect, useState } from "react";
import { crearClienteNavegador, type Documento } from "@/lib/supabase";
import CargaDocumentos from "./CargaDocumentos";
import GrabadorVoz from "./GrabadorVoz";
import ProgresoDescubrimiento from "./ProgresoDescubrimiento";
import VisorEntregables from "./VisorEntregables";

/**
 * La pantalla del "one click": capturar → descubrir → ver resultados.
 * Un solo botón dispara toda la cadena; el resto es acompañar la espera.
 */

type Fase = "capturando" | "descubriendo" | "listo";

type Props = { organizacionId: string; proyectoId: string; nombreProyecto: string };

export default function PantallaDescubrimiento({ organizacionId, proyectoId, nombreProyecto }: Props) {
  const [fase, setFase] = useState<Fase>("capturando");
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [agentRunId, setAgentRunId] = useState<string | null>(null);
  const [procesoId, setProcesoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subiendoVoz, setSubiendoVoz] = useState(false);

  const cargarDocumentos = useCallback(async () => {
    const sb = crearClienteNavegador();
    const { data } = await sb
      .from("documents")
      .select("id, filename, status, source_type, duration_seconds, error_detail")
      .eq("project_id", proyectoId)
      .order("created_at", { ascending: false });
    setDocumentos((data ?? []) as Documento[]);
  }, [proyectoId]);

  const buscarProceso = useCallback(async () => {
    const sb = crearClienteNavegador();
    const { data } = await sb
      .from("processes")
      .select("id")
      .eq("project_id", proyectoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.id) {
      setProcesoId(data.id);
      setFase("listo");
    }
  }, [proyectoId]);

  useEffect(() => {
    cargarDocumentos();
    buscarProceso();
  }, [cargarDocumentos, buscarProceso]);

  async function guardarNarracion(audio: Blob, segundos: number) {
    setSubiendoVoz(true);
    setError(null);
    try {
      const sb = crearClienteNavegador();
      const nombre = `narracion-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "")}.webm`;
      const ruta = `${organizacionId}/${proyectoId}/${nombre}`;

      const { error: errSubida } = await sb.storage
        .from("documentos")
        .upload(ruta, audio, { contentType: audio.type, upsert: true });
      if (errSubida) throw new Error("subida");

      const r = await fetch("/api/voz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: proyectoId, storage_path: ruta, filename: nombre }),
      });
      if (!r.ok) throw new Error("webhook");

      await cargarDocumentos();
      // La transcripción tarda; refrescamos para que el usuario vea cuándo queda lista
      setTimeout(cargarDocumentos, 8000);
      setTimeout(cargarDocumentos, 20000);
    } catch {
      setError(
        `No pudimos guardar la grabación de ${Math.round(segundos)} segundos. Vuelve a intentarlo.`
      );
    } finally {
      setSubiendoVoz(false);
    }
  }

  async function descubrir() {
    setError(null);
    setFase("descubriendo");
    try {
      const r = await fetch("/api/descubrir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: proyectoId, process_type: "auto" }),
      });
      const datos = await r.json();
      if (!r.ok || !datos.agent_run_id) throw new Error(datos.error ?? "sin id");
      setAgentRunId(datos.agent_run_id);
    } catch (e) {
      setFase("capturando");
      setError(
        e instanceof Error && e.message !== "sin id"
          ? e.message
          : "No pudimos iniciar el descubrimiento. Inténtalo de nuevo."
      );
    }
  }

  const indexados = documentos.filter((d) => d.status === "indexado");
  const trabajando = documentos.filter((d) => d.status === "procesando" || d.status === "subido");
  const puedeDescubrir = indexados.length > 0 && !subiendoVoz;

  if (fase === "descubriendo" && agentRunId) {
    return (
      <ProgresoDescubrimiento
        agentRunId={agentRunId}
        onCompletado={() => { buscarProceso(); }}
      />
    );
  }

  if (fase === "listo" && procesoId) {
    return (
      <>
        <VisorEntregables procesoId={procesoId} />
        <button className="btn-secundario" onClick={() => { setProcesoId(null); setAgentRunId(null); setFase("capturando"); }}>
          Volver a los materiales
        </button>
      </>
    );
  }

  return (
    <>
      <div className="encabezado">
        <h1>{nombreProyecto}</h1>
        <p>
          Cuéntanos cómo funciona tu proceso: sube lo que tengas escrito, o simplemente
          descríbelo en voz alta. Con cualquiera de las dos basta.
        </p>
      </div>

      <div className="captura">
        <CargaDocumentos
          organizacionId={organizacionId}
          proyectoId={proyectoId}
          onCambio={cargarDocumentos}
        />

        <div className="via">
          <h2>O cuéntanoslo hablando</h2>
          <p className="desc">
            Si no tienes nada documentado pero conoces el proceso, esta es la vía más rápida.
          </p>
          <GrabadorVoz onGrabacionLista={guardarNarracion} deshabilitado={subiendoVoz} />
          {subiendoVoz && <p className="cargando">Guardando tu grabación…</p>}
        </div>
      </div>

      {documentos.length > 0 && (
        <div className="via">
          <h2>Materiales del proceso</h2>
          <ul className="lista-archivos">
            {documentos.map((d) => (
              <li
                key={d.id}
                className={`archivo ${
                  d.status === "indexado" ? "ok" : d.status === "ilegible" || d.status === "error" ? "falla" : "trabajando"
                }`}
              >
                <span className="nom">
                  {d.source_type === "voz" ? "🎙️ " : "📄 "}
                  {d.filename}
                  {d.duration_seconds ? ` · ${Math.round(d.duration_seconds / 60)} min` : ""}
                </span>
                <span className="est">
                  {d.status === "indexado" && "Listo"}
                  {(d.status === "procesando" || d.status === "subido") && "Procesando…"}
                  {(d.status === "ilegible" || d.status === "error") && (d.error_detail ?? "No se pudo leer")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <div>
        <button className="btn btn-grande" onClick={descubrir} disabled={!puedeDescubrir}>
          Descubrir mi proceso
        </button>
        {!puedeDescubrir && (
          <p className="cargando" style={{ marginTop: ".6rem" }}>
            {trabajando.length > 0
              ? "Estamos leyendo tus materiales. En cuanto terminen, podrás descubrir el proceso."
              : "Sube un documento o graba tu narración para empezar."}
          </p>
        )}
      </div>
    </>
  );
}
