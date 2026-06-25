import type {
  Avatar,
  ParticipantStats,
  TournamentDetail,
  TournamentPodium,
  TournamentStats,
} from '@bv/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createDb } from '../src/db/connection';
import { type App, type Jar, cookieHeader, jsonReq, registerUser } from './helpers';

async function makeAvatar(
  app: App,
  jar: Jar,
  alias: string,
  bowCategory: string,
  beginner = false,
): Promise<number> {
  const res = await jsonReq(
    app,
    '/api/avatars',
    'POST',
    { alias, bowCategory, color: 'blue', beginner },
    jar,
  );
  return ((await res.json()) as Avatar).id;
}

describe('podium + stats (BE-10/11/12)', () => {
  let app: App;
  let jar: Jar;
  let tournamentId: number;
  const pid: Record<string, number> = {}; // avatarKey → participantId

  beforeEach(async () => {
    app = createApp(createDb(':memory:'));
    jar = await registerUser(app);
    const aA = await makeAvatar(app, jar, 'A', 'recurvo_olimpico');
    const aB = await makeAvatar(app, jar, 'B', 'compuesto');
    const aC = await makeAvatar(app, jar, 'C', 'compuesto', true); // escuela
    const res = await jsonReq(
      app,
      '/api/tournaments',
      'POST',
      { name: 'P', modality: 'sala', roundsCount: 1, arrowsPerEnd: 3, avatarIds: [aA, aB, aC] },
      jar,
    );
    const t = (await res.json()) as TournamentDetail;
    tournamentId = t.id;
    const byAvatar = new Map(t.participants.map((p) => [p.avatarId, p.id]));
    pid.A = byAvatar.get(aA) as number;
    pid.B = byAvatar.get(aB) as number;
    pid.C = byAvatar.get(aC) as number;

    // Cargar la tirada 1: A=30, B=27, C=24.
    await put(pid.A, ['10', '10', '10']);
    await put(pid.B, ['9', '9', '9']);
    await put(pid.C, ['8', '8', '8']);
  });

  function put(participantId: number, arrows: string[]): Promise<Response> {
    return jsonReq(
      app,
      `/api/tournaments/${tournamentId}/rounds/1/scores/${participantId}`,
      'PUT',
      { arrows },
      jar,
    );
  }

  async function get(path: string, j: Jar = jar): Promise<Response> {
    return app.request(path, { headers: { cookie: cookieHeader(j) } });
  }

  it('podium general ordena por puntaje y asigna puestos', async () => {
    const res = await get(`/api/tournaments/${tournamentId}/podium`);
    expect(res.status).toBe(200);
    const podium = (await res.json()) as TournamentPodium;
    expect(podium.general.map((e) => e.participant.id)).toEqual([pid.A, pid.B, pid.C]);
    expect(podium.general.map((e) => e.rank)).toEqual([1, 2, 3]);
  });

  it('podium por categoría y escuela', async () => {
    const podium = (await (
      await get(`/api/tournaments/${tournamentId}/podium`)
    ).json()) as TournamentPodium;

    const comp = podium.byCategory.find((c) => c.category === 'compuesto');
    expect(comp?.entries.map((e) => e.participant.id)).toEqual([pid.B, pid.C]);
    const recu = podium.byCategory.find((c) => c.category === 'recurvo_olimpico');
    expect(recu?.entries.map((e) => e.participant.id)).toEqual([pid.A]);

    // Escuela: solo el principiante (C).
    expect(podium.escuela.map((e) => e.participant.id)).toEqual([pid.C]);
  });

  it('stats del torneo: promedio general y por categoría, mejor', async () => {
    const s = (await (
      await get(`/api/tournaments/${tournamentId}/stats`)
    ).json()) as TournamentStats;
    expect(s.participants).toBe(3);
    expect(s.bestScore).toBe(30);
    expect(s.averageScore).toBeCloseTo((30 + 27 + 24) / 3, 5);
    const comp = s.byCategory.find((c) => c.category === 'compuesto');
    expect(comp?.averageScore).toBe(25.5);
    expect(comp?.bestScore).toBe(27);
  });

  it('stats de un participante: total, mejor end, evolución, distribución', async () => {
    const s = (await (
      await get(`/api/tournaments/${tournamentId}/participants/${pid.A}/stats`)
    ).json()) as ParticipantStats;
    expect(s.totalScore).toBe(30);
    expect(s.bestEnd).toBe(30);
    expect(s.endsCompleted).toBe(1);
    expect(s.evolution).toEqual([{ seq: 1, total: 30, cumulative: 30 }]);
    expect(s.distribution['10']).toBe(3);
  });

  it('respeta ownership en podium/stats (404)', async () => {
    const jar2 = await registerUser(app, 'otro');
    expect((await get(`/api/tournaments/${tournamentId}/podium`, jar2)).status).toBe(404);
    expect((await get(`/api/tournaments/${tournamentId}/stats`, jar2)).status).toBe(404);
    expect(
      (await get(`/api/tournaments/${tournamentId}/participants/${pid.A}/stats`, jar2)).status,
    ).toBe(404);
  });

  it('404 si el participante no existe', async () => {
    expect((await get(`/api/tournaments/${tournamentId}/participants/99999/stats`)).status).toBe(
      404,
    );
  });
});
