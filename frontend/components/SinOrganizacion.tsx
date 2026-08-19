/**
 * Estado intermedio real: la cuenta existe, pero nadie la vinculó todavía a una
 * organización. Sin este mensaje, RLS simplemente no devuelve nada y la persona
 * queda dando vueltas en el login sin entender qué pasó.
 */
export default function SinOrganizacion({ correo }: { correo: string }) {
  return (
    <main className="lienzo" style={{ maxWidth: "34rem", paddingTop: "4rem" }}>
      <div className="vacio-estado">
        <h2>Tu cuenta está lista, falta un paso</h2>
        <p>
          Entraste como <strong>{correo}</strong>, pero tu cuenta todavía no está
          vinculada a ninguna organización, así que aún no hay procesos que mostrarte.
        </p>
        <p style={{ marginTop: "1rem" }}>
          Pídele a quien administra la plataforma que te agregue. Es cosa de un minuto.
        </p>
      </div>
    </main>
  );
}
