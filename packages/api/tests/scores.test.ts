import type {
  Avatar,
  RoundView,
  ScoreSaveResult,
  TournamentDetail,
  TournamentDetailView,
  TournamentParticipant,
} from '@bv/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createDb } from '../src/db/connection';
import { type App, type Jar, cookieHeader, jsonReq, registerUser } from './helpers';

async function makeAvatar(app: App, jar: Jar, alias: string, bowCategory: string): Promise<number> {
  const res = await jsonReq(
    app,
    '/api/avatars',
    'POST',
    { alias, bowCategory, color: 'blue' },
    jar,
  );
  return ((await res.json()) as Avatar).id;
}

describe('scores — carga y autosave (BE-8)', () => {
  let app: App;
  let jar: Jar;
  let tournamentId: number;
  let p0: number;
  let p1: number;

  beforeEach(async () => {
    app = createApp(createDb(':memory:'));
    jar = await registerUser(app);
    const a = await makeAvatar(app, jar, 'Ana', 'recurvo_olimpico');
    const b = await makeAvatar(app, jar, 'Beto', 'compuesto');
    const res = await jsonReq(
      app,
      '/api/tournaments',
      'POST',
      { name: 'T', modality: 'sala', roundsCount: 2, arrowsPerEnd: 3, avatarIds: [a, b] },
      jar,
    );
    const t = (await res.json()) as TournamentDetail;
    const [first, second] = t.participants;
    if (!first || !second) throw new Error('setup: faltan participantes');
    tournamentId = t.id;
    p0 = first.id;
    p1 = second.id;
  });

  function putScore(seq: number, participantId: number, arrows: unknown): Promise<Response> {
    return jsonReq(
      app,
      `/api/tournaments/${tournamentId}/rounds/${seq}/scores/${participantId}`,
      'PUT',
      { arrows },
      jar,
    );
  }

  async function getRound(seq: number): Promise<RoundView> {
    const res = await app.request(`/api/tournaments/${tournamentId}/rounds/${seq}`, {
      headers: { cookie: cookieHeader(jar) },
    });
    return (await res.json()) as RoundView;
  }

  async function participant(id: number): Promise<TournamentParticipant> {
    const res = await app.request(`/api/tournaments/${tournamentId}`, {
      headers: { cookie: cookieHeader(jar) },
    });
    const detail = (await res.json()) as TournamentDetailView;
    const p = detail.participants.find((x) => x.id === id);
    if (!p) throw new Error('participante no encontrado');
    return p;
  }

  it('GET tirada: lista participantes ordenados, sin scores al inicio', async () => {
    const r = await getRound(1);
    expect(r.seq).toBe(1);
    expect(r.status).toBe('pendiente');
    expect(r.entries).toHaveLength(2);
    expect(r.entries.every((e) => e.score === null)).toBe(true);
  });

  it('carga un end: el servidor deriva total y contadores', async () => {
    const res = await putScore(1, p0, ['X', '9', '7']);
    expect(res.status).toBe(200);
    const out = (await res.json()) as ScoreSaveResult;
    expect(out.score.endTotal).toBe(26);
    expect(out.score.xCount).toBe(1);
    expect(out.score.innerCount).toBe(1);
    expect(out.score.mCount).toBe(0);
    // Solo 1 de 2 cargados → tirada sigue pendiente.
    expect(out.round.status).toBe('pendiente');
  });

  it('marca la tirada completa cuando todos cargaron', async () => {
    await putScore(1, p0, ['X', '9', '7']);
    const second = await putScore(1, p1, ['10', '10', '8']);
    expect(((await second.json()) as ScoreSaveResult).round.status).toBe('completa');
    const r = await getRound(1);
    expect(r.status).toBe('completa');
    expect(r.entries.every((e) => e.score !== null)).toBe(true);
  });

  it('actualiza los rollups del participante (sin doble conteo al editar)', async () => {
    await putScore(1, p0, ['X', '9', '7']); // 26
    let p = await participant(p0);
    expect(p.totalScore).toBe(26);
    expect(p.endsCompleted).toBe(1);

    // Editar el mismo end recalcula por delta, no suma de nuevo.
    await putScore(1, p0, ['M', 'M', 'M']); // 0
    p = await participant(p0);
    expect(p.totalScore).toBe(0);
    expect(p.totalM).toBe(3);
    expect(p.endsCompleted).toBe(1);
  });

  it('acumula varias tiradas en el rollup', async () => {
    await putScore(1, p0, ['X', '9', '7']); // 26
    await putScore(2, p0, ['10', '8', '6']); // 24
    const p = await participant(p0);
    expect(p.totalScore).toBe(50);
    expect(p.endsCompleted).toBe(2);
  });

  it('rechaza token inválido (400)', async () => {
    expect((await putScore(1, p0, ['Z', '9', '7'])).status).toBe(400);
  });

  it('rechaza cantidad de flechas incorrecta (400)', async () => {
    expect((await putScore(1, p0, ['X', '9'])).status).toBe(400);
  });

  it('ignora end_total del cliente: campo extra rechazado por schema estricto', async () => {
    const res = await jsonReq(
      app,
      `/api/tournaments/${tournamentId}/rounds/1/scores/${p0}`,
      'PUT',
      { arrows: ['X', '9', '7'], endTotal: 999 },
      jar,
    );
    expect(res.status).toBe(400);
  });

  it('rechaza PUT sin CSRF (403)', async () => {
    const res = await app.request(`/api/tournaments/${tournamentId}/rounds/1/scores/${p0}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie: `bv_session=${jar.bv_session}` },
      body: JSON.stringify({ arrows: ['X', '9', '7'] }),
    });
    expect(res.status).toBe(403);
  });

  it('respeta ownership: otro usuario no puede cargar (404)', async () => {
    const jar2 = await registerUser(app, 'otro');
    const res = await jsonReq(
      app,
      `/api/tournaments/${tournamentId}/rounds/1/scores/${p0}`,
      'PUT',
      { arrows: ['X', '9', '7'] },
      jar2,
    );
    expect(res.status).toBe(404);
  });

  it('404 si la tirada no existe', async () => {
    expect((await putScore(99, p0, ['X', '9', '7'])).status).toBe(404);
  });
});
