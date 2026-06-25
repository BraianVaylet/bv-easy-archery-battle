# Arquitectura — BV Archery Battle

## 1. Principios

- **Simple pero sólida**, monolítica desplegable como **un solo contenedor**, pero modular para **separar FE/BE en repos distintos** a futuro sin reescribir.
- **Dominio puro y compartido** (`@bv/shared`) como única fuente de verdad de las reglas WA, usado por FE y BE → sin duplicar lógica.
- **Performance y seguridad no negociables** (ver `TECHNICAL.md` y `SECURITY.md`).

## 2. Por qué este diseño

Espeja **`bv-bow-sight`** (mismo autor): ya resuelve auth (sesión httpOnly + CSRF), tema/color base, PWA y usa **Hono + better-sqlite3** (cumple el requisito de SQLite) sobre **pnpm monorepo** con paquete `shared`. La lógica de scoring WA se **porta desde `bv-archery`**. Resultado: máxima reutilización, menor riesgo, despliegue barato.

## 3. Topología

```
┌──────────────────────────────────────────────┐
│  Contenedor único (Node)                      │
│                                                │
│   Hono server (@bv/api)                        │
│    ├─ /api/*   → JSON (auth, dominio)          │
│    └─ /*       → assets estáticos del FE build │
│                                                │
│   better-sqlite3  ──►  /data/app.db (volumen)  │
└──────────────────────────────────────────────┘
        ▲ navegador (PWA instalable, @bv/web)
```

- El backend **sirve el FE** (SPA) y la API bajo `/api`. Un solo origen → sin CORS, cookies simples.
- SQLite en archivo sobre **volumen persistente** (modo WAL).

## 4. Monorepo (pnpm workspaces)

```
bv-archery-battle/
├─ package.json            # scripts root (dev/build/test/lint)
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
├─ biome.json              # lint + format
├─ Dockerfile              # multi-stage
├─ fly.toml | render.yaml  # deploy (según proveedor)
├─ .env.example
└─ packages/
   ├─ shared/   @bv/shared   # dominio puro (sin I/O)
   ├─ api/      @bv/api      # Hono + better-sqlite3
   └─ web/      @bv/web      # React + Vite + Tailwind + TanStack Query + PWA
```

### `@bv/shared` (dominio)
```
src/
  constants.ts   # modalidades, categorías, colores, sets de scoring, defaults, mapeo de estacas
  domain.ts      # tipos y catálogos de dominio
  scoring.ts     # tokenValue, validateEndScore, maxEndScore
  ranking.ts     # orden + desempate
  pairing.ts     # estacas + pares + posición A/B
  stats.ts       # agregaciones (torneo / participante)
  schemas/*.ts   # Zod .strict() de inputs (auth, avatar, tournament, score)
  types.ts       # tipos de API/DTOs
```

### `@bv/api` (backend, capas)
```
routes  (HTTP + validación Zod)   →   services (negocio, transacciones)   →   repositories (SQL parametrizado)
                                  ↘   middleware (auth, csrf, validate, error, security, rateLimit)
                                  ↘   lib (crypto, session, csrf, tokens, errors, db)
                                  ↘   db (connection WAL, migrations/, seed, reset)
```
Repositorios: `userRepo, avatarRepo, tournamentRepo, participantRepo, roundRepo, scoreRepo`.
Servicios: `authService, avatarService, tournamentService, scoringService, podiumService, statsService`.
Rutas: `auth, avatars, catalog, tournaments, rounds, scores, stats, health`.

### `@bv/web` (frontend)
```
src/
  main.tsx App.tsx theme.tsx
  lib/        apiClient (CSRF), queryClient, pwaInstall, cn, errorMessage
  hooks/      useAuth, useCatalog, useAvatars, useTournament, useRound, useScoreMutation
  components/ ui/, AppShell, ProtectedRoute, ScoreKeypad, EndRow, PairCard, PodiumCard, StatTile, ThemeMenu, InstallButton, Icons, Logo
  pages/      Landing, Login, Register, Recover, Home, AvatarCreate, TournamentCreate, Tournament, Round, Podium, TournamentStats, ParticipantStats
  styles/index.css
public/  theme-init.js, manifest icons, favicon
```

## 5. Modelo de datos

Ver esquema completo y DDL en [`TECHNICAL.md`](TECHNICAL.md) §Modelo de datos. Resumen de entidades:

```
users ─< sessions
users ─< avatars
users ─< tournaments
tournaments ─< tournament_participants >─ avatars   (snapshot del avatar)
tournaments ─< rounds
rounds ─< round_scores >─ tournament_participants
catálogos (seed): bow_categories, modalities, colors
```

Decisiones clave:
- **Snapshot** del avatar en `tournament_participants` → el histórico no cambia si luego se edita/borra el avatar.
- **Rollups denormalizados** en `tournament_participants` (`total_score`, `total_x`, `total_inner`, `total_tens`, `total_m`, `ends_completed`) → podios/estadísticas O(participantes) sin recomputar ends. Se actualizan en la misma transacción del autosave.

## 6. Flujos críticos

### Crear torneo (transacción)
```
POST /api/tournaments
  → snapshot de cada avatar en tournament_participants
  → asignar estaca por categoría (stake_map; null en sala/aire libre)
  → armar pares por estaca (pairing.ts) + posición A/B
  → generar rounds 1..N
  (todo atómico)
```

### Autosave de puntaje
```
PUT /api/tournaments/:id/rounds/:seq/scores/:participantId
  → validateEndScore(modality, arrows)   (shared)
  → recalcular end_total / x_count / inner_count / m_count
  → upsert round_score (idempotente; permite edición)
  → actualizar rollups del participante (delta)
  → si todos los participantes completaron el end → round.status = 'completa'
  (transacción)
```

### Cierre y resultados
```
POST /api/tournaments/:id/finish   (exige todas las tiradas completas)
GET  /api/tournaments/:id/podium   (general + por categoría + escuela; ranking.ts)
GET  /api/tournaments/:id/stats    (stats.ts sobre rollups)
```

## 7. Estado y caché (FE)

- **TanStack Query** como capa de estado del servidor (cache, `staleTime`, invalidación puntual).
- **Optimistic updates** en el autosave de scores → percepción instantánea.
- Estado local mínimo (tema, color base) en `localStorage`.
- **Solo online** (decisión): sin IndexedDB ni cola de sync; la PWA cachea assets y respuestas GET (`NetworkFirst`).

## 8. Reutilización (rutas de referencia)

| Qué | Origen |
|---|---|
| Auth + sesión + CSRF (FE+BE) | `bv-bow-sight/packages/{api,web}/src/...` (auth, session, csrf, useAuth, apiClient, páginas Login/Register/Recover) |
| Tema + color base + anti-FOUC | `bv-cross/client/src/lib/theme.tsx` + `public/theme-init.js` + `index.css`, o `bv-bow-sight/.../theme.tsx` |
| PWA (VitePWA) | `vite.config.ts` de cualquiera de los dos |
| UI base | `bv-bow-sight/.../components/ui/index.tsx`, `bv-cross/.../components/ui.tsx` |
| Monorepo / build / Docker | `bv-bow-sight/{pnpm-workspace.yaml, tsconfig.base.json, biome.json, Dockerfile}` |
| Scoring WA | `bv-archery/packages/shared/src/{scoring.ts, domain.ts, schemas.ts}` (adaptar a categorías + torneo) |

## 9. Camino a separar FE/BE en repos

1. `@bv/shared` se publica como paquete versionado (registry privado o git).
2. `@bv/api` y `@bv/web` lo consumen como dependencia externa.
3. Cada uno se mueve a su repo; el FE pasa a apuntar a la URL del BE (variable de entorno) y se habilita CORS en el BE. Sin cambios de lógica.
