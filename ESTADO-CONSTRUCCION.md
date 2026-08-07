# Estado de Construcción del Piloto

**Agente responsable:** `constructor-piloto` (definido en `.claude/agents/constructor-piloto.md`)
**Última actualización:** 2026-08-05 (tarde) · sesión de Claude Code
**Fase actual:** F1 — Infraestructura base (~95% — solo falta la verificación end-to-end del webhook por el usuario)

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
| Vercel | Proyecto `ialabs-plataforma-piloto` en team `team_vdUfcMOc05SQr2W5L5mKV2cE` · URL: `https://ialabs-plataforma-piloto-robbojeda-2293s-projects.vercel.app` |
| Migraciones aplicadas | `esquema_inicial` · `rls_y_politicas` · `rag_storage_realtime` · `endurecimiento_advisors` |
| Workflow n8n smoke test | `[CORE] WF-00 Smoke Test F1` · id `bCLUihGwFRDTMG7I` · PUBLICADO · webhook `POST https://robbojeda.app.n8n.cloud/webhook/piloto-smoke` |
| Credencial Supabase en n8n | `Supabase account` (`ugDUZeEyWqhj8tae`) — G1 ✓ |
| Credencial auth webhooks | `Header Auth account` (`CeN5ODopdKajRAtZ`) — G2 ✓ |
| Repo Git | Inicializado en el directorio del proyecto (rama `main`, commit inicial `3abe811`) — sin remoto aún |
| Tenants de prueba | Org demo `IA Labs Demo Legal` (`aaaaaaaa-...0001`, techo L2) · Org control `Test Aislamiento` (`bbbbbbbb-...0002`) · usuarios `demo-admin@ialabs.test` / `test-b@ialabs.test` (solo RLS, sin login) |

## Compuertas humanas

| # | Estado | Qué se necesita del humano | Instrucciones |
|---|---|---|---|
| **G1** | ✅ RESUELTA (2026-08-05) | Credencial Supabase en n8n | Credencial `Supabase account` verificada y usada por WF-00 |
| **G2** | ✅ RESUELTA (2026-08-05) | Secreto de autenticación de webhooks | Credencial `Header Auth account` verificada; ver Adaptación A2 |
| **G6** | 🔴 PENDIENTE | **Verificación end-to-end del webhook** (cierra F1) | Ejecutar el curl de la sección «Verificación E2E» de abajo con el nombre/valor del header que configuraste en `Header Auth account`, y avisar al agente con el resultado |
| **G7** | 🔴 PENDIENTE | **Variables de entorno en Vercel** | En Vercel → proyecto `ialabs-plataforma-piloto` → Settings → Environment Variables: crear `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (dashboard Supabase → Settings → API → anon public), `N8N_WEBHOOK_BASE_URL`, `WEBHOOK_AUTH_HEADER_NAME` y `WEBHOOK_AUTH_HEADER_VALUE` (los del Header Auth). Ver `frontend/.env.example` |
| **G8** | 🟡 RECOMENDADA | **Remoto GitHub del repo** | Crear repo privado en GitHub y conectarlo (`git remote add origin ...` + push). Además conectar el repo al proyecto Vercel para deploy continuo (hoy se despliega por archivos vía MCP) |
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
- [x] Credencial Supabase cargada en n8n (G1 ✓)
- [x] Workflow smoke-test `[CORE] WF-00` creado, probado (ejecución 142 OK) y publicado
- [x] **Test de aislamiento RLS APROBADO**: usuario A ve solo su org/proyecto, usuario B ídem, fuga cruzada = 0 en ambas direcciones
- [x] Repo Git inicializado + esqueleto Next.js + deploy a Vercel
- [ ] Verificación end-to-end del webhook con auth real (curl del usuario) → **G6**
- [ ] Variables de entorno en Vercel → **G7**

### Verificación E2E (para G6)

```bash
curl -s -X POST "https://robbojeda.app.n8n.cloud/webhook/piloto-smoke" \
  -H "Content-Type: application/json" \
  -H "<NOMBRE_DEL_HEADER>: <VALOR_DEL_HEADER>" \
  -d '{"organization_id":"aaaaaaaa-0000-0000-0000-000000000001","origen":"curl-usuario"}'
```

Respuesta esperada: `{"ok":true,"accion":"smoke_test.f1",...}`. Sustituir `<NOMBRE_DEL_HEADER>` y `<VALOR_DEL_HEADER>` por los configurados en la credencial `Header Auth account` de n8n. Tras ejecutarlo, el agente verificará la fila en `audit_log`.

## Adaptaciones al diseño original

- **A1 (2026-08-05):** El piloto se construye sobre la **instancia n8n ya existente** del usuario (operativa, con credencial Anthropic y 6 agentes legales previos) en lugar de esperar el VPS del ADR-3. Razón: elimina el bloqueo de dinero/compra al inicio y acelera F1–F5. La decisión VPS queda en G3, a reevaluar antes del cliente real (residencia y aislamiento de datos).
- **A2 (2026-08-05):** Autenticación de webhooks = **secreto compartido en header** (credencial Header Auth de n8n) sobre TLS, en lugar de firma HMAC-SHA256 computada. Razón: en n8n cloud un nodo Code no puede leer secretos de credenciales para verificar firmas, y el secreto en header sobre TLS ofrece protección equivalente para el piloto. La firma HMAC completa (integridad + anti-replay) se retoma si se migra al VPS (G3), donde hay variables de entorno propias. El doc 05 §4 queda matizado por esta adaptación.
- **A3 (2026-08-05):** El deploy a Vercel se hace **por árbol de archivos vía MCP** (sin repo conectado). Cuando se resuelva G8 (remoto GitHub), pasar a deploy continuo por Git como manda el doc 01 §5.

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
| 2026-08-05 | G1 y G2 resueltas por el usuario; credenciales verificadas | `Supabase account` + `Header Auth account` |
| 2026-08-05 | Tenants de prueba sembrados + test de aislamiento RLS | APROBADO — fuga 0 en ambas direcciones |
| 2026-08-05 | WF-00 Smoke Test creado (SDK MCP), test ejecución 142 OK, publicado | Webhook activo `POST .../webhook/piloto-smoke` |
| 2026-08-05 | Esqueleto Next.js creado (`frontend/`) y desplegado a Vercel | Proyecto `ialabs-plataforma-piloto` (deploy `dpl_BkWm...` en verificación) |
| 2026-08-05 | Repo Git inicializado, commit inicial `3abe811` | 22 archivos |

## Próximos pasos del constructor (orden)

1. Verificar respuesta HTTP del deploy Vercel; si el build falló, corregir con `get_deployment_build_logs`.
2. *(tras G6)* Confirmar la fila `smoke_test.f1` en `audit_log` vía SQL → **cierra F1 formalmente**.
3. *(tras G7)* Redesplegar frontend y confirmar `/api/health` con `supabase_configurada: true`.
4. F2: construir WF-01 Ingesta según doc 03 (extracción PDF/DOCX, chunking ~1000 tokens, embeddings, upsert idempotente) + preparar corpus legal de prueba.
5. F2: validar `match_chunks` con 10 consultas manuales sobre el corpus.
