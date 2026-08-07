const supabaseConfigurada = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export default function Inicio() {
  return (
    <main className="contenedor">
      <p className="marca">IA Labs · Plataforma Agéntica</p>
      <h1>Agente de Descubrimiento de Procesos</h1>
      <p className="proposito">
        Sube los documentos de tu empresa y descubre tus procesos: qué etapas
        conviene automatizar, con qué grado de autonomía, y un flujo listo para
        activar en tu propio ambiente. Automatización con responsabilidad,
        eficiencia técnica y económica, y operación continua.
      </p>

      <div className="tarjetas">
        <div className="tarjeta">
          <span className={`estado ${supabaseConfigurada ? "ok" : "pendiente"}`}>
            {supabaseConfigurada ? "Conectada" : "Pendiente de configurar"}
          </span>
          <h2>Base de datos y RAG</h2>
          <p>Supabase multi-tenant con aislamiento por organización (RLS).</p>
        </div>
        <div className="tarjeta">
          <span className="estado ok">Operativo</span>
          <h2>Motor de agentes</h2>
          <p>Orquestación n8n con niveles de autonomía L0–L3 auditados.</p>
        </div>
        <div className="tarjeta">
          <span className="estado pendiente">Fase F1</span>
          <h2>Estado del piloto</h2>
          <p>Infraestructura base en construcción. Vertical legal.</p>
        </div>
      </div>

      <button className="cta" disabled>
        + Nuevo descubrimiento
      </button>
      <p className="nota">
        Disponible en la fase F5 del piloto. Este es el esqueleto de la
        plataforma (F1).
      </p>

      <footer>
        © {new Date().getFullYear()} IA Labs — Piloto interno. Interfaz de
        referencia; nombre del producto por definir.
      </footer>
    </main>
  );
}
