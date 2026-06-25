# BV Archery Battle

App web (PWA) para **organizar y gestionar torneos amistosos de arquería**. Mobile-first, pensada para pocos usuarios y para ser **rápida y ágil durante el torneo**. Soporta las 4 modalidades de World Archery (WA) — sala, aire libre, juegos de campo, 3D — y todas las categorías de arco, con carga de puntajes en formato WA, podios y estadísticas.

> Este repositorio contiene, por ahora, la **documentación funcional, técnica, de arquitectura y el plan de acción**. El código se desarrolla siguiendo `docs/ACTION_PLAN.md`.

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

## Quickstart (cuando exista el código)

```bash
pnpm install
pnpm --filter @bv/api db:migrate && pnpm --filter @bv/api db:seed
pnpm dev          # api + web en paralelo
pnpm test         # shared + api + web
pnpm build        # build de producción
```

## Origen y reutilización

Este proyecto **espeja la arquitectura de `bv-bow-sight`** (mismo ecosistema del autor) y **porta la lógica de scoring WA de `bv-archery`**. Ver `docs/ARCHITECTURE.md` §Reutilización.

## Licencia

Privado / uso personal del autor.
