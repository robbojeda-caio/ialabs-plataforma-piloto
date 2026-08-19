import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieAEscribir = { name: string; value: string; options?: CookieOptions };

/** Cliente de servidor con la sesión del usuario. Sigue sujeto a RLS. */
export async function crearClienteServidor() {
  const almacen = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll: (lista: CookieAEscribir[]) => {
          try {
            lista.forEach(({ name, value, options }) => almacen.set(name, value, options));
          } catch {
            // En Server Components no se pueden escribir cookies; el middleware refresca la sesión.
          }
        },
      },
    }
  );
}

export type Contexto =
  | { estado: "sin_sesion" }
  | { estado: "sin_organizacion"; correo: string }
  | {
      estado: "listo";
      usuario: { id: string; email?: string };
      rol: string;
      organizacion: { id: string; name: string; max_autonomy: string };
    };

/**
 * Contexto del usuario. Distingue "no inició sesión" de "inició sesión pero
 * todavía nadie lo vinculó a una organización": son problemas distintos y
 * mandarlos al mismo login deja a la persona dando vueltas sin entender por qué.
 */
export async function organizacionActiva(): Promise<Contexto> {
  const sb = await crearClienteServidor();
  const { data: sesion } = await sb.auth.getUser();
  if (!sesion.user) return { estado: "sin_sesion" };

  const { data } = await sb
    .from("memberships")
    .select("organization_id, role, organizations(id, name, max_autonomy)")
    .eq("user_id", sesion.user.id)
    .limit(1)
    .maybeSingle();

  if (!data) return { estado: "sin_organizacion", correo: sesion.user.email ?? "" };

  const org = data.organizations as unknown as { id: string; name: string; max_autonomy: string };
  return {
    estado: "listo",
    usuario: { id: sesion.user.id, email: sesion.user.email },
    rol: data.role as string,
    organizacion: org,
  };
}
