# Agente de Descubrimiento de Procesos — Plataforma Agéntica de IA Labs

Documentación de diseño del **piloto** (vertical legal). Estado: **F0 completada** — lista para iniciar construcción (F1).

## Qué es

Un agente de IA que, a partir de los **documentos de una empresa**, descubre (o diseña) sus procesos de negocio, identifica qué etapas conviene automatizar y entrega tres artefactos desde una sola fuente de verdad:

1. **Diagrama del proceso** con mapa de automatización.
2. **SOP rediseñado** (as-is / to-be).
3. **Workflow n8n ejecutable** con grados de autonomía configurables (L0–L3), activable en el ambiente del propio cliente.

Es el primer agente de la plataforma agéntica de IA Labs: una web/PWA donde los clientes operan sus agentes de forma controlada, cercana y auditada.

**Propósito:** automatizar procesos, optimizar la toma de decisiones y mejorar la eficiencia empresarial con responsabilidad, de forma eficiente técnica y económicamente, con capacidad operativa continua.

## Cómo leer esta documentación

| Documento | Contenido | Léelo si… |
|---|---|---|
| [00-vision-y-alcance.md](00-vision-y-alcance.md) | Propósito, producto, piloto, criterios de éxito, riesgos | quieres el panorama en 5 minutos |
| [01-arquitectura.md](01-arquitectura.md) | Las 4 piezas (Next.js/Vercel · Supabase · n8n/VPS · APIs de IA), diagramas C4, ADRs | vas a construir o evaluar la técnica |
| [02-modelo-de-datos.md](02-modelo-de-datos.md) | Esquema Postgres + pgvector + RLS y el **JSON canónico de proceso** (contrato central) | tocas la base de datos o los contratos |
| [03-workflows-n8n.md](03-workflows-n8n.md) | Especificación de WF-01…06 y plantillas de automatización | vas a construir el agente en n8n |
| [04-frontend-ux.md](04-frontend-ux.md) | Flujo one-click, pantallas, estados y errores | vas a construir la interfaz |
| [05-gobernanza-y-seguridad.md](05-gobernanza-y-seguridad.md) | Niveles de autonomía L0–L3, multi-tenancy, seguridad, datos, auditoría | te preocupa el riesgo (debería) |
| [06-costos-y-operacion.md](06-costos-y-operacion.md) | Costos fijos y variables, backups, monitoreo, runbook | operas o pagas la plataforma |
| [07-roadmap-piloto-a-produccion.md](07-roadmap-piloto-a-produccion.md) | Fases F0–F6 con hitos y criterios de salida | quieres saber qué sigue |

## Conceptos clave (glosario mínimo)

- **JSON canónico de proceso:** la representación única de un proceso descubierto ([02 §3](02-modelo-de-datos.md)). Los tres entregables se generan desde él — por eso nunca se contradicen.
- **Niveles de autonomía:** L0 solo observa · L1 propone · L2 ejecuta con aprobación · L3 autónomo auditado ([05 §2](05-gobernanza-y-seguridad.md)). Nivel efectivo = mín(paso, proceso, organización).
- **Regla de honestidad:** sin evidencia documental no hay "as-is"; el agente declara vacíos y propone un diseño "to-be". Nunca presenta como hecho lo que no está en los documentos.
- **as-is / to-be:** proceso actual reconstruido desde evidencia / proceso propuesto o rediseñado.

## Stack (resumen)

Next.js en Vercel (frontend PWA, español) · Supabase (Postgres+pgvector, Auth, Storage, Realtime) · n8n self-hosted en VPS con Docker (orquestación del agente) · Claude API (`claude-sonnet-5` razonamiento, `claude-haiku-4-5` clasificación) · OpenAI `text-embedding-3-small` (embeddings). Costo fijo del piloto < USD 100/mes; ~USD 1 por descubrimiento.

## Para empezar la construcción (F1)

Requisitos previos: cuenta Supabase, cuenta Vercel, VPS (Hetzner/DO), llaves API de Anthropic y OpenAI, dominio. Los pasos exactos y sus verificaciones están en [07 §F1](07-roadmap-piloto-a-produccion.md). Los MCP de n8n, Supabase y Vercel ya conectados a Claude Code permiten construir gran parte de F1–F4 asistido por agentes desde esta misma carpeta de trabajo.
