import { scoreSaveSchema } from '@bv/shared';
import { Hono } from 'hono';
import { requireCsrf } from '../middleware/auth';
import { parseBody, parseId } from '../middleware/validate';
import type { ScoreService } from '../services/scoreService';
import type { AppEnv } from '../types';

/** Rutas de tiradas/puntajes, montadas bajo `/tournaments`. */
export function scoreRoutes(service: ScoreService) {
  const r = new Hono<AppEnv>();

  r.get('/:id/rounds/:seq', (c) => {
    const id = parseId(c.req.param('id'));
    const seq = parseId(c.req.param('seq'));
    return c.json(service.getRound(c.get('userId'), id, seq));
  });

  r.put('/:id/rounds/:seq/scores/:participantId', requireCsrf, async (c) => {
    const id = parseId(c.req.param('id'));
    const seq = parseId(c.req.param('seq'));
    const participantId = parseId(c.req.param('participantId'));
    const data = await parseBody(c, scoreSaveSchema);
    return c.json(service.saveScore(c.get('userId'), id, seq, participantId, data));
  });

  return r;
}
