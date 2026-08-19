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

/** Organización activa del usuario. En el piloto, cada usuario pertenece a una. */
export async function organizacionActiva() {
  const sb = await crearClienteServidor();
  const { data: sesion } = await sb.auth.getUser();
  if (!sesion.user) return null;

  const { data } = await sb
    .from("memberships")
    .select("organization_id, role, organizations(id, name, max_autonomy)")
    .eq("user_id", sesion.user.id)
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const org = data.organizations as unknown as { id: string; name: string; max_autonomy: string };
  return { usuario: sesion.user, rol: data.role as string, organizacion: org };
}
