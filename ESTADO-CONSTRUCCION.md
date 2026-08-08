# Estado de Construcción del Piloto

**Agente responsable:** `constructor-piloto` (definido en `.claude/agents/constructor-piloto.md`)
**Última actualización:** 2026-08-08 (noche, v3) · sesión de Claude Code
**Fase actual:** F3 — **WF-02+03 v3 optimizada, en producción y verificada** ✅. Falta WF-04 (análisis de automatización) para cerrar F3. Nuevas capacidades multimodales especificadas en [08-fuentes-multimodales-y-referencia.md](08-fuentes-multimodales-y-referencia.md).

## Optimización v3 (2026-08-08) — medida, no estimada

`[CORE] WF-02+03 ... v3` · id `qp8pfbyITOcx0KiP` · **PUBLICADO** (v2 `qsllubWGqAW2wRR9` despublicado, se conserva como respaldo).

| Métrica | v2 | v3 | Cómo |
|---|---|---|---|
| Nodos | 40 | **22** | Eliminados 12 nodos HTTP de RAG |
| Llamadas a API de embeddings por run | 6 | **0** | Las 6 preguntas de aspecto son estáticas → precalculadas en `aspect_queries` |
| Llamadas RPC a Supabase para RAG | 6 | **1** | Nueva función `match_chunks_by_aspects` resuelve los 6 aspectos con `cross join lateral` |
| Round-trips de red en el bloque RAG | 12 | **1** | — |
| Pasos descubiertos (mismo corpus) | 2 | **8** | Instrucción de exhaustividad en el prompt |
| Contabilidad de costo | manual | **automática** | `agent_runs.tokens_in/out/cost_usd` se llenan solos |

Costo medido por descubrimiento: **USD 0.072** (7.8k tokens entrada + 3.2k salida) en 37 segundos. La ejecución 157 lo confirma en base de datos.

**Utilidad de mantenimiento:** `[UTIL] Sembrar Embeddings de Aspectos` (id `q5lnnkhplSblgqpc`) — recalcula los 6 embeddings en **una** llamada batch. Ejecutar solo si se editan las preguntas en `aspect_queries`.

### Por qué el enfoque de "caché de embeddings por hash" no aplicaba aquí

Una recomendación externa sugirió cachear embeddings de chunks por hash del texto. La premisa estaba equivocada: los chunks de documentos **ya** se vectorizan una sola vez en WF-01 y viven en `document_chunks` — eso ya era caché por diseño. Lo que se re-vectorizaba innecesariamente eran las **preguntas** de los 6 aspectos, que son constantes. Precalcularlas elimina el 100% de esas llamadas, no solo un porcentaje de aciertos de caché.

## Checklist F3 — Agente de descubrimiento (parcial)

- [x] WF-02+03 construido como un solo workflow (Adaptación A5): `[CORE] WF-02+03 Clasificacion y Descubrimiento v2` · id `qsllubWGqAW2wRR9` · PUBLICADO · webhook `POST .../webhook/piloto-descubrir` · payload `{"project_id":"<uuid>","process_type":"auto|intake_casos|revision_contratos|respuesta_requerimientos"}`
- [x] Clasificación con Claude Haiku 4.5 (HTTP directo): clasificó correctamente `revision_contratos` (confianza 0.7) con justificación razonable
- [x] RAG por 6 aspectos (actores/disparadores/actividades/decisiones/sistemas/fin) sobre `match_chunks`, con deduplicación de fragmentos repetidos entre aspectos
- [x] Síntesis con Claude Sonnet 5 (HTTP directo) → JSON canónico validado y normalizado
- [x] **Regla de honestidad verificada con caso real**: el manual médico no describe un proceso de revisión de contratos; el agente lo declaró (`kind='to_be'`) con vacíos de evidencia explícitos y citas textuales solo donde existen — no inventó nada
- [x] Persistencia completa verificada por SQL: `processes` (canónico completo) + `process_steps` + `agent_runs` completado + `audit_log`
- [ ] WF-04 Análisis de automatización (matriz determinística, `juicio_experto` ≤ L1) — siguiente
- [ ] Validación humana ≥80% con proceso legal real (G5 — necesitará documentos que sí describan el proceso)

### Adaptación A5 (2026-08-08): sin framework AI Agent de n8n

Los nodos AI Agent/LangChain de n8n cloud provocaron 3 crashes por memoria (OOM) consecutivos en esta instancia. WF-02+03 v2 usa **HTTP Request directo a api.anthropic.com** (mismo patrón que los embeddings): liviano, estable, y con control total del payload. Requiere header `anthropic-version: 2023-06-01` (la credencial n8n solo inyecta la api key). Los parsers extraen el bloque `type='text'` de la respuesta (Claude Sonnet 5 puede anteponer bloques `thinking`).

### Bug crítico encontrado y corregido (patrón n8n para memoria del proyecto)

**Multiplicación de ítems en cascada:** los nodos de embedding se ejecutaban una vez por cada ítem entrante, multiplicando ítems entre aspectos (4→16→64→...→4096). Consecuencias: crashes de memoria y una síntesis de 434k tokens de entrada (~USD 1.30). Fix: `executeOnce: true` en los 6 nodos de embedding + deduplicación en la consolidación → **9.3k tokens (~USD 0.03) por descubrimiento**. Regla: en cadenas lineales de n8n donde un nodo produce N ítems, todo nodo posterior que NO deba iterar por ítem debe llevar `executeOnce`.

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
| Vercel | Proyecto `ialabs-plataforma-piloto` (id `prj_vQitUGaJt1VUXAKKtkG5bTPRsByV`) en team `team_vdUfcMOc05SQr2W5L5mKV2cE` · **conectado a GitHub (deploy continuo)** · Root Directory `frontend` · dominio: `https://ialabs-plataforma-piloto.vercel.app` · `/api/health` verificado OK |
| Repo GitHub | `github.com/robbojeda-caio/ialabs-plataforma-piloto` (rama `main`) — fuente del deploy continuo de Vercel |
| Migraciones aplicadas | `esquema_inicial` · `rls_y_politicas` · `rag_storage_realtime` · `endurecimiento_advisors` |
| Workflow n8n smoke test | `[CORE] WF-00 Smoke Test F1` · id `bCLUihGwFRDTMG7I` · PUBLICADO · webhook `POST https://robbojeda.app.n8n.cloud/webhook/piloto-smoke` |
| Workflow n8n ingesta | `[CORE] WF-01 Ingesta de Documentos` · id `741ybdLgusjZzITs` · PUBLICADO · webhook `POST https://robbojeda.app.n8n.cloud/webhook/piloto-ingesta` (header `hmac-webhooks-piloto`, mismo secreto que WF-00) · payload `{"document_id":"<uuid>"}` |
| Credencial Supabase en n8n | `Supabase account` (`ugDUZeEyWqhj8tae`) — G1 ✓ |
| Credencial auth webhooks | `Header Auth account` (`CeN5ODopdKajRAtZ`) — G2 ✓ |
| Tenants de prueba | Org demo `IA Labs Demo Legal` (`aaaaaaaa-...0001`, techo L2) · Org control `Test Aislamiento` (`bbbbbbbb-...0002`) · usuarios `demo-admin@ialabs.test` / `test-b@ialabs.test` (solo RLS, sin login) |

## Compuertas humanas

| # | Estado | Qué se necesita del humano | Instrucciones |
|---|---|---|---|
| **G1** | ✅ RESUELTA (2026-08-05) | Credencial Supabase en n8n | Credencial `Supabase account` verificada y usada por WF-00 |
| **G2** | ✅ RESUELTA (2026-08-05) | Secreto de autenticación de webhooks | Credencial `Header Auth account` verificada; ver Adaptación A2 |
| **G6** | ✅ RESUELTA (2026-08-07) | Verificación end-to-end del webhook | Confirmada: fila `id:2` en `audit_log` con `origen:"curl-usuario"`, `at: 2026-08-07 18:47:06 UTC`. Causa del error inicial: el campo Value de la credencial Header Auth había quedado vacío (`__n8n_BLANK_VALUE_...`) — resuelto regenerando el secreto con `openssl rand -hex 32` y cargándolo en n8n |
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
- [x] **Verificación end-to-end del webhook con auth real** → G6 resuelta, fila confirmada en `audit_log`

**F1 completa. Criterio de salida del roadmap (doc 07) cumplido: un webhook firmado de prueba viaja frontend→n8n→Supabase y escribe una fila.**

Pendientes de mantenimiento (no bloquean F2):
- [x] Variables de entorno en Vercel → **G7 resuelta (2026-08-08)** (las variables están cargadas)
- [x] Remoto GitHub → **G8 resuelta (2026-08-08)**: repo real `github.com/robbojeda-caio/ialabs-plataforma-piloto`, push confirmado (`main` sincronizado, commit `b1474c1`), Keychain configurado para no repetir autenticación

### G9 — RESUELTA (2026-08-08): permisos de deploy en Vercel

Causa real: no era un problema de rol/permiso sino de **visibilidad del proyecto** para la integración — mi conexión dejó de ver el proyecto original por completo (`list_projects` devolvía vacío). Se resolvió reconectando vía **Vercel → Add New Project → Import Git Repository** apuntando al repo `robbojeda-caio/ialabs-plataforma-piloto` (recién creado en G8), lo cual generó una nueva autorización de acceso. De paso, esto deja el deploy en modo correcto según el diseño (doc 01 §5): **deploy continuo por Git**, ya no por subida manual de archivos vía MCP (cierra la Adaptación A3).

En el camino apareció un segundo problema (no de permisos): el import inicial trajo **Root Directory** vacío (raíz del repo) en vez de `frontend/`, donde vive el código Next.js — el build fallaba con "Couldn't find any pages or app directory". Corregido por el usuario en Settings → General → Root Directory = `frontend`, seguido de Redeploy manual.

**Verificado end-to-end:** deployment `dpl_HG3sCPmNQ5JVDEm4MNPL7tLhFAtt` en estado `READY`; `GET https://ialabs-plataforma-piloto.vercel.app/api/health` responde `{"supabase_configurada": true, "webhook_n8n_configurado": true}`.

## Checklist F2 — Ingesta + RAG

- [x] WF-01 Ingesta construido (26 nodos): webhook autenticado → obtener documento → marcar procesando → limpiar chunks previos (idempotencia) → descargar de Storage → enrutar por tipo (PDF/texto) → extraer → fragmentar (~1000 tokens, solape ~150) → lote de embeddings (OpenAI text-embedding-3-small) → guardar en `document_chunks` → marcar indexado + auditoría
- [x] Manejo honesto de fallos: formato no soportado y extracción vacía marcan `documents.status='ilegible'` con `error_detail` claro + fila en `audit_log`, nunca fallan en silencio
- [x] Credenciales corregidas (la auto-asignación no las adjuntó a los 2 nodos HTTP Request; se corrigió con `setNodeCredential`)
- [x] **Prueba estructural end-to-end con datos simulados APROBADA** (ejecución 144): ruta completa webhook→extracción→fragmentación→embeddings→guardado→respuesta, sin errores
- [x] Publicado y activo
- [x] **Prueba end-to-end con documento REAL aprobada** (ejecución 147): "Manual roles.pdf" → indexado, 4 fragmentos con embeddings válidos
- [x] `match_chunks` validada funcionalmente (auto-consulta: coincidencia perfecta + orden coherente); ampliar con más documentos es mejora continua, no bloqueo
- [x] Bug de idempotencia encontrado y corregido con datos reales (ver bitácora)
- [x] Credencial OpenAI real configurada (G10)

**F2 completa.** Criterio de salida del roadmap cumplido con datos reales: documento → indexado → recuperación semántica funcional.

### G10 — RESUELTA (2026-08-08): credencial OpenAI real para embeddings

Usuario creó credencial n8n `OpenAI account` (id `oKyZHkq17IHtyqec`, llave `agente-descubrimiento-piloto` en la plataforma OpenAI). Nodo `Generar Embeddings` reapuntado. **Verificado end-to-end (ejecución 147):** "Manual roles.pdf" → `documents.status='indexado'`, 4 fragmentos con embeddings de 1536 dimensiones y solapamiento correcto (600 caracteres). `match_chunks` probada con auto-consulta: devuelve el propio fragmento como coincidencia perfecta (1.0000) y ordena el resto coherentemente (0.86 / 0.83 / 0.75). **F2 funcionalmente completa.**

<details><summary>Bloqueo anterior (ya resuelto)</summary>

Prueba real con documento del usuario ("Manual roles.pdf", manual de procesos de un centro médico — buen caso de prueba) reveló: la credencial `n8n free OpenAI API credits` es un crédito **administrado** por n8n, solo utilizable desde sus nodos nativos de IA (que a su vez solo operan como sub-nodos de un pipeline de vector store rígido, incompatible con el esquema `document_chunks` diseñado para RLS multi-tenant). Vía HTTP Request directo (como diseñé WF-01) falla: *"Your authentication token is not from a valid issuer."*

**Qué necesito de ti:** una llave real de OpenAI (`sk-...`), añadida como **nueva credencial n8n** separada de la gratuita:
1. Crea una cuenta/llave en [platform.openai.com/api-keys](https://platform.openai.com/api-keys) (requiere método de pago cargado, pero el costo es mínimo: ~USD 0.02 por cada 1M tokens con `text-embedding-3-small` — para el piloto, centavos totales).
2. En n8n → Credentials → **New** → tipo **OpenAi API** → pega la llave → guarda con un nombre claro, ej. `OpenAI real (embeddings)`.
3. Avísame el nombre que le pusiste — actualizo el nodo `Generar Embeddings` para usar esa credencial en vez de la gratuita.

El documento de prueba ya quedó extraído y fragmentado correctamente; en cuanto resuelvas esto, solo falta re-ejecutar la ingesta (ya lo hago yo, sin necesidad de que subas nada de nuevo).

</details>

### F2 — sin bloqueos activos

1. ✅ Documento real subido, ingerido, indexado y recuperación semántica validada.
2. Opcional, no bloqueante: agregar 1–2 documentos más ampliaría la validación de `match_chunks` con consultas más diversas — se puede hacer en paralelo mientras avanza F3.

### Adaptación A4 — Limitación de formato en WF-01 v1

El nodo `extractFromFile` de esta instancia de n8n **no soporta DOCX ni EML** de forma nativa (solo PDF, texto plano, CSV, HTML, RTF, XML, ODS, XLS/XLSX). WF-01 v1 cubre PDF y texto plano; DOCX/EML se marcan `ilegible` con mensaje explícito en vez de fallar en silencio. Queda como mejora F2.1: evaluar un servicio externo de conversión (o LlamaParse, disponible como nodo conectado en esta instancia n8n) si el corpus real del cliente incluye Word/correo.

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

## Lección operativa (para futuras compuertas de credenciales)

Al pedir al usuario que cargue un secreto en una credencial de n8n (tipo Header Auth u otras), especificar explícitamente: **"genera el valor primero en tu propia Terminal (ej. `openssl rand -hex 32`), guárdalo en tu gestor de contraseñas, y solo entonces pégalo en n8n"**. n8n oculta el campo Value tras guardar (no se puede releer) — si el usuario intenta verlo después, encontrará el marcador `__n8n_BLANK_VALUE_...` si nunca llegó a escribirse un valor real, lo cual causa `Authorization data is wrong!` en el webhook. Este fue el incidente real que retrasó G6.

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
| 2026-08-07 | Diagnóstico y resolución de G6: credencial Header Auth con Value vacío (`__n8n_BLANK_VALUE_...`) | Usuario regeneró secreto y lo cargó en n8n |
| 2026-08-07 | **G6 verificada — fila `id:2` confirmada en `audit_log`** | **F1 COMPLETADA** |
| 2026-08-07 | Instrucciones G7 (env vars Vercel, con anon key obtenida vía MCP) y G8 (repo GitHub) entregadas al usuario | Pendientes de mantenimiento, no bloquean |
| 2026-08-07 | WF-01 Ingesta de Documentos construido (26 nodos) vía SDK n8n | id `741ybdLgusjZzITs` |
| 2026-08-07 | Corregidas credenciales de 2 nodos HTTP Request (auto-asignación las omitió) | `setNodeCredential` aplicado |
| 2026-08-07 | Prueba estructural end-to-end con datos simulados (texto plano, 1 chunk) | Ejecución 144 — éxito, ruta completa sin errores |
| 2026-08-07 | WF-01 publicado y activo | Webhook `POST .../webhook/piloto-ingesta` |
| 2026-08-08 | Usuario resolvió G7 (env vars en Vercel) | Confirmado por el usuario |
| 2026-08-08 | Intento de redeploy para aplicar G7 → **403 Forbidden** en producción y en preview | Nuevo bloqueo **G9**, pendiente de diagnóstico del usuario |
| 2026-08-08 | Corregido remoto GitHub (URL real del usuario) y push exitoso | **G8 resuelta**: repo `robbojeda-caio/ialabs-plataforma-piloto` sincronizado |
| 2026-08-08 | Usuario reconectó Vercel vía Import Git Repository; corrigió Root Directory a `frontend`; redeploy | **G9 resuelta**: deployment `READY`, `/api/health` confirma Supabase y webhook n8n configurados |
| 2026-08-08 | Usuario subió "Manual roles.pdf" a Storage; fila creada en `documents` (id `1c20d1b7-...`) | Primer documento real del piloto |
| 2026-08-08 | Ejecución real 145 (vía n8n API, sin pasar por el webhook público) | **Bug encontrado**: `Limpiar Chunks Previos` con 0 filas cortaba toda la cadena — corregido (rama paralela) y republicado |
| 2026-08-08 | Ejecución real 146: extracción PDF y fragmentación exitosas, falla en `Generar Embeddings` | Credencial OpenAI gratuita administrada no funciona vía HTTP directo → **G10 nueva**, pendiente de credencial real del usuario |
| 2026-08-08 | Usuario creó credencial real `OpenAI account`; nodo reapuntado, republicado | **G10 resuelta** |
| 2026-08-08 | Ejecución real 147: ingesta completa de "Manual roles.pdf" | `status='indexado'`, 4 chunks, embeddings 1536-dim, solapamiento correcto |
| 2026-08-08 | `match_chunks` probada con auto-consulta (chunk 2 como query) | Top resultado = mismo chunk (1.0000), resto ordenado coherentemente |
| 2026-08-08 | **F2 declarada completa** | Criterio de salida del roadmap cumplido con datos reales |
| 2026-08-08 | WF-02+03 v1 construido (42 nodos, framework AI Agent) | 3 fallos de infraestructura consecutivos (2 OOM + 1 timeout), todos en los nodos LangChain |
| 2026-08-08 | Diagnóstico de causa raíz: multiplicación de ítems en cascada + peso del framework LangChain | Adaptación A5: reconstruido como v2 con HTTP directo a Anthropic |
| 2026-08-08 | Iteraciones de corrección v2: header `anthropic-version`, parser de bloques thinking, `organization_id` en process_steps, ruta JSON de setNodeParameter | Ejecuciones 151–154 |
| 2026-08-08 | **Ejecución 155: pipeline completo EXITOSO en 20s** | Proceso + pasos + run + auditoría verificados por SQL. Costo por descubrimiento: ~USD 0.03 |

## Próximos pasos del constructor (orden)

0. **WF-06 Descubrimiento por voz** (nuevo, alta prioridad): audio → Whisper → estructuración con Haiku → entra al pipeline existente como `documents.source_type='voz'`. Es la fuente de mayor valor/esfuerzo para el piloto legal: resuelve el caso del cliente que no tiene documentación pero sí conoce su proceso. Especificación completa en [08](08-fuentes-multimodales-y-referencia.md) §3.
1. **WF-04 Análisis de automatización** (cierra F3): evalúa cada paso del canónico (volumen/repetición/task_class/riesgo) con la matriz determinística; `juicio_experto` nunca > L1; escribe `automation` en el canónico + `automation_assessments`. Encadenarlo al final de WF-02+03.
2. F4: WF-05 generación de entregables (diagrama Mermaid determinístico, SOP, workflow n8n desde plantillas) desde el canónico.
3. Insumo recomendado del usuario (no bloquea WF-04, sí mejora la demo): subir un documento que SÍ describa un proceso legal paso a paso (SOP de intake, checklist de revisión de contratos) para obtener un descubrimiento `as_is` rico — el manual médico actual solo permite `to_be` (comportamiento correcto de la regla de honestidad, pero una demo as_is luce más).
4. Nota de calidad para F6: la salida del descubridor varía entre corridas (2–9 pasos con la misma evidencia delgada); afinar prompt con instrucción de exhaustividad estable cuando haya corpus real.
