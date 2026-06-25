import { avatarCreateSchema, avatarUpdateSchema } from '@bv/shared';
import { Hono } from 'hono';
import { requireCsrf } from '../middleware/auth';
import { parseBody, parseId } from '../middleware/validate';
import type { AvatarService } from '../services/avatarService';
import type { AppEnv } from '../types';

export function avatarRoutes(service: AvatarService) {
  const r = new Hono<AppEnv>();

  r.get('/', (c) => c.json(service.list(c.get('userId'))));

  r.post('/', requireCsrf, async (c) => {
    const data = await parseBody(c, avatarCreateSchema);
    return c.json(service.create(c.get('userId'), data), 201);
  });

  r.get('/:id', (c) => {
    const id = parseId(c.req.param('id'));
    return c.json(service.get(c.get('userId'), id));
  });

  r.patch('/:id', requireCsrf, async (c) => {
    const id = parseId(c.req.param('id'));
    const patch = await parseBody(c, avatarUpdateSchema);
    return c.json(service.update(c.get('userId'), id, patch));
  });

  r.delete('/:id', requireCsrf, (c) => {
    const id = parseId(c.req.param('id'));
    service.archive(c.get('userId'), id);
    return c.body(null, 204);
  });

  return r;
}
