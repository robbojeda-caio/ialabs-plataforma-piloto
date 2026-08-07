# 00 — Visión y Alcance

**Producto:** Agente de Descubrimiento de Procesos — Plataforma Agéntica de IA Labs
**Versión del documento:** 1.0 (Piloto) · Agosto 2026

---

## 1. Propósito

> Automatizar procesos, optimizar la toma de decisiones y mejorar la eficiencia empresarial **con responsabilidad**, de forma **eficiente técnica y económicamente** para los clientes, con **capacidad operativa continua** (24/7).

Este propósito guía todas las decisiones de diseño del producto:

| Principio | Cómo se materializa |
|---|---|
| Responsabilidad | Autonomía gobernada por niveles (L0–L3), auditoría completa de cada acción, humano en el circuito donde hay riesgo |
| Eficiencia técnica | Arquitectura de 4 piezas, sin infraestructura innecesaria (ver [01-arquitectura.md](01-arquitectura.md)) |
| Eficiencia económica | Costo fijo del piloto < USD 100/mes + variable por uso, transparente para el cliente (ver [06-costos-y-operacion.md](06-costos-y-operacion.md)) |
| Capacidad continua | Agentes operando 24/7 en n8n, con monitoreo y recuperación automática |

## 2. Visión de producto

IA Labs lanzará una **plataforma de IA agéntica** (web + app) bajo su propia marca, donde los clientes acceden de manera controlada a **su propio ambiente de producción y operación de agentes**. El objetivo comercial es doble:

1. **Producto:** el cliente descubre, rediseña y automatiza sus procesos con agentes de IA.
2. **Cercanía:** el cliente ve y opera sus agentes en su ambiente, entiende el producto y confía en él.

El **primer agente** de la plataforma es el **Agente de Descubrimiento de Procesos**:

- Recibe fuentes de la empresa cliente (documentos en el piloto).
- **Clasifica** el tipo de proceso que se quiere descubrir.
- **Descubre** el proceso a partir de la evidencia documental (as-is) o, si la evidencia es insuficiente, **lo diseña** (to-be).
- **Identifica etapas automatizables**: alto volumen, repetitivas, de clasificación, de extracción de datos.
- **Entrega tres artefactos** desde una sola fuente de verdad (el JSON canónico del proceso):
  1. **Diagrama del proceso** con mapa de automatización superpuesto.
  2. **SOP rediseñado** (documento as-is / to-be con recomendaciones).
  3. **Workflow n8n ejecutable** con grados de autonomía configurables, listo para activar en el ambiente del cliente.

### Experiencia objetivo: "one click"

El cliente: (1) arrastra sus documentos, (2) elige el tipo de proceso (o deja que el agente lo detecte), (3) pulsa **Descubrir**. Minutos después tiene los tres entregables y un botón **"Activar en mi ambiente"** con selector de nivel de autonomía. Nada de configuración técnica visible.

## 3. Piloto

### Vertical y caso de uso

**Vertical legal** (despachos y áreas legales de empresas). Procesos objetivo del piloto:

1. **Intake de casos/asuntos** — recepción, clasificación y asignación de nuevos asuntos legales.
2. **Revisión de contratos** — flujo de recepción, análisis, marcado y aprobación de contratos.
3. **Respuesta a requerimientos** — gestión de requerimientos de autoridades o contrapartes con plazos.

Estos tres procesos comparten características ideales para automatización: alto volumen, clasificación documental, extracción de datos y plazos críticos.

### Alcance del piloto

**Dentro del alcance (IN):**
- Descubrimiento a partir de **documentos** (SOPs, manuales, políticas, correos exportados, actas, contratos) vía RAG.
- Los **tres entregables** (diagrama + SOP + workflow n8n).
- **Niveles de autonomía L0–L3** configurables por proceso y por etapa.
- **Un tenant de prueba** del vertical legal (cliente piloto o datos internos de IA Labs).
- Web responsive tipo **PWA** (funciona como "app" en móvil sin desarrollo nativo).
- Interfaz completamente en **español**.

**Fuera del alcance (OUT) — fases posteriores:**
- Process mining desde event logs de sistemas (fase 2 del producto).
- Entrevista conversacional guiada como fuente de descubrimiento (fase 2).
- Facturación y self-service de pago.
- App móvil nativa (iOS/Android).
- Marketplace de agentes adicionales (la plataforma se diseña para albergarlos, pero el piloto incluye solo este agente).

## 4. Usuarios y roles

| Rol | Quién es | Qué hace en la plataforma |
|---|---|---|
| **Administrador de organización** | Socio/gerente del cliente | Invita usuarios, configura niveles de autonomía máximos, ve auditoría completa |
| **Analista/abogado** | Usuario operativo del cliente | Sube documentos, lanza descubrimientos, revisa y aprueba entregables, opera workflows |
| **Operador IA Labs** | Equipo de IA Labs | Soporte, monitoreo, ajuste de prompts y plantillas, gestión de tenants |

## 5. Criterios de éxito del piloto

| # | Criterio | Métrica objetivo |
|---|---|---|
| 1 | Descubrimiento end-to-end de procesos legales reales | ≥ 3 procesos descubiertos y validados por el dueño del proceso |
| 2 | Calidad del workflow generado | Ejecutable en n8n sin edición manual mayor (< 15 min de ajustes) |
| 3 | Velocidad | De documentos cargados a entregables completos en < 10 minutos |
| 4 | Fidelidad del descubrimiento | El dueño del proceso valida ≥ 80% de las etapas identificadas |
| 5 | Costo variable | < USD 3 por descubrimiento completo (LLM + embeddings) |
| 6 | Adopción | El cliente piloto activa al menos 1 workflow generado en operación real |

## 6. Riesgos principales y mitigación

| Riesgo | Mitigación |
|---|---|
| Evidencia documental insuficiente para reconstruir el proceso | El agente marca vacíos explícitamente y propone diseño to-be; nunca inventa un as-is |
| Confidencialidad de documentos legales | Aislamiento por tenant (RLS), no se entrena con datos del cliente, DPA — ver [05-gobernanza-y-seguridad.md](05-gobernanza-y-seguridad.md) |
| Workflow generado de baja calidad | Generación desde plantillas validadas + JSON canónico estricto, no generación libre |
| Sobre-automatización (riesgo profesional/legal) | Niveles de autonomía con techo configurado por el administrador; tareas de juicio experto siempre L0/L1 |
| Costos de LLM fuera de control | Presupuesto por run, contadores de tokens en `agent_runs`, modelo económico para clasificación |

## 7. Documentos relacionados

Este documento es la puerta de entrada. El detalle técnico está en:
[01-arquitectura.md](01-arquitectura.md) · [02-modelo-de-datos.md](02-modelo-de-datos.md) · [03-workflows-n8n.md](03-workflows-n8n.md) · [04-frontend-ux.md](04-frontend-ux.md) · [05-gobernanza-y-seguridad.md](05-gobernanza-y-seguridad.md) · [06-costos-y-operacion.md](06-costos-y-operacion.md) · [07-roadmap-piloto-a-produccion.md](07-roadmap-piloto-a-produccion.md)
