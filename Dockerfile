# syntax=docker/dockerfile:1

# BV Archery Battle — contenedor único: la API (Hono) sirve /api y el build del frontend.
# Multi-stage: (1) deps con toolchain para better-sqlite3, (2) build del web, (3) runner slim.

# ── Base común ──
FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app

# ── Dependencias (incluye toolchain por si better-sqlite3 compila desde fuente) ──
FROM base AS deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
# Copiar solo manifests para cachear la instalación.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/api/package.json packages/api/
COPY packages/web/package.json packages/web/
RUN pnpm install --frozen-lockfile

# ── Build del frontend (genera packages/web/dist) ──
FROM deps AS build
COPY . .
RUN pnpm --filter @bv/web build

# ── Runner (slim, sin toolchain) ──
FROM base AS runner
ENV NODE_ENV=production \
    PORT=8787 \
    DATABASE_PATH=/data/app.db \
    WEB_DIST=public

# gosu para corregir permisos del volumen montado y luego bajar privilegios a node.
RUN apt-get update \
    && apt-get install -y --no-install-recommends gosu \
    && rm -rf /var/lib/apt/lists/*

# node_modules ya traen el binario nativo de better-sqlite3 compilado para esta base.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./

# El frontend se sirve estático desde packages/api/public (WEB_DIST relativo al cwd de la API).
RUN cp -r packages/web/dist packages/api/public \
    && mkdir -p /data \
    && chown -R node:node /data /app

# Entrypoint: asegura que /data (volumen montado, a veces root) sea escribible
# por node y arranca como node. printf para evitar problemas de CRLF en Windows.
RUN printf '#!/bin/sh\nset -e\nmkdir -p /data\nchown -R node:node /data || true\nexec gosu node "$@"\n' \
    > /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /app/packages/api
VOLUME /data
EXPOSE 8787

# Healthcheck a /api/health (fetch global de Node 20).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["pnpm", "start"]
