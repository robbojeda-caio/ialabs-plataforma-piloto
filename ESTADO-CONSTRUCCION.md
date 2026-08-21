# Estado de Construcción del Piloto

**Agente responsable:** `constructor-piloto` (definido en `.claude/agents/constructor-piloto.md`)
**Última actualización:** 2026-08-18 · sesión de Claude Code
**Fase actual:** **F4 COMPLETADA** ✅ — los tres entregables se generan end-to-end desde el canónico y están verificados con el proceso real de contratos laborales. Siguiente: F5 (frontend one-click). Capacidades multimodales en [08-fuentes-multimodales-y-referencia.md](08-fuentes-multimodales-y-referencia.md).

## F4 — WF-05 Generación de Entregables ✅ (2026-08-18)

`[CORE] WF-05 Generacion de Entregables` · id `11iQAkj2nqmGutIR` · **PUBLICADO** · webhook `POST .../webhook/piloto-entregables` · payload `{"process_id":"<uuid>"}`

**Principio de diseño:** dos de los tres entregables se generan **determinísticamente en código**; solo el SOP pasa por un modelo.

| Entregable | Cómo se genera | Por qué |
|---|---|---|
| **Diagrama Mermaid** | Código JS desde el canónico | Un diagrama generado por LLM puede contradecir al proceso descubierto. Derivarlo en código lo hace imposible |
| **SOP** | Claude Sonnet, 7 secciones fijas | Redactar prosa profesional sí requiere un modelo; los datos se inyectan del canónico y tiene prohibido agregar contenido |
| **Workflow n8n** | Ensamblado desde plantillas por `task_class` | Pedirle a un LLM que escriba JSON de n8n produce flujos frágiles. Las plantillas están validadas a mano |

**Verificado (ejecución 165, 41 s) sobre el proceso real de contratos laborales:**
- **Diagrama**: 10 nodos con forma por tipo y color por nivel de autonomía; capturó incluso el **ciclo de reproceso** (paso 6 → paso 4 cuando el socio no aprueba el redline)
- **SOP**: 9.500 caracteres, cada paso con **cita textual de la narración**; detectó que "RUF" podría ser un error de dicción y lo declaró como vacío de evidencia en vez de corregirlo en silencio
- **Workflow n8n**: 11 nodos, con los 3 pasos de juicio profesional como **paradas humanas explícitas** (`noOp` con nota), no como huecos; incluye advertencia de que requiere revisión y credenciales antes de activarse

**Costo de la cadena completa, medido: USD 0,136 y ~1 min 51 s** desde audio hasta los tres entregables.

**Vista de entregables (demo):** https://claude.ai/code/artifact/b1a78e6c-65ca-42a3-81cf-348f39743789 — sirve como referencia visual para construir la pantalla de resultados de F5.

### ⚠️ Operación: el proyecto Supabase se pausa por inactividad

El plan free pausa el proyecto tras ~7 días sin uso, y entonces **falla todo**: Storage no acepta subidas y las consultas dan timeout. Ocurrió el 2026-08-15 (el usuario no pudo subir un audio por esta causa, no por error suyo). Se reactiva desde el dashboard de Supabase o vía MCP (`restore_project`), tarda ~2 minutos. **Antes del cliente piloto real (F6) hay que pasar a Supabase Pro** (USD 25/mes) — ya estaba previsto en [06](06-costos-y-operacion.md), pero esta es la razón concreta y urgente: un cliente no puede encontrarse la plataforma caída porque nadie la usó una semana.

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

## WF-04 Análisis de Automatización — construido y verificado ✅ (2026-08-15) → **F3 COMPLETA**

`[CORE] WF-04 Analisis de Automatizacion` · id `x3I3COhwQciUckaJ` · **PUBLICADO** · webhook `POST .../webhook/piloto-automatizacion` · payload `{"process_id":"<uuid>"}`

**Principio de diseño:** el modelo evalúa **dimensiones objetivas** (volumen, repetición, clase de tarea, riesgo); el **sistema decide el nivel de autonomía** con una matriz determinística en JavaScript. El LLM nunca elige cuánta autonomía se concede — esa decisión no puede depender de la variabilidad de un modelo.

**Resultado de la ejecución 159 sobre el proceso real descubierto (8 pasos), verificado por SQL:**

| # | Paso | Clase | Riesgo | Nivel |
|---|---|---|---|---|
| 1 | Gestionar compras institucionales | enrutamiento | medio | **L2** |
| 2 | Coordinar con proveedores | enrutamiento | bajo | **L2** |
| 3 | Supervisar contratos de servicios | verificación | medio | **L2** |
| 4 | Verificar cumplimiento legal y normativo | **juicio_experto** | alto | **L0** |
| 5 | Aprobar convenios y alianzas | **juicio_experto** | alto | **L0** |
| 6 | Autorizar contratación asociada | **juicio_experto** | alto | **L0** |
| 7 | Coordinar auditorías internas/externas | verificación | medio | **L2** |
| 8 | Dar seguimiento a indicadores | **juicio_experto** | medio | **L0** |

**La salvaguarda profesional funciona con datos reales:** los cuatro pasos que exigen criterio de abogado —verificar cumplimiento legal, aprobar convenios, autorizar contrataciones, dar seguimiento con criterio— quedaron en **L0 (el agente solo informa, nunca actúa)**. Los cuatro pasos administrativos y de verificación quedaron en L2. Ningún paso superó el techo L2 de la organización. Costo: **USD 0.0154**, 13 segundos, 26 minutos automatizables estimados por ejecución del proceso.

## WF-06 Descubrimiento por Voz — construido ✅ (2026-08-08)

`[CORE] WF-06 Descubrimiento por Voz` · id `1drZWkusLtn7ZEzi` · **PUBLICADO** · webhook `POST https://robbojeda.app.n8n.cloud/webhook/piloto-voz` · payload `{"project_id":"<uuid>","storage_path":"<org>/<proj>/<archivo>","filename":"<nombre>"}`

Cadena: descarga audio de Storage → Whisper (`language=es`, `verbose_json`) → **guarda `transcript_raw` intacto** → edición estructural con Haiku → chunks + embeddings → `document_chunks`. Audio inaudible o transcripción < 30 caracteres se marca `ilegible` con motivo claro.

Dos decisiones de diseño que conviene no perder:
1. **El editor tiene prohibido inventar.** El prompt de Haiku permite corregir puntuación, quitar muletillas y organizar en secciones; prohíbe agregar pasos, actores, plazos o sistemas no mencionados. Lo ambiguo se marca `[impreciso: ...]` en vez de completarse. Un texto con vacíos marcados vale más que uno completo e inventado.
2. **El texto indexado lleva su origen declarado** en el encabezado (`FUENTE: narración oral...`), de modo que cuando el agente de descubrimiento lo cite como evidencia, quede claro que su respaldo es un testimonio oral y no un documento formal.

### ✅ VERIFICADO end-to-end con voz real del usuario (2026-08-15) — hito del piloto

El usuario grabó su propia narración (`prueba 1 wf revision contrato laboral.m4a`, 4.93 MB, 2:40 min) describiendo el proceso real de revisión de contratos laborales de su estudio. **Cadena completa validada: voz → transcripción → descubrimiento → análisis de automatización.**

| Etapa | Resultado |
|---|---|
| Transcripción (Whisper) | 2.135 caracteres, español, 160 s de audio |
| Edición estructural (Haiku) | Fiel: organizó en secciones sin agregar nada (verificado contra `transcript_raw`) |
| **Descubrimiento** | **`kind='as_is'`** — primer proceso del piloto con evidencia suficiente para reconstruir la realidad, no diseñarla. 10 pasos, 37 s, USD 0.0596 |
| Análisis de automatización | 10 pasos evaluados, 13 s, USD 0.0187, **62 minutos automatizables por ejecución** |

**Costo total de la cadena completa: ~USD 0.10 por proceso descubierto desde voz.**

Ajustes de límites aplicados antes de la prueba: validación contra el tope de 24 MB de Whisper con mensaje accionable, y timeouts de 900 s (transcripción) / 300 s (descarga y estructuración) para soportar audios de hasta ~1 hora.

**Bug encontrado y corregido durante la prueba (importante para futuros workflows):** los nodos Code de n8n **no propagan el binario** — hay que devolver `binary: item.binary` explícitamente o el archivo se pierde para el nodo siguiente. Además, en modo filesystem el campo `binary.data` contiene el marcador `'filesystem-v2'`, no el base64; el tamaño exacto está en `binary.bytes`.

## Caso de referencia del piloto (usar para demos y regresión)

**Proyecto:** `Revisión de contratos laborales (narrado por voz)` · id `cccccccc-1111-0000-0000-000000000003` · proceso id `5b01aa14-03da-4b34-ae5d-bc6853ac30e6`.

Es el mejor activo de demo que tiene el piloto: proceso legal real, narrado por su dueño, descubierto `as_is` con 10 pasos y con una separación nítida entre trabajo administrativo y criterio profesional. Conservarlo intacto y usarlo como caso de regresión al cambiar prompts.

| # | Paso | Clase | Nivel |
|---|---|---|---|
| 1 | Recepción de solicitud y borrador | extracción | L3 |
| 2 | Preparación de documentos (descarga, renombrado, carpetas) | extracción | L3 |
| 3 | Verificación de habilitantes (cédula, RUC, nombramiento, poder) | verificación | L2 |
| 4 | **Revisión del abogado asociado** | **juicio experto** | **L0** |
| 5 | **Revisión de calidad por el socio** | **juicio experto** | **L0** |
| 6 | **Decisión: aprobación del redline** | **juicio experto** | **L0** |
| 7 | Comunicación al cliente y ciclos de reproceso | enrutamiento | L2 |
| 8 | Consolidación y gestión de firmas | extracción | L2 |
| 9 | Registro en sistemas laborales (SUT / IESS) | extracción | L3 |
| 10 | Cierre y archivo | extracción | L3 |

**Dato de gobernanza para conversar con el usuario:** 4 de los 10 pasos se degradaron de L3 a L2 por el techo `max_autonomy='L2'` de la organización. La configuración del cliente está funcionando como freno real, no decorativo.

## Cadena completa encadenada ✅ (2026-08-19)

Un solo disparo al webhook `/piloto-descubrir` produce ahora **todo**: descubrimiento → análisis de automatización → los tres entregables. Verificado (ejecución 166): 12 pasos descubiertos, 12 evaluaciones, 3 entregables, sin intervención manual entre etapas.

Implementación: cada workflow llama al webhook del siguiente con un nodo HTTP autenticado con la misma credencial Header Auth, con `onError: continueRegularOutput`. **Por qué así:** si el encadenamiento falla, lo ya producido queda guardado y puede retomarse — el fallo de un eslabón no borra el trabajo del anterior.

## WF-06 Gate de Autonomía ✅ — la gobernanza deja de ser declarativa (2026-08-19)

`[CORE] WF-06 Gate de Autonomia` · id `yDskXgFOYcp9k4ki` · **PUBLICADO** · invocable de dos formas: como sub-workflow (Execute Workflow) o por `POST .../webhook/piloto-gate` autenticado.

**Qué hace:** cualquier flujo generado lo invoca **antes** de ejecutar un paso. Calcula el nivel efectivo = mín(nivel del paso, techo de la organización) y devuelve `{ejecutar, motivo}`:

| Nivel | Comportamiento | Auditoría |
|---|---|---|
| **L0** | No ejecuta. Registra la sugerencia | `paso.sugerido_sin_ejecutar`, actor **agente** |
| **L1** | Crea propuesta sin plazo y no ejecuta | queda en `pending_approvals` |
| **L2** | Crea solicitud con plazo de 24 h y **detiene el paso** hasta que una persona decida | `paso.aprobado_y_ejecutado` / `paso.no_ejecutado`, actor **usuario** con su id |
| **L3** | Ejecuta y audita | `paso.ejecutado_autonomo`, actor **agente** |

**Cómo se detiene de verdad:** nodo Wait con reanudación por webhook. Al crear la solicitud se guarda `$execution.resumeUrl` en `pending_approvals.resume_token`; el paso queda congelado hasta que alguien decide en el panel. Si nadie decide en 24 h, la espera vence, **no se ejecuta** y la solicitud se marca `expirado`.

**Verificado end-to-end (ejecuciones 169 y 170):**
- L0 → no ejecutó, auditado con actor `agente`
- L2 → quedó detenido con token y plazo; al aprobar, el paso **despertó** y quedó auditado como `paso.aprobado_y_ejecutado` con actor `usuario` **y el id de quien aprobó**

Esa distinción de actor es el corazón de la gobernanza: cuando el agente actúa solo queda registrado como agente; cuando actúa porque alguien lo autorizó, la responsabilidad queda con la persona.

**Frontend:** nueva ruta `app/api/aprobaciones/decidir/route.ts`. Hace dos cosas y ambas importan: registra la decisión en base (evidencia auditable) **y** llama al `resume_token` para despertar el paso. Si la reanudación falla, la decisión ya quedó guardada y el workflow la leerá al vencer su espera — no se pierde.

### Cierre de F4 (2026-08-20): los flujos generados nacen con el freno puesto

Antes, el flujo ensamblado marcaba los pasos L2 con una nota pidiendo *"conectar al gate antes de activar"* — es decir, la gobernanza dependía de que alguien leyera una nota. Ahora el ensamblador construye, por cada paso automatizable, la tríada:

**`Gate` → `¿Autorizado?` → `acción`** · con rama explícita **`No autorizado`**

Un paso L2 no puede ejecutarse sin aprobación **aunque alguien active el flujo sin leer nada**. Verificado en el proceso real: el flujo pasó de 13 a **34 nodos**, con los **7 pasos automatizables cableados al gate** y los 5 de criterio profesional como paradas humanas.

### 🐛 Defecto encontrado y corregido: la regeneración de entregables fallaba en silencio

`deliverables` exige `(process_id, type, version)` único y WF-05 siempre insertaba `version = 1`. Al regenerar entregables de un proceso existente, **el insert fallaba y el workflow reportaba éxito igual**. Iba a ocurrir constantemente en producción (un cliente agrega un documento y vuelve a descubrir).

Corregido: WF-05 consulta los entregables previos y calcula la siguiente versión por tipo, conservando el historial. El nodo de consulta lleva **`alwaysOutputData: true`** — que es además la solución general al patrón de abajo.

### Patrón de n8n que ya mordió dos veces: "éxito" silencioso con 0 filas

Un nodo Supabase que no devuelve filas **corta la cadena y la ejecución termina en `success`**, no en `error`. Pasó con `Limpiar Chunks Previos` (WF-01) y otra vez con `Obtener Proceso` (WF-05, al invocarlo con un id inexistente): el workflow "terminó bien" sin haber hecho nada.

**Antes del cliente real**, todo workflow que empiece obteniendo un registro debe validar que existe y fallar con mensaje claro. Hoy un `process_id` equivocado se ve idéntico a un éxito.

**Solución general:** `alwaysOutputData: true` en el nodo de consulta hace que emita un ítem vacío en vez de nada, y la cadena sigue. Aplicado ya en `Obtener Entregables Previos`; falta revisar el resto de nodos de lectura.

### Deuda conocida: payload de auditoría doblemente codificado

Los campos `jsonb` que n8n escribe con `JSON.stringify` quedan como *string* dentro de `jsonb`, así que `payload->>'campo'` devuelve `null` y hay que leerlos con `(payload #>> '{}')::jsonb`. Afecta a `audit_log.payload`, `deliverables.content` y `processes.canonical`. No rompe nada —el frontend ya los desenvuelve— pero conviene normalizarlo antes del cliente real, porque el panel de auditoría consultable es parte del valor prometido.

## Autoservicio ✅ (2026-08-21) — el cliente ya puede empezar solo

Era el hueco que descalificaba al piloto como producto: **no había forma de crear un proceso ni de invitar a nadie desde la plataforma** — todo se hacía con SQL.

| Pieza | Qué resuelve |
|---|---|
| `components/NuevoProceso.tsx` | Crear un proceso desde el dashboard, eligiendo tipo (o dejando que el agente lo detecte). Al crearlo lleva directo a cargar materiales, porque un proceso vacío no sirve de nada |
| `components/GestionEquipo.tsx` · `app/equipo` | Invitar personas, ver quién entró y quién falta, revocar invitaciones |
| Tabla `invitations` + disparador | El corazón del diseño (ver abajo) |
| `projects.created_by` con `default auth.uid()` | El frontend ya no tiene que saber quién es el usuario |

### Decisión de diseño: las invitaciones NO dependen del correo

El administrador registra el correo de la persona; cuando esa persona crea su cuenta con ese mismo correo, **un disparador en la base la vincula sola**. El admin comparte el enlace por donde quiera (WhatsApp, su propio correo).

**Por qué así:** hoy mismo el límite de envíos de Supabase dejó al usuario sin poder entrar. Un sistema de invitaciones que depende del correo hereda esa fragilidad: si el correo falla, el cliente no puede armar su equipo. Este diseño funciona aunque el correo esté caído, y sigue funcionando igual cuando haya SMTP propio.

**Verificado end-to-end en base:** se invitó a un correo inexistente, se creó la cuenta, y la membresía apareció sola con la invitación marcada como aceptada.

## F5 — Frontend one-click ✅ construido (2026-08-19)

**Build limpio: 8 rutas.** Desplegado por Git a Vercel.

| Archivo | Qué resuelve |
|---|---|
| `components/PantallaDescubrimiento.tsx` | **La pantalla del one-click**: captura (documentos o voz) → botón único → progreso → resultados, en un solo lugar. Gestiona las tres fases sin que el usuario navegue |
| `components/GrabadorVoz.tsx` | Grabación en navegador (Opus 24 kbps ≈ 10 MB/hora), medidor de nivel, **corte automático a los 15 min**, guion de 5 preguntas visible mientras se graba |
| `components/CargaDocumentos.tsx` | Arrastrar y soltar con subida directa a Storage bajo RLS; valida formato y tamaño **antes** de subir y explica el rechazo en lenguaje claro |
| `components/ProgresoDescubrimiento.tsx` | Realtime sobre `agent_runs` con sondeo de respaldo. Muestra el paso en lenguaje natural que escribe el agente, no un porcentaje mudo |
| `components/VisorEntregables.tsx` | Las 3 pestañas, leyenda de niveles, banner honesto si el proceso es `to_be`, aviso de revisión antes de activar |
| `components/ListaAprobaciones.tsx` | Aprobaciones L2 en tiempo real; el rechazo pide motivo y queda en auditoría |
| `app/page.tsx` · `app/proyecto/[id]` · `app/aprobaciones` · `app/entrar` | Dashboard con minutos automatizables por proyecto, pantalla de proceso, panel de aprobaciones y acceso por enlace mágico |
| `app/api/{descubrir,voz,ingesta}/route.ts` | Disparan los webhooks. **El secreto vive solo en el servidor**: el navegador nunca lo ve |
| `middleware.ts` | Refresca la sesión en cada navegación |

### Compuerta G12 — poner el frontend en uso real

Falta una vez del lado del usuario, porque toca identidad y no puedo hacerlo yo:

1. **Habilitar el acceso por correo** en Supabase → Authentication → Providers → Email (activar "Email OTP" / magic link). En Authentication → URL Configuration, agregar `https://ialabs-plataforma-piloto.vercel.app` como Site URL y Redirect URL.
2. **Crear tu usuario real**: entrar a `/entrar` con tu correo y pedir el enlace. Eso crea la cuenta en `auth.users`.
3. **Vincularte a la organización demo** (avísame y lo hago con SQL, o hazlo tú): insertar en `memberships` tu `user_id` con la organización `aaaaaaaa-0000-0000-0000-000000000001` y rol `admin`. Sin esa fila, RLS te dejará fuera de todo — que es exactamente lo que debe pasar.

## Camino de piloto a producto vendible (acordado 2026-08-21)

| # | Qué | Estado |
|---|---|---|
| 1 | **Crear procesos e invitar equipo desde la pantalla** | ✅ hecho |
| 2 | Limpiar datos de prueba y separar ambiente demo del de clientes | pendiente |
| 3 | Descarga de entregables (SOP en PDF/DOCX) — es lo que el cliente enseña internamente | pendiente |
| 4 | Correo propio (Resend) + Supabase Pro | pendiente |
| 5 | Activar flujos de verdad (conectores) — el salto grande | pendiente |

## Próximos pasos del constructor (orden)

1. **G12 (usuario)**: habilitar acceso por correo en Supabase y vincular su usuario a la organización — es lo que falta para usar el frontend de verdad.
2. Probar el flujo completo desde el navegador: grabar → descubrir → ver entregables → aprobar un paso L2, y corregir lo que aparezca.
3. Que WF-05 genere los flujos **ya conectados al gate**: hoy el workflow ensamblado marca los pasos L2 con una nota que dice "conectar al gate antes de activar"; con WF-06 construido, el ensamblador puede insertar esa llamada automáticamente.
4. Normalizar los campos `jsonb` doblemente codificados (ver deuda arriba).
5. Después: WF-07 grabación de pantalla y WF-08 comparación con corpus de referencia (ver [08](08-fuentes-multimodales-y-referencia.md)).
3. Guardar el SOP como archivo en Storage (hoy vive como Markdown en `deliverables.content`; para descargar en DOCX/PDF falta el paso de conversión).
4. Nota de calidad para F6: la salida del descubridor varía entre corridas con evidencia delgada; con corpus real conviene medir estabilidad.
