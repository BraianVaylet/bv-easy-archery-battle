import { Hono } from 'hono';
import type { CatalogRepo } from '../repositories/catalogRepo';
import type { AppEnv } from '../types';

export function catalogRoutes(catalog: CatalogRepo) {
  const r = new Hono<AppEnv>();
  r.get('/', (c) => c.json(catalog.get()));
  return r;
}
