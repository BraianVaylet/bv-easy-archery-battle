# Configuración y despliegue — BV Archery Battle

## 1. Requisitos

- Node ≥ 20, **pnpm** ≥ 9.
- Compilador C (better-sqlite3 trae binarios precompilados; en algunos entornos requiere build tools).

## 2. Variables de entorno

`.env` (no commitear) — ver `.env.example`.

| Variable | Ámbito | Default | Descripción |
|---|---|---|---|
| `NODE_ENV` | api | `development` | `production` en deploy. |
| `PORT` | api | `8787` | Puerto del servidor (sirve API + FE). |
| `DATABASE_PATH` | api | `./data/app.db` | Ruta del archivo SQLite (montar en volumen en prod). |
| `SESSION_COOKIE_NAME` | api | `bv_session` | Nombre de la cookie de sesión. |
| `SESSION_TTL_DAYS` | api | `30` | Vigencia de la sesión. |
| `CSRF_COOKIE_NAME` | api | `bv_csrf` | Nombre de la cookie CSRF. |
| `COOKIE_SECURE` | api | `false` (dev) / `true` (prod) | Flag `Secure` de cookies. |
| `RATE_LIMIT_*` | api | — | Ventanas/límites de rate limiting. |
| `VITE_API_BASE` | web | `/api` | Base de la API (relativa en monolito; URL absoluta si se separan repos). |
| `__APP_VERSION__` | web (build) | de `package.json` | Inyectada por Vite. |

## 3. Scripts (root `package.json`)

```jsonc
{
  "scripts": {
    "dev": "pnpm -r --parallel dev",          // api + web
    "build": "pnpm -r build",                  // shared → api → web
    "test": "pnpm -r test",
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "pnpm -r typecheck"
  }
}
```

Por paquete:
- `@bv/api`: `dev` (tsx watch), `build`, `start`, `db:migrate`, `db:seed`, `db:reset`, `test`.
- `@bv/web`: `dev` (vite), `build`, `preview`, `test`, `test:e2e`.
- `@bv/shared`: `build` (tsc), `test`.

## 4. Setup local

```bash
pnpm install
cp .env.example .env
pnpm --filter @bv/api db:migrate
pnpm --filter @bv/api db:seed        # catálogos: categorías, modalidades, colores
pnpm dev                             # api en :8787, web en :5173 (proxy /api → :8787)
```

`vite.config.ts` del web debe proxyear `/api` al backend en dev.

## 5. Build de producción

```bash
pnpm build
# @bv/web genera dist/ estático; @bv/api lo sirve junto con /api
pnpm --filter @bv/api start
```

## 6. Docker (contenedor único)

Multi-stage (espejar `bv-bow-sight/Dockerfile`):

```dockerfile
# 1) builder: pnpm install + build de shared, api y web
# 2) runner: copia build de api + dist del web + node_modules de prod
#    - reutiliza el binario compilado de better-sqlite3
#    - EXPOSE ${PORT}; HEALTHCHECK a /api/health
#    - el server sirve dist/ del web y /api
# Volumen para DATABASE_PATH (ej. /data/app.db)
```

```bash
docker build -t bv-archery-battle .
docker run -p 8787:8787 -v bv_data:/data -e DATABASE_PATH=/data/app.db \
  -e NODE_ENV=production -e COOKIE_SECURE=true bv-archery-battle
```

## 7. Despliegue (bajo costo)

Objetivo: **un contenedor + volumen persistente** (SQLite necesita disco; serverless puro no sirve).

### Fly.io (`fly.toml`)
- 1 máquina shared-cpu pequeña + **volumen** montado en `/data`.
- `DATABASE_PATH=/data/app.db`, `COOKIE_SECURE=true`, HTTPS gestionado por Fly.
- Escala a 0/1 según costo; verificar persistencia del volumen.

### Render (`render.yaml`)
- Web Service (Docker) + **Persistent Disk** montado en `/data`.
- Variables de entorno equivalentes.

### Railway (`railway.json`)

Despliega el `Dockerfile` tal cual. Pasos:

1. **Crear proyecto** → *New Project* → *Deploy from GitHub repo* (o `railway up` con la CLI). Railway detecta `railway.json` y construye con el `Dockerfile`.
2. **Volumen** (persistencia de SQLite): en el servicio → *Variables/Settings* → *Volumes* → *New Volume*, mount path **`/data`**. Sin esto, los datos se pierden en cada deploy.
3. **Variables** (Settings → Variables):
   - `NODE_ENV=production`
   - `DATABASE_PATH=/data/app.db`
   - `COOKIE_SECURE=true`
   - `SESSION_SECRET=<openssl rand -hex 32>` (obligatorio, ≥16 chars)
   - `WEB_DIST=public` (opcional; ya es el default)
   - **No** setees `PORT`: Railway lo inyecta y la API escucha en `process.env.PORT`.
4. **Dominio**: Settings → Networking → *Generate Domain* (HTTPS gestionado por Railway). El healthcheck (`/api/health`) y el dominio quedan listos.

> El `Dockerfile` corre como usuario `node` pero el entrypoint hace `chown` de `/data` al arrancar, así el volumen (montado como root) queda escribible. Mismo binario sirve `/api` + frontend en el puerto de Railway.

> En cualquiera: HTTPS obligatorio, `COOKIE_SECURE=true`, HSTS, healthcheck a `/api/health`, backup periódico del archivo SQLite (copiar el `.db` del volumen).

## 8. CI

- En PR: `pnpm install --frozen-lockfile` → `biome check` → `typecheck` → `test` → (opcional) `test:e2e`.
- Bloquear merge si falla lint, typecheck o tests.
- `pnpm audit` para dependencias.

## 9. Backups

- SQLite: copia del archivo del volumen (o `VACUUM INTO`) de forma periódica. Dataset pequeño → backups baratos.
