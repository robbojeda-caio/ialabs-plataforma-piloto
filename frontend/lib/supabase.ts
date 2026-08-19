import { createBrowserClient } from "@supabase/ssr";

/**
 * Las variables NEXT_PUBLIC_* se incrustan en el paquete del navegador durante
 * la compilación. Si faltan ahí, el cliente no se puede crear y todo falla en
 * silencio: botones que no responden y ninguna pista de por qué. Preferimos
 * detectarlo y decirlo.
 */
export function faltaConfiguracion(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

/** Cliente de navegador: usa la llave pública, protegida por RLS. */
export function crearClienteNavegador() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !llave) {
    throw new Error(
      "La plataforma no recibió su configuración de acceso. Avisa al equipo técnico."
    );
  }
  return createBrowserClient(url, llave);
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
