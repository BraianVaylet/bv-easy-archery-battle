import { TOURNAMENT_STATUSES, type TournamentStatus, tournamentCreateSchema } from '@bv/shared';
import { Hono } from 'hono';
import { validationError } from '../lib/errors';
import { requireCsrf } from '../middleware/auth';
import { parseBody, parseId } from '../middleware/validate';
import type { TournamentService } from '../services/tournamentService';
import type { AppEnv } from '../types';

/** Valida el query `status` (opcional); 400 si no es un estado conocido. */
function parseStatus(value: string | undefined): TournamentStatus | undefined {
  if (value === undefined) return undefined;
  if (!(TOURNAMENT_STATUSES as readonly string[]).includes(value)) {
    throw validationError('Estado inválido.');
  }
  return value as TournamentStatus;
}

export function tournamentRoutes(service: TournamentService) {
  const r = new Hono<AppEnv>();

  r.post('/', requireCsrf, async (c) => {
    const data = await parseBody(c, tournamentCreateSchema);
    return c.json(service.create(c.get('userId'), data), 201);
  });

  r.get('/', (c) => {
    const status = parseStatus(c.req.query('status'));
    return c.json(service.list(c.get('userId'), status));
  });

  r.get('/:id', (c) => {
    const id = parseId(c.req.param('id'));
    return c.json(service.getDetailView(c.get('userId'), id));
  });

  r.post('/:id/finish', requireCsrf, (c) => {
    const id = parseId(c.req.param('id'));
    return c.json(service.finish(c.get('userId'), id));
  });

  r.get('/:id/podium', (c) => {
    const id = parseId(c.req.param('id'));
    return c.json(service.getPodium(c.get('userId'), id));
  });

  r.get('/:id/stats', (c) => {
    const id = parseId(c.req.param('id'));
    return c.json(service.getStats(c.get('userId'), id));
  });

  r.get('/:id/participants/:pid/stats', (c) => {
    const id = parseId(c.req.param('id'));
    const pid = parseId(c.req.param('pid'));
    return c.json(service.getParticipantStats(c.get('userId'), id, pid));
  });

  return r;
}
