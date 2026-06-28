import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types';

/**
 * Política de caché pensada para el CDN edge de Railway (cachea según Cache-Control).
 *
 * - API: `no-store`. Respuestas dinámicas y por-usuario (cookies de sesión). Nunca
 *   deben cachearse en el edge para evitar datos obsoletos o fugas entre usuarios.
 * - Assets con hash en el nombre (Vite los emite en /assets y el workbox-*.js): son
 *   inmutables, se cachean un año.
 * - Todo lo demás (index.html, rutas SPA, sw.js, registerSW.js, manifest, favicons):
 *   `no-cache` → se puede almacenar pero hay que revalidar, así un deploy nuevo o el
 *   shell de la PWA nunca quedan obsoletos.
 */

/** Marca las respuestas de la API como no cacheables por el CDN. */
export const apiNoStore: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.header('Cache-Control', 'no-store');
  await next();
};

/** ¿La ruta apunta a un asset con fingerprint (cacheable de forma inmutable)? */
function isImmutableAsset(path: string): boolean {
  return path.startsWith('/assets/') || /\/workbox-[\w-]+\.js$/.test(path);
}

/**
 * Cache-Control para el frontend estático servido en producción. Debe montarse antes
 * de serveStatic y del fallback SPA; fija la cabecera tras resolver la respuesta.
 */
export const staticCacheControl: MiddlewareHandler<AppEnv> = async (c, next) => {
  await next();
  const path = c.req.path;
  if (path.startsWith('/api/')) return; // la API gestiona su propia cabecera
  c.header(
    'Cache-Control',
    isImmutableAsset(path) ? 'public, max-age=31536000, immutable' : 'no-cache',
  );
};
