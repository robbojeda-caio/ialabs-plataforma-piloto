import { createBrowserClient } from "@supabase/ssr";

/** Cliente de navegador: usa la llave pública, protegida por RLS. */
export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type EstadoEjecucion =
  | "en_cola"
  | "ejecutando"
  | "completado"
  | "error"
  | "cancelado";

export type AgentRun = {
  id: string;
  status: EstadoEjecucion;
  progress_step: string | null;
  progress_pct: number;
  error_detail: string | null;
};

export type Documento = {
  id: string;
  filename: string;
  status: string;
  source_type: "archivo" | "voz" | "pantalla" | "entrevista";
  duration_seconds: number | null;
  error_detail: string | null;
};
