import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { createApp } from './app';
import { getDb } from './db/connection';
import { env, isProd } from './env';
import { staticCacheControl } from './middleware/cache';
import { sweepExpiredSessions } from './lib/session';

const db = getDb();
sweepExpiredSessions(db);

const app = createApp(db);

// En producción la API sirve el build del frontend (contenedor único).
// Los assets se sirven estáticos; el resto cae al index.html (SPA fallback).
if (isProd) {
  app.use('/*', staticCacheControl);
  app.use('/*', serveStatic({ root: env.WEB_DIST }));
  const indexHtml = readFileSync(join(process.cwd(), env.WEB_DIST, 'index.html'), 'utf-8');
  app.get('*', (c) => c.html(indexHtml));
}

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`🎯 BV Archery Battle API en http://localhost:${info.port} (${env.NODE_ENV})`);
});
