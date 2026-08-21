"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase";

/**
 * Equipo de la organización.
 *
 * Invitar NO manda correo: se registra el correo de la persona y, cuando esa
 * persona crea su cuenta, un disparador en la base la vincula sola. Así se puede
 * armar el equipo aunque el servicio de correo esté caído o con límite alcanzado.
 * El administrador comparte el enlace por donde quiera.
 */

type Integrante = {
  user_id: string | null;
  email: string;
  role: string;
  estado: "activo" | "invitado";
  last_sign_in_at: string | null;
};

type Props = { organizacionId: string; iniciales: Integrante[]; esAdmin: boolean; urlPlataforma: string };

export default function GestionEquipo({ organizacionId, iniciales, esAdmin, urlPlataforma }: Props) {
  const router = useRouter();
  const [lista, setLista] = useState(iniciales);
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState<"member" | "admin">("member");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function invitar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);

    const sb = crearClienteNavegador();
    const limpio = correo.trim().toLowerCase();
    const { error } = await sb
      .from("invitations")
      .insert({ organization_id: organizacionId, email: limpio, role: rol });

    setOcupado(false);

    if (error) {
      setError(
        error.code === "23505"
          ? "Esa persona ya está invitada o ya forma parte del equipo."
          : "No pudimos registrar la invitación. Inténtalo de nuevo."
      );
      return;
    }

    setLista((p) => [
      ...p,
      { user_id: null, email: limpio, role: rol, estado: "invitado", last_sign_in_at: null },
    ]);
    setCorreo("");
    router.refresh();
  }

  async function revocar(email: string) {
    const sb = crearClienteNavegador();
    const { error } = await sb
      .from("invitations")
      .update({ status: "revocada" })
      .eq("organization_id", organizacionId)
      .eq("email", email);
    if (!error) setLista((p) => p.filter((i) => !(i.email === email && i.estado === "invitado")));
  }

  async function copiarEnlace() {
    await navigator.clipboard.writeText(`${urlPlataforma}/entrar`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <>
      {esAdmin && (
        <form onSubmit={invitar} className="via">
          <h2>Invitar a alguien</h2>
          <p className="desc">
            Registra su correo. Cuando esa persona cree su cuenta con ese mismo correo,
            entrará directo a tu organización.
          </p>

          <div className="fila-invitar">
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="nombre@estudio.com"
              aria-label="Correo de la persona"
            />
            <select value={rol} onChange={(e) => setRol(e.target.value as "member" | "admin")} aria-label="Rol">
              <option value="member">Puede trabajar</option>
              <option value="admin">Administra</option>
            </select>
            <button className="btn" type="submit" disabled={ocupado || !correo.trim()}>
              {ocupado ? "…" : "Invitar"}
            </button>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="nota-enlace">
            <span>Compártele este enlace para que cree su cuenta:</span>
            <button type="button" className="btn-secundario" onClick={copiarEnlace}>
              {copiado ? "Copiado" : "Copiar enlace de acceso"}
            </button>
          </div>
        </form>
      )}

      <div className="via">
        <h2>Quiénes tienen acceso</h2>
        <ul className="lista-equipo">
          {lista.map((i) => (
            <li key={i.email} className={i.estado === "invitado" ? "pendiente" : ""}>
              <span className="quien">
                <strong>{i.email}</strong>
                <small>
                  {i.role === "admin" ? "Administra" : "Puede trabajar"}
                  {i.estado === "activo" && i.last_sign_in_at
                    ? ` · último acceso ${new Date(i.last_sign_in_at).toLocaleDateString("es")}`
                    : i.estado === "activo"
                    ? " · aún no ha entrado"
                    : " · falta que cree su cuenta"}
                </small>
              </span>
              <span className="estado-equipo">
                {i.estado === "activo" ? (
                  <span className="pastilla n3"><span className="pt" />Activo</span>
                ) : (
                  <>
                    <span className="pastilla n2"><span className="pt" />Invitado</span>
                    {esAdmin && (
                      <button className="enlace-modo" onClick={() => revocar(i.email)}>
                        Revocar
                      </button>
                    )}
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
