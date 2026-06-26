import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { DB } from './db/connection';
import { env, isProd } from './env';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/error';
import { rateLimit } from './middleware/rateLimit';
import { bodyLimit, securityHeaders } from './middleware/security';
import { authRoutes } from './routes/auth';
import { avatarRoutes } from './routes/avatars';
import { catalogRoutes } from './routes/catalog';
import { healthRoutes } from './routes/health';
import { scoreRoutes } from './routes/scores';
import { tournamentRoutes } from './routes/tournaments';
import { createServices } from './services';
import type { AppEnv } from './types';

/** Construye la app Hono. Recibe la DB para permitir inyección en tests. */
export function createApp(db: DB) {
  const services = createServices(db);
  const app = new Hono<AppEnv>();

  app.onError(errorHandler);

  // DB disponible en el contexto de todas las rutas
  app.use('*', async (c, next) => {
    c.set('db', db);
    await next();
  });

  // Seguridad global
  app.use('*', securityHeaders);
  app.use('*', bodyLimit());
  app.use('*', rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, max: env.RATE_LIMIT_MAX }));

  // CORS solo en dev (en prod el front se sirve del mismo origen)
  if (!isProd) {
    app.use('/api/*', cors({ origin: env.CORS_ORIGIN, credentials: true }));
  }

  // ── API ──
  const api = new Hono<AppEnv>();

  // Rate limit más estricto para auth (anti fuerza bruta)
  api.use(
    '/auth/*',
    rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, max: env.AUTH_RATE_LIMIT_MAX, prefix: 'auth' }),
  );
  api.route('/auth', authRoutes(db, services));
  api.route('/health', healthRoutes);
  api.route('/catalog', catalogRoutes(services.catalog));

  // ── API protegida (requiere sesión) ──
  const protectedApi = new Hono<AppEnv>();
  protectedApi.use('*', requireAuth(db));
  protectedApi.route('/avatars', avatarRoutes(services.avatar));
  protectedApi.route('/tournaments', tournamentRoutes(services.tournament));
  protectedApi.route('/tournaments', scoreRoutes(services.score));
  // podios y stats se montan en BE-9+.
  api.route('/', protectedApi);

  app.route('/api', api);

  return app;
}
