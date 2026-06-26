# BV Archery Battle

App web (PWA) para **organizar y gestionar torneos amistosos de arquería**. Mobile-first, pensada para pocos usuarios y para ser **rápida y ágil durante el torneo**. Soporta las 4 modalidades de World Archery (WA) — sala, aire libre, juegos de campo, 3D — y todas las categorías de arco, con carga de puntajes en formato WA, podios y estadísticas.

Incluye autenticación (sesión + CSRF), avatares reutilizables, creación de torneos con
emparejado por estaca, carga de tiradas con autosave, podios (general/categoría/escuela),
estadísticas por torneo y participante, exportar/compartir el podio y gestión de avatares.

> Estado: aplicación funcional. El backlog vive en [`docs/ACTION_PLAN.md`](docs/ACTION_PLAN.md)
> (Fases 0–4 completas; quedan pendientes el deploy real y la i18n).

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/FUNCTIONAL.md`](docs/FUNCTIONAL.md) | Requerimientos funcionales, páginas, flujos, reglas de negocio. |
| [`docs/DOMAIN_WA.md`](docs/DOMAIN_WA.md) | Reglamento WA aplicado: scoring por modalidad, estacas, desempate. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Monorepo, capas, modelo de datos, decisiones de diseño. |
| [`docs/TECHNICAL.md`](docs/TECHNICAL.md) | Stack, API, esquema SQLite, performance, convenciones. |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Controles de seguridad y checklist. |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Tokens, tema claro/oscuro, color base, componentes, colores de avatar. |
| [`docs/CONFIG.md`](docs/CONFIG.md) | Variables de entorno, scripts, setup local, build y deploy. |
| [`docs/ACTION_PLAN.md`](docs/ACTION_PLAN.md) | Tareas FE/BE priorizadas (checklist ejecutable). |

## Stack (resumen)

- **Monorepo:** pnpm workspaces (`packages/shared`, `packages/api`, `packages/web`).
- **Frontend:** React 18 + Vite 6 + TypeScript + Tailwind CSS 4 + TanStack Query + vite-plugin-pwa.
- **Backend:** Node + Hono + better-sqlite3 (SQLite).
- **Dominio compartido:** `@bv/shared` (scoring WA, ranking, pairing, stats, schemas Zod).
- **Auth:** sesión httpOnly + CSRF (reutilizado de `bv-bow-sight`).
- **Deploy:** contenedor único Docker + volumen persistente (Fly.io / Render / Railway).

## Quickstart

```bash
pnpm install
cp .env.example .env
pnpm --filter @bv/api db:migrate && pnpm --filter @bv/api db:seed
pnpm dev          # api en :8787 + web en :5173 (proxy /api → :8787)
```

Otros scripts (root):

```bash
pnpm test         # shared + api + web (Vitest)
pnpm test:e2e     # flujo completo (Playwright)
pnpm typecheck    # tsc -r
pnpm lint         # biome check
pnpm build        # build de producción (shared → web → api)
```

## Docker y deploy

La API sirve el build del frontend y `/api` en un **contenedor único** con un volumen
para SQLite (ver [`docs/CONFIG.md`](docs/CONFIG.md)).

```bash
docker build -t bv-archery-battle .
docker run -p 8787:8787 -v bv_data:/data \
  -e DATABASE_PATH=/data/app.db -e NODE_ENV=production -e COOKIE_SECURE=true \
  -e SESSION_SECRET="$(openssl rand -hex 32)" bv-archery-battle
```

Deploy de bajo costo con volumen persistente: [`fly.toml`](fly.toml) (Fly.io) o
[`render.yaml`](render.yaml) (Render). CI en [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Origen y reutilización

Este proyecto **espeja la arquitectura de `bv-bow-sight`** (mismo ecosistema del autor) y **porta la lógica de scoring WA de `bv-archery`**. Ver `docs/ARCHITECTURE.md` §Reutilización.

## Licencia

Privado / uso personal del autor.
