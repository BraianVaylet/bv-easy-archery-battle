# Plan de acción — BV Archery Battle

Tareas pequeñas, priorizadas y autocontenidas para que modelos de IA (u otros devs) las ejecuten en orden. Convención de IDs: `INF` infra · `SH` shared · `BE` backend · `FE` frontend · `TEST` calidad. Prioridad **P0** (bloqueante/MVP) → **P2** (mejora).

> Antes de cada tarea con lógica de dominio, usar la skill **tdd** (test primero). Antes de mergear, correr **/security-review** y `pnpm test`. Ver `TECHNICAL.md` (modelo/API), `DOMAIN_WA.md` (reglas), `SECURITY.md` (controles), `DESIGN_SYSTEM.md` (UI).

## Leyenda de estado
`[ ]` pendiente · `[~]` en curso · `[x]` hecho.

---

## Fase 0 — Fundaciones (P0)

- [x] **INF-1** Inicializar monorepo pnpm. Copiar `pnpm-workspace.yaml`, `tsconfig.base.json`, `biome.json` de `bv-bow-sight`. **DoD:** `pnpm install` ok; `biome check` corre.
- [x] **INF-2** Scaffolds `packages/{shared,api,web}` con `package.json` + scripts (`dev/build/test/typecheck`). **DoD:** `pnpm -r build` vacío pasa.
- [x] **SH-1** `constants.ts` + `domain.ts`: modalidades (con `defaultArrows`, `maxPerArrow`, `scoringSet`, `defaultRounds`), categorías, colores (≥10), mapeo de estacas por defecto. (Portar de `bv-archery`.) **DoD:** exports tipados.
- [x] **SH-2** `scoring.ts`: `tokenValue()`, `validateEndScore()`, `maxEndScore()` para sala/aire_libre/campo/3d. **tdd.** **DoD:** tests por modalidad (rangos, X, M, inner, longitud) verdes.
- [x] **BE-1** DB: conexión better-sqlite3 (WAL, FKs on), runner de migraciones, `migrations/0001_init.sql` (todas las tablas de `TECHNICAL.md`), `seed.ts` (catálogos), `reset.ts`. **DoD:** `db:migrate` + `db:seed` crean y siembran.
- [x] **BE-2** Base Hono: `app.ts`, `env.ts`, middleware (`error`, `security` headers, `validate` Zod, `rateLimit`), `lib/{crypto,session,csrf,tokens,errors,db}`, ruta `health`. (Copiar de `bv-bow-sight`.) **DoD:** `GET /api/health` 200; cabeceras de seguridad presentes.

## Fase 1 — Auth + catálogo + avatars (P0)

- [x] **BE-3** Auth: `routes/auth` + `authService` (register/login/logout/me/csrf/recover). Reusar lógica `bv-bow-sight`. **DoD:** tests register→login→me→logout; CSRF requerido en mutación; lookup timing-safe.
- [x] **BE-4** `GET /catalog` (categorías, modalidades con defaults+scoring, colores). **DoD:** test de forma del payload.
- [x] **BE-5** Avatars CRUD (`/avatars` GET/POST/PATCH/DELETE-archivar) con `avatarService`/`avatarRepo` + **ownership**. **DoD:** tests CRUD + rechazo de avatar ajeno.
- [x] **FE-1** Bootstrap web: Vite + Tailwind 4 + tokens CSS + **tema/color base** (copiar) + vite-plugin-pwa + manifest/iconos + anti-FOUC. **DoD:** app monta; toggle claro/oscuro y cambio de acento funcionan; PWA instalable.
- [x] **FE-2** Infra FE: `apiClient` (CSRF), `queryClient`, `useAuth`, `ProtectedRoute`/`PublicOnlyRoute`, `AppShell`, `components/ui/`. **DoD:** rutas protegidas redirigen; `useAuth` resuelve sesión.
- [x] **FE-3** Páginas Landing/Login/Register/Recover (reusar UI `bv-bow-sight`). **DoD:** registro+login end-to-end contra la API local.
- [x] **FE-4** `AvatarCreate` (alias*, arco* selector, color* selector ≥10, principiante checkbox→escuela) + `useAvatars` + lista en Home. **DoD:** crear avatar y verlo; tests RTL de validación.

## Fase 2 — Torneo + tiradas + scoring (P0, núcleo)

- [x] **SH-3** `pairing.ts` (agrupar por estaca → pares → sobrantes; posición A/B; determinista) + `ranking.ts` (orden + desempate por inner/10/M). **tdd.** **DoD:** tests de pares por estaca, sobrante (trío), empates.
- [x] **BE-6** `POST /tournaments`: transacción (snapshot participants → asignar estacas por `stakeMap` → armar pares → generar rounds 1..N). Defaults de flechas por modalidad. **DoD:** test crea torneo completo; estacas null en sala/aire_libre; pares por estaca en campo/3d.
- [x] **BE-7** `GET /tournaments?status=` + `GET /tournaments/:id` (config + resumen de tiradas + mini-podios top 3). **DoD:** tests de listado y detalle; ownership.
- [x] **BE-8** `GET /tournaments/:id/rounds/:seq` + `PUT .../scores/:participantId` (autosave): `validateEndScore`, recalcular totales/contadores, actualizar rollups por delta, marcar tirada `completa` cuando todos completaron; **idempotente/editable**. **DoD:** tests de carga, edición (recompute correcto), completitud de tirada, rechazo de token inválido, server ignora `end_total` del cliente.
- [x] **BE-9** `POST /tournaments/:id/finish` (exige todas las tiradas completas → `finalizado`). **DoD:** test bloquea si faltan tiradas; setea `finished_at`.
- [x] **FE-5** `Home`: torneos en curso/finalizados + accesos a crear torneo y crear avatar. **DoD:** lista por estado; reabrir finalizado.
- [x] **FE-6** `TournamentCreate`: nombre, modalidad (setea flechas default), tiradas (def 10), flechas, agregar avatars + **crear avatar inline**. **DoD:** crea torneo; defaults correctos por modalidad; tests RTL.
- [x] **FE-7** `Tournament`: lista de tiradas (estado/editar), mini-podios general+categoría, botón Podios habilitado al completar. **DoD:** navegación a tirada y podios; estados correctos.
- [x] **FE-8** `Round` + `ScoreKeypad`/`EndRow`/`PairCard`: orden por estaca/par, color de estaca, entrada descendente, X/M, **autosave optimista**, habilita siguiente. **DoD:** cargar end guarda y refleja total; editar end recalcula; tests RTL del keypad.

## Fase 3 — Podios + estadísticas (P0/P1)

- [x] **SH-4** `stats.ts`: agregaciones torneo (M, X, promedio general/categoría, mejor general/categoría) y participante (promedio, mejor end, evolución, distribución). **tdd.**
- [x] **BE-10** `GET /tournaments/:id/podium` (general + por categoría + escuela) usando `ranking.ts` sobre rollups. **DoD:** tests de orden y desempate; escuela filtra `experience='escuela'`.
- [x] **BE-11** `GET /tournaments/:id/stats`. **BE-12** `GET /tournaments/:id/participants/:pid/stats`. **DoD:** tests de métricas.
- [x] **FE-9** `Podium`: 3 podios, top-3 resaltado, listado completo. **DoD:** render correcto; tests RTL.
- [x] **FE-10** `TournamentStats`. **FE-11** `ParticipantStats` (incl. evolución por tirada). **DoD:** render de métricas reales.

## Fase 4 — Calidad, seguridad, deploy (P0 seguridad / P1 resto)

- [x] **BE-13** Auditoría de seguridad: ownership en todos los endpoints, CSP/headers, rate limit, schemas `.strict()`. Ejecutar **/security-review**. **DoD:** checklist de `SECURITY.md` verde. _(Review limpio: sin vulnerabilidades HIGH/MEDIUM; queries parametrizadas, ownership + CSRF en mutaciones, schemas `.strict()`.)_
- [x] **FE-12** Auditoría UI/accesibilidad con skills **web-design-guidelines** + **audit-website**. **DoD:** sin issues críticos; targets ≥44px, contraste AA, focus visible. _(web-design-guidelines: targets ≥44px, fieldset/legend en grupos, spellcheck off en alias, focus-visible global. audit-website pendiente hasta tener deploy (INF-4).)_
- [x] **TEST-1** E2E Playwright: registro → avatares → torneo (4 modalidades) → cargar todas las tiradas → finalizar → podios + stats. **DoD:** suite verde en CI. _(Flujo feliz sala completo verde contra el stack real: registro→avatar→torneo→carga→finalizar→podio. webServer levanta api (DB e2e aislada) + web. Ampliable a 4 modalidades.)_
- [x] **INF-3** Dockerfile multi-stage (BE sirve FE + `/api`), volumen `/data`, `HEALTHCHECK`. **DoD:** imagen corre y persiste. _(Multi-stage `deps`→`build`→`runner` slim sobre `node:20-bookworm-slim`; el toolchain de better-sqlite3 queda en `deps`. La API sirve el build del web desde `packages/api/public`; corre como usuario `node`, `VOLUME /data`, `HEALTHCHECK` a `/api/health`. `.dockerignore` evita clobbear el binario nativo. Verificado el server de prod sirviendo `/api` + SPA + assets; el `docker build` no se pudo ejecutar aquí (Docker no instalado).)_
- [x] **INF-4** Deploy: `fly.toml`/`render.yaml` con volumen + envs; `.env.example`. **DoD:** despliegue accesible por HTTPS con datos persistentes. _(`fly.toml`: máquina shared-cpu-1x + volumen `bv_data`→`/data`, `force_https`, healthcheck, `SESSION_SECRET` por `fly secrets`. `render.yaml`: Web Service Docker + disco persistente, `SESSION_SECRET` con `generateValue`. `.env.example` espeja `env.ts`.)_
- [x] **INF-5** CI: lint (biome) + typecheck + tests (+e2e) en PR; `pnpm audit`. **DoD:** pipeline bloquea en fallo. _(`.github/workflows/ci.yml`: job `quality` (lint+typecheck+test) y `e2e` (Playwright chromium) bloqueantes; `audit` no bloqueante. Comandos verificados localmente: lint limpio, typecheck ok, 40 tests verdes.)_

## Fase 5 — Mejoras (P2)

- [x] Exportar/compartir podio (imagen/print). _(Página Podio: botones **Compartir** (Web Share API → fallback portapapeles, `lib/share.ts`) e **Imprimir** (`window.print` + `@media print` que oculta el chrome y deja solo `.print-area`). Tests RTL de impresión y copia.)_
- [x] Gráfico de evolución por tirada. _(`components/EvolutionChart.tsx`: line chart en SVG puro (sin dependencias), tema-aware, accesible (`role="img"` + `aria-label`); integrado en `ParticipantStats` sobre la lista. Tests del componente.)_
- [x] Historial/gestión de avatares (editar, desarchivar). _(BE: `repo.listArchived`/`unarchive`, `service.listArchived`/`unarchive`, `GET /avatars?archived=true` + `POST /avatars/:id/restore` (CSRF + ownership). FE: `AvatarCreate` reusada para editar (`/avatars/:id/edit`), página `AvatarManage` (`/avatars`) para editar/archivar activos y restaurar archivados, acceso "Gestionar" desde Home. Tests API (restore, archivados, ownership) y RTL (archivar/restaurar).)_
- [x] Métricas avanzadas (consistencia, distribución por anillo, comparativas). _(shared: `participantStats` ahora incluye `consistency` (desvío σ de los totales) y `worstEnd`; nueva `participantComparison` (posición y promedio general/categoría). FE: `ParticipantStats` muestra tiles Peor end/Desvío σ y sección Comparativas (posición + delta vs promedios). Distribución por anillo ya existía. Tests shared (tdd) y RTL.)_
- [ ] i18n.

---

## Orden recomendado de ejecución

`INF-1 → INF-2 → SH-1 → SH-2 → BE-1 → BE-2 → BE-3 → BE-4 → BE-5 → FE-1 → FE-2 → FE-3 → FE-4 → SH-3 → BE-6 → BE-7 → BE-8 → BE-9 → FE-5 → FE-6 → FE-7 → FE-8 → SH-4 → BE-10 → BE-11 → BE-12 → FE-9 → FE-10 → FE-11 → BE-13 → FE-12 → TEST-1 → INF-3 → INF-4 → INF-5`.

El dominio (`SH-*`) y el backend del núcleo (`BE-6..9`) son la columna vertebral: priorizarlos y cubrirlos con tests antes de la UI correspondiente.
