# Estado de Construcción del Piloto

**Agente responsable:** `constructor-piloto` (definido en `.claude/agents/constructor-piloto.md`)
**Última actualización:** 2026-08-05 · sesión de Claude Code
**Fase actual:** F1 — Infraestructura base (en curso, ~60%)

---

## Cómo usar este archivo

- El **constructor-piloto** lo lee al inicio de cada sesión y lo actualiza al final. Es la memoria de la construcción.
- Las **compuertas (G#)** son los únicos puntos que requieren al humano. Cuando resuelvas una, díselo al agente («resuelta G1») y él continúa.
- Para continuar la construcción en cualquier momento: *«continúa la construcción del piloto»*.

## Infraestructura viva (IDs reales)

| Recurso | Valor |
|---|---|
| Proyecto Supabase | `ialabs-piloto-descubrimiento` · id `ynjetrceuwzdillspwcn` · región `sa-east-1` · **ACTIVO** |
| URL API Supabase | `https://ynjetrceuwzdillspwcn.supabase.co` |
| Organización Supabase | `Ojeda_Roberto. Agentes IA` (`dmqfzquioklyxvnpyxwu`, plan free — costo USD 0/mes) |
| Instancia n8n | La existente del usuario (n8n cloud, proyecto personal `1tZRfhEpWiFqYWA9`) — ver Adaptación A1 |
| Credenciales n8n disponibles | Anthropic ✓ · OpenAI (créditos free, managed) ✓ · Gmail ✓ · Drive ✓ · Slack ✓ · SMTP ✓ |
| Vercel | Team personal `team_vdUfcMOc05SQr2W5L5mKV2cE` — sin proyecto aún |
| Migraciones aplicadas | `esquema_inicial` · `rls_y_politicas` · `rag_storage_realtime` · `endurecimiento_advisors` |

## Compuertas humanas

| # | Estado | Qué se necesita del humano | Instrucciones |
|---|---|---|---|
| **G1** | 🔴 PENDIENTE | **Credencial Supabase en n8n** (desbloquea el criterio de salida de F1 y toda F2) | En el dashboard de Supabase → proyecto `ialabs-piloto-descubrimiento` → Settings → API: copiar la llave `service_role`. En n8n → Credentials → crear credencial tipo **Supabase API** con host `https://ynjetrceuwzdillspwcn.supabase.co` y esa llave. Avisar al agente: «resuelta G1» |
| **G2** | 🔴 PENDIENTE | **Secreto HMAC** para firmar webhooks frontend→n8n | Generar una cadena aleatoria larga (ej. `openssl rand -hex 32` en la terminal), guardarla en n8n como credencial **Header Auth** (nombre `hmac-webhooks-piloto`) y más adelante en Vercel como env `WEBHOOK_HMAC_SECRET`. Avisar: «resuelta G2» |
| **G3** | 🟡 DECISIÓN ABIERTA (no bloquea) | **VPS self-hosted** (ADR-3): contratar VPS (~USD 10–17/mes) o seguir en el n8n actual durante todo el piloto | Recomendación del agente: construir F1–F5 en el n8n actual y decidir VPS antes de F6 (cliente real), cuando pese la residencia de datos. Costo y pasos en doc 06 |
| **G4** | 🟡 DECISIÓN ABIERTA (no bloquea) | Nombre del producto y dominio | Puede esperar hasta F5 (frontend). Placeholder actual: «[Nombre] by IA Labs» |
| **G5** | ⚪ FUTURA | Validación de procesos descubiertos (≥80% de etapas) | Llegará en F3 con datos reales |

## Checklist F1 — Infraestructura base

- [x] Proyecto Supabase creado y activo (costo verificado: USD 0)
- [x] Esquema completo aplicado: 13 tablas + índice HNSW pgvector + `match_chunks`
- [x] RLS activo en el 100% de las tablas; `audit_log` append-only
- [x] Bucket `documentos` privado con políticas por organización (`org_id/...`)
- [x] Realtime habilitado para `agent_runs` y `pending_approvals`
- [x] Advisors de seguridad ejecutados y remediados (ver Decisiones D2)
- [ ] Credencial Supabase cargada en n8n → **bloqueado por G1**
- [ ] Workflow smoke-test en n8n: webhook firmado → escribe fila en Supabase → **bloqueado por G1+G2**
- [ ] Verificación RLS con dos usuarios de organizaciones distintas (test de aislamiento)
- [ ] Estructura n8n: carpeta del piloto + tags `core/template/env`
- [ ] Repo Git + esqueleto Next.js + deploy en Vercel (puede avanzar en paralelo, no depende de G1/G2)

## Adaptaciones al diseño original

- **A1 (2026-08-05):** El piloto se construye sobre la **instancia n8n ya existente** del usuario (operativa, con credencial Anthropic y 6 agentes legales previos) en lugar de esperar el VPS del ADR-3. Razón: elimina el bloqueo de dinero/compra al inicio y acelera F1–F5. La decisión VPS queda en G3, a reevaluar antes del cliente real (residencia y aislamiento de datos).

## Decisiones registradas

- **D1 (2026-08-05):** Proyecto Supabase nuevo y dedicado (no se reutilizó el proyecto antiguo inactivo `elgoyneuyphebzhipngu`): aislamiento limpio del piloto. El proyecto antiguo queda intacto — es del usuario decidir si lo borra.
- **D2 (2026-08-05):** Advertencias aceptadas de advisors: `is_member_of`/`is_admin_of` ejecutables por `authenticated` — requerido por las políticas RLS y solo revelan la membresía del propio solicitante. `match_chunks` quedó revocada para `anon/authenticated` (solo `service_role`/n8n).

## Bitácora

| Fecha | Acción | Resultado |
|---|---|---|
| 2026-08-04 | F0: suite de documentación 00–07 + README | Completada y aprobada por el usuario |
| 2026-08-05 | Reconocimiento de cuentas (Supabase, n8n, Vercel) | Hallazgo clave: n8n operativo con credencial Anthropic → Adaptación A1 |
| 2026-08-05 | Agente `constructor-piloto` definido | `.claude/agents/constructor-piloto.md` |
| 2026-08-05 | Proyecto Supabase `ialabs-piloto-descubrimiento` creado (sa-east-1, USD 0) | `ynjetrceuwzdillspwcn` ACTIVO |
| 2026-08-05 | 4 migraciones aplicadas (esquema, RLS, RAG/storage/realtime, endurecimiento) | 13 tablas, RLS 100%, advisors limpios salvo D2 |

## Próximos pasos del constructor (orden)

1. *(tras G1+G2)* Estructura n8n del piloto + workflow smoke-test webhook firmado → Supabase → cierra criterio de salida F1.
2. Test de aislamiento RLS con dos usuarios sembrados.
3. Esqueleto Next.js + repo + Vercel (no bloqueado — puede hacerse antes de G1).
4. F2: construir WF-01 Ingesta según doc 03 (flujo MCP n8n completo: SDK reference → best practices → validate → test).
