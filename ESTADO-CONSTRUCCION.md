# Estado de Construcción del Piloto

**Agente responsable:** `constructor-piloto` (definido en `.claude/agents/constructor-piloto.md`)
**Última actualización:** 2026-08-07 (tarde) · sesión de Claude Code
**Fase actual:** F2 — Ingesta + RAG (WF-01 construido, publicado y probado estructuralmente ~60% — falta corpus real del usuario)

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
| Workflow n8n ingesta | `[CORE] WF-01 Ingesta de Documentos` · id `741ybdLgusjZzITs` · PUBLICADO · webhook `POST https://robbojeda.app.n8n.cloud/webhook/piloto-ingesta` (header `hmac-webhooks-piloto`, mismo secreto que WF-00) · payload `{"document_id":"<uuid>"}` |
| Credencial Supabase en n8n | `Supabase account` (`ugDUZeEyWqhj8tae`) — G1 ✓ |
| Credencial auth webhooks | `Header Auth account` (`CeN5ODopdKajRAtZ`) — G2 ✓ |
| Repo Git | Inicializado en el directorio del proyecto (rama `main`, commit inicial `3abe811`) — sin remoto aún |
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
- [ ] Remoto GitHub → **G8**

### G9 — NUEVO bloqueo: permisos de deploy en Vercel (2026-08-08)

Al intentar redesplegar para aplicar las variables de G7, tanto el deploy a producción como a preview fallaron con **403 Forbidden**: *"You don't have permission to create a [Production/Preview] Deployment for this project"*. El primer deploy (el que creó el proyecto) sí funcionó — algo cambió desde entonces.

**Qué revisar tú:**
1. En Vercel → tu perfil (esquina superior derecha) → **Settings → Integrations** (o busca "Claude" / "MCP" / "Connections"): confirma que la integración que uso sigue autorizada y con permiso de escritura, no solo lectura.
2. En el proyecto `ialabs-plataforma-piloto` → **Settings → General**: confirma que tu rol en el team `robbojeda-2293s-projects` es Owner o Member (no Viewer/limitado).
3. Revisa si el proyecto tiene activada alguna protección de despliegue (**Settings → Deployment Protection**) que ahora exija aprobación.

No reintentaré el deploy hasta que confirmes cuál era la causa — reintentar un 403 no lo resuelve.
**Consecuencia mientras tanto:** el frontend en Vercel sigue en la versión desplegada anteriormente (sin las variables de entorno nuevas activas); esto no bloquea F2 (que corre entero en n8n/Supabase), solo pausa el avance visual del esqueleto de F5.

## Checklist F2 — Ingesta + RAG

- [x] WF-01 Ingesta construido (26 nodos): webhook autenticado → obtener documento → marcar procesando → limpiar chunks previos (idempotencia) → descargar de Storage → enrutar por tipo (PDF/texto) → extraer → fragmentar (~1000 tokens, solape ~150) → lote de embeddings (OpenAI text-embedding-3-small) → guardar en `document_chunks` → marcar indexado + auditoría
- [x] Manejo honesto de fallos: formato no soportado y extracción vacía marcan `documents.status='ilegible'` con `error_detail` claro + fila en `audit_log`, nunca fallan en silencio
- [x] Credenciales corregidas (la auto-asignación no las adjuntó a los 2 nodos HTTP Request; se corrigió con `setNodeCredential`)
- [x] **Prueba estructural end-to-end con datos simulados APROBADA** (ejecución 144): ruta completa webhook→extracción→fragmentación→embeddings→guardado→respuesta, sin errores
- [x] Publicado y activo
- [ ] **Prueba end-to-end con documentos REALES** → necesita corpus del usuario (ver abajo)
- [ ] Validar `match_chunks` con 10 consultas manuales sobre el corpus real

### Lo que necesito de ti para terminar F2

1. **2–3 documentos de prueba** en PDF o texto plano (.txt/.md) — ver limitación de formato abajo. Pueden ser un SOP, un contrato tipo, o cualquier documento del proceso legal que quieras que descubramos primero (intake, revisión de contratos, o requerimientos).
2. Súbelos tú mismo al bucket `documentos` de Supabase Storage: **Supabase Dashboard → proyecto `ialabs-piloto-descubrimiento` → Storage → bucket `documentos`** → crea la carpeta `aaaaaaaa-0000-0000-0000-000000000001/aaaaaaaa-1111-0000-0000-000000000001/` (es la organización y proyecto de prueba que ya existen) y sube ahí los archivos.
3. Avísame los nombres de archivo que subiste — yo creo las filas correspondientes en la tabla `documents` (vía SQL) y ejecuto la ingesta real para validarla contra tus datos.

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

## Próximos pasos del constructor (orden)

1. *(pendiente de mantenimiento, no bloquea)* G7: variables de entorno en Vercel; G8: remoto GitHub.
2. **F2 — arrancar ahora:** construir WF-01 Ingesta según doc 03 (extracción PDF/DOCX/TXT/EML, chunking ~1000 tokens con solapamiento 150, embeddings OpenAI text-embedding-3-small, upsert idempotente en `document_chunks`).
3. F2: preparar/solicitar al usuario un corpus legal de prueba (15–20 documentos) del primer proceso a descubrir.
4. F2: validar `match_chunks` con 10 consultas manuales sobre el corpus antes de dar F2 por cerrada.
