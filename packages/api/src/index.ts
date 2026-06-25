import { serve } from '@hono/node-server';
import { createApp } from './app';
import { getDb } from './db/connection';
import { env } from './env';
import { sweepExpiredSessions } from './lib/session';

const db = getDb();
sweepExpiredSessions(db);

const app = createApp(db);

// El servido de la SPA en producción (mountStatic) se agrega en INF-3.

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`🎯 BV Archery Battle API en http://localhost:${info.port} (${env.NODE_ENV})`);
});
