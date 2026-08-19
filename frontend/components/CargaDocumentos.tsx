"use client";

import { useRef, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase";

/**
 * Carga de documentos: sube a Storage con la sesión del usuario (RLS) y
 * dispara la ingesta. La ruta se arma sola — el cliente nunca ve identificadores.
 */

const FORMATOS_OK = [".pdf", ".txt", ".md"];
const MAX_MB = 25;

type Archivo = { nombre: string; estado: "subiendo" | "procesando" | "listo" | "falla"; detalle?: string };

type Props = { organizacionId: string; proyectoId: string; onCambio?: () => void };

export default function CargaDocumentos({ organizacionId, proyectoId, onCambio }: Props) {
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function actualizar(nombre: string, cambio: Partial<Archivo>) {
    setArchivos((prev) => prev.map((a) => (a.nombre === nombre ? { ...a, ...cambio } : a)));
  }

  async function subir(lista: FileList | File[]) {
    const sb = crearClienteNavegador();

    for (const file of Array.from(lista)) {
      const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();

      if (!FORMATOS_OK.includes(ext)) {
        setArchivos((p) => [
          ...p,
          { nombre: file.name, estado: "falla", detalle: `Por ahora leemos PDF y texto. ${ext} todavía no.` },
        ]);
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setArchivos((p) => [
          ...p,
          { nombre: file.name, estado: "falla", detalle: `Pesa más de ${MAX_MB} MB.` },
        ]);
        continue;
      }

      setArchivos((p) => [...p, { nombre: file.name, estado: "subiendo" }]);
      const ruta = `${organizacionId}/${proyectoId}/${file.name}`;

      const { error: errSubida } = await sb.storage
        .from("documentos")
        .upload(ruta, file, { upsert: true, contentType: file.type || undefined });

      if (errSubida) {
        actualizar(file.name, { estado: "falla", detalle: "No pudimos subirlo. Inténtalo de nuevo." });
        continue;
      }

      const { data: doc, error: errFila } = await sb
        .from("documents")
        .insert({
          organization_id: organizacionId,
          project_id: proyectoId,
          filename: file.name,
          storage_path: ruta,
          mime_type: file.type || "application/octet-stream",
          size_bytes: file.size,
          source_type: "archivo",
        })
        .select("id")
        .single();

      if (errFila || !doc) {
        actualizar(file.name, { estado: "falla", detalle: "Se subió, pero no pudimos registrarlo." });
        continue;
      }

      actualizar(file.name, { estado: "procesando" });

      const r = await fetch("/api/ingesta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: doc.id }),
      });

      actualizar(file.name,
        r.ok
          ? { estado: "listo" }
          : { estado: "falla", detalle: "Subido, pero la lectura no arrancó. Puedes reintentarla." }
      );
      onCambio?.();
    }
  }

  return (
    <div className="via">
      <h2>Sube tus documentos</h2>
      <p className="desc">
        Manuales, procedimientos, checklists o correos donde se explique cómo funciona el proceso.
      </p>

      <div
        className={`zona-arrastre ${arrastrando ? "activa" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastrando(false); subir(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
      >
        Arrastra tus archivos aquí o haz clic para elegirlos
        <br />
        <small>PDF o texto · hasta {MAX_MB} MB cada uno</small>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={FORMATOS_OK.join(",")}
        hidden
        onChange={(e) => e.target.files && subir(e.target.files)}
      />

      {archivos.length > 0 && (
        <ul className="lista-archivos">
          {archivos.map((a) => (
            <li
              key={a.nombre}
              className={`archivo ${a.estado === "listo" ? "ok" : a.estado === "falla" ? "falla" : "trabajando"}`}
            >
              <span className="nom" title={a.nombre}>{a.nombre}</span>
              <span className="est">
                {a.estado === "subiendo" && "Subiendo…"}
                {a.estado === "procesando" && "Leyendo…"}
                {a.estado === "listo" && "Listo"}
                {a.estado === "falla" && (a.detalle ?? "No se pudo")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
