# 06 — Costos y Operación

**Versión:** 1.0 (Piloto) · Agosto 2026
**Objetivo:** costo fijo del piloto **< USD 100/mes** + costo variable transparente por descubrimiento. Operación sostenible por una persona a tiempo parcial.

---

## 1. Costos fijos mensuales (piloto)

| Componente | Plan | Costo/mes (USD) | Nota |
|---|---|---|---|
| VPS (n8n) | Hetzner CX32 o similar (4 vCPU / 8 GB) — o CX22 (2/4) para empezar | 8–17 | Sin límite de ejecuciones |
| Supabase | Free al inicio → **Pro** al entrar el cliente piloto | 0 → 25 | Pro da backups diarios de 7 días y sin pausa por inactividad |
| Vercel | Hobby al inicio → **Pro** con dominio y equipo | 0 → 20 | Hobby prohíbe uso comercial: pasar a Pro antes del cliente real |
| Dominio + correo | — | ~2–5 | Dominio de la marca del producto |
| Monitoreo | UptimeRobot/BetterStack free + alertas Telegram | 0 | Suficiente para el piloto |
| **Total fijo** | | **≈ 10 → 70** | Dentro del objetivo < 100 |

## 2. Costos variables (por descubrimiento)

Estimación para un proyecto típico del piloto: **20 documentos ≈ 400 páginas ≈ 300k tokens** de texto.

| Concepto | Modelo | Tokens estimados | Costo aprox. (USD) |
|---|---|---|---|
| Embeddings de ingesta | text-embedding-3-small | 300k | 0.006 |
| Clasificación (WF-02) | claude-haiku-4-5 | 5k in / 0.5k out | < 0.01 |
| Descubrimiento RAG (WF-03) | claude-sonnet-5 | ~80k in / 15k out | ~0.47 |
| Análisis automatización (WF-04) | claude-sonnet-5 | ~25k in / 8k out | ~0.20 |
| Redacción SOP (WF-05) | claude-sonnet-5 | ~15k in / 10k out | ~0.20 |
| **Total por descubrimiento** | | | **≈ 0.9 — margen amplio bajo el criterio de éxito de USD 3** |

Control de costos ya diseñado en la arquitectura:
- Contadores de tokens y `cost_usd` por `agent_run` (visibles para IA Labs; base para pricing futuro).
- Tope de presupuesto por run (por defecto USD 5) que aborta con estado claro.
- Prompt caching de Claude en WF-03/04 (el contexto de evidencia se reutiliza entre llamadas del mismo run) — puede reducir el costo de entrada hasta ~90% en llamadas encadenadas.
- Modelo económico (haiku) para todo lo que no requiere razonamiento profundo.

Costo de operación de workflows activados (ejecución continua en el ambiente del cliente): depende del proceso; la plantilla registra tokens por ejecución, lo que permitirá pricing por uso en producción.

## 3. Operación y mantenimiento

### Backups
| Qué | Cómo | Frecuencia | Retención |
|---|---|---|---|
| Supabase (datos + Storage) | Backups del plan Pro + export semanal a almacenamiento frío propio | Diaria / semanal | 7 días / 3 meses |
| Postgres de n8n (estado y credenciales) | `pg_dump` por cron en el VPS → almacenamiento externo (p. ej. bucket S3/B2) | Diaria | 30 días |
| Workflows n8n | Export JSON versionado en Git (fuente de verdad para dev→prod) | En cada cambio | Historial Git |
| `N8N_ENCRYPTION_KEY` y secretos | Gestor de contraseñas de IA Labs | — | — |

> Prueba de restauración: una vez antes de entrar el cliente piloto y luego trimestral. Un backup no probado no es un backup.

### Actualizaciones
- **n8n:** versión fijada en `docker-compose.yml` (no `latest`); actualización mensual planificada: leer changelog → actualizar en `dev` → smoke test de WF-01..06 → actualizar `prod`.
- **SO del VPS:** parches de seguridad automáticos (unattended-upgrades); reinicio programado si el kernel lo requiere.
- **Dependencias del frontend:** Dependabot en el repo; deploy continuo por Git en Vercel con preview.

### Monitoreo y alertas
| Señal | Herramienta | Alerta |
|---|---|---|
| n8n arriba (healthcheck HTTP) | UptimeRobot | Telegram/correo al operador |
| Frontend arriba | UptimeRobot | Ídem |
| Fallo de cualquier workflow | Error Workflow global de n8n | Telegram + `agent_runs.status='error'` |
| Disco/CPU del VPS | `node_exporter` simple o script cron con umbral | Telegram |
| Gasto LLM anómalo | Consulta diaria sobre `agent_runs` (suma `cost_usd`) | Correo si > umbral diario |

### Runbook mínimo de incidentes
1. **n8n caído:** `docker compose ps` → logs → `docker compose restart n8n`; si persiste, restaurar VPS desde snapshot (Hetzner snapshots semanales).
2. **Ejecuciones fallando en cadena:** pausar webhooks (activar modo mantenimiento en el frontend), revisar Error Workflow, corregir, reprocesar runs `error` (idempotencia por `agent_run_id`).
3. **Fuga o sospecha de secreto expuesto:** rotar la llave afectada (Claude/OpenAI/Supabase/HMAC), invalidar sesiones, revisar `audit_log`, notificar según DPA si hay datos de cliente involucrados.
4. **Supabase degradado:** status.supabase.com; la plataforma queda en solo-lectura degradada (los runs se encolan y reintentan).
- Cada incidente: nota post-mortem breve (qué, impacto, causa, prevención) en el repo.

### Carga operativa estimada (piloto)
| Tarea | Frecuencia | Tiempo |
|---|---|---|
| Revisión de alertas y runs fallidos | Diaria | 10 min |
| Actualización n8n + smoke test | Mensual | 1–2 h |
| Prueba de restauración de backup | Trimestral | 1 h |
| Ajuste de prompts/plantillas por feedback | Continua | según piloto |

## 4. Palancas de escala a producción (sin rehacer arquitectura)

Ordenadas por costo/esfuerzo — activar solo cuando la métrica lo pida:

1. **VPS más grande** (escala vertical): minutos de trabajo, hasta ~8 vCPU/16 GB.
2. **n8n modo `queue`:** Redis + N workers en el mismo VPS o uno adicional → paraleliza ejecuciones (la palanca clave para «capacidad operativa continua» con volumen).
3. **Supabase Pro → Team** y réplicas de lectura si el RAG crece.
4. **n8n dedicado por cliente enterprise:** un contenedor por tenant (aislamiento fuerte + facturable como premium).
5. **CDN/caché de entregables** en Vercel (los entregables son estáticos una vez generados).

Los umbrales concretos de cada palanca se definen en [07-roadmap-piloto-a-produccion.md](07-roadmap-piloto-a-produccion.md).
