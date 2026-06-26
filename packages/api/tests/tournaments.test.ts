import type {
  Avatar,
  TournamentDetail,
  TournamentDetailView,
  TournamentListItem,
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
  color = 'blue',
): Promise<number> {
  const res = await jsonReq(app, '/api/avatars', 'POST', { alias, bowCategory, color }, jar);
  return ((await res.json()) as Avatar).id;
}

async function createTournament(
  app: App,
  jar: Jar,
  body: Record<string, unknown>,
): Promise<Response> {
  return jsonReq(app, '/api/tournaments', 'POST', body, jar);
}

describe('tournaments — creación (BE-6)', () => {
  let app: App;
  let jar: Jar;

  beforeEach(async () => {
    app = createApp(createDb(':memory:'));
    jar = await registerUser(app);
  });

  it('crea torneo completo de sala: participantes, tiradas y estacas null', async () => {
    const ids = [
      await makeAvatar(app, jar, 'Ana', 'recurvo_olimpico'),
      await makeAvatar(app, jar, 'Beto', 'compuesto'),
      await makeAvatar(app, jar, 'Caro', 'longbow'),
    ];

    const res = await createTournament(app, jar, {
      name: 'Torneo Sala',
      modality: 'sala',
      roundsCount: 10,
      arrowsPerEnd: 3,
      avatarIds: ids,
    });

    expect(res.status).toBe(201);
    const t = (await res.json()) as TournamentDetail;
    expect(t.participants).toHaveLength(3);
    expect(t.rounds).toHaveLength(10);
    expect(t.rounds.map((r) => r.seq)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(t.rounds.every((r) => r.status === 'pendiente')).toBe(true);
    // Sala: sin estacas, todos en el grupo único.
    expect(t.participants.every((p) => p.stake === null)).toBe(true);
    expect(t.stakeMap).toBeNull();
    // Snapshot del set de puntuación de diana.
    expect(t.scoringSet).toContain('X');
    // Rollups en cero al crear.
    expect(t.participants.every((p) => p.totalScore === 0 && p.endsCompleted === 0)).toBe(true);
  });

  it('campo: asigna estacas por categoría y arma pares dentro de la estaca', async () => {
    const roja1 = await makeAvatar(app, jar, 'R1', 'compuesto');
    const roja2 = await makeAvatar(app, jar, 'R2', 'recurvo_olimpico');
    const azul1 = await makeAvatar(app, jar, 'A1', 'raso');
    const azul2 = await makeAvatar(app, jar, 'A2', 'cazador');

    const res = await createTournament(app, jar, {
      name: 'Torneo Campo',
      modality: 'campo',
      roundsCount: 4,
      arrowsPerEnd: 3,
      avatarIds: [roja1, roja2, azul1, azul2],
    });

    expect(res.status).toBe(201);
    const t = (await res.json()) as TournamentDetail;

    const stakeByAvatar = new Map(t.participants.map((p) => [p.avatarId, p.stake]));
    expect(stakeByAvatar.get(roja1)).toBe('roja');
    expect(stakeByAvatar.get(roja2)).toBe('roja');
    expect(stakeByAvatar.get(azul1)).toBe('azul');
    expect(stakeByAvatar.get(azul2)).toBe('azul');

    // Cada par contiene una sola estaca.
    const pairs = new Map<number, Set<string | null>>();
    for (const p of t.participants) {
      if (!pairs.has(p.pairIndex)) pairs.set(p.pairIndex, new Set());
      pairs.get(p.pairIndex)?.add(p.stake);
    }
    for (const stakes of pairs.values()) {
      expect(stakes.size).toBe(1);
    }
    expect(t.stakeMap).not.toBeNull();
  });

  it('3d: guarda el set de puntuación 3D', async () => {
    const id = await makeAvatar(app, jar, 'Solo', 'recurvo_olimpico');
    const res = await createTournament(app, jar, {
      name: 'Torneo 3D',
      modality: '3d',
      roundsCount: 2,
      arrowsPerEnd: 2,
      avatarIds: [id],
    });
    expect(res.status).toBe(201);
    const t = (await res.json()) as TournamentDetail;
    expect(t.scoringSet).toEqual(['11', '10', '8', '5', 'M']);
  });

  it('respeta ownership: avatar de otro usuario → 404', async () => {
    const id = await makeAvatar(app, jar, 'Mio', 'compuesto');
    const jar2 = await registerUser(app, 'otro');
    const res = await createTournament(app, jar2, {
      name: 'Robado',
      modality: 'sala',
      roundsCount: 3,
      arrowsPerEnd: 3,
      avatarIds: [id],
    });
    expect(res.status).toBe(404);
  });

  it('rechaza mutación sin CSRF (403)', async () => {
    const res = await app.request('/api/tournaments', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: `bv_session=${jar.bv_session}` },
      body: JSON.stringify({
        name: 'X',
        modality: 'sala',
        roundsCount: 3,
        arrowsPerEnd: 3,
        avatarIds: [1],
      }),
    });
    expect(res.status).toBe(403);
  });

  it('rechaza sin participantes (400)', async () => {
    const res = await createTournament(app, jar, {
      name: 'Vacío',
      modality: 'sala',
      roundsCount: 3,
      arrowsPerEnd: 3,
      avatarIds: [],
    });
    expect(res.status).toBe(400);
  });
});

describe('tournaments — listado y detalle (BE-7)', () => {
  let app: App;
  let jar: Jar;

  beforeEach(async () => {
    app = createApp(createDb(':memory:'));
    jar = await registerUser(app);
  });

  async function seedTournament(): Promise<number> {
    const a = await makeAvatar(app, jar, 'Ana', 'recurvo_olimpico');
    const b = await makeAvatar(app, jar, 'Beto', 'compuesto');
    const res = await createTournament(app, jar, {
      name: 'T1',
      modality: 'sala',
      roundsCount: 5,
      arrowsPerEnd: 3,
      avatarIds: [a, b],
    });
    return ((await res.json()) as TournamentDetail).id;
  }

  async function get(path: string, j: Jar = jar): Promise<Response> {
    return app.request(path, { headers: { cookie: cookieHeader(j) } });
  }

  it('lista los torneos del usuario con contadores', async () => {
    await seedTournament();
    const res = await get('/api/tournaments');
    expect(res.status).toBe(200);
    const list = (await res.json()) as TournamentListItem[];
    expect(list).toHaveLength(1);
    expect(list[0]?.participantsCount).toBe(2);
    expect(list[0]?.roundsCompleted).toBe(0);
    expect(list[0]?.status).toBe('en_curso');
  });

  it('filtra por status', async () => {
    await seedTournament();
    expect(
      (await (await get('/api/tournaments?status=en_curso')).json()) as TournamentListItem[],
    ).toHaveLength(1);
    expect(
      (await (await get('/api/tournaments?status=finalizado')).json()) as TournamentListItem[],
    ).toHaveLength(0);
  });

  it('rechaza status inválido (400)', async () => {
    expect((await get('/api/tournaments?status=loquesea')).status).toBe(400);
  });

  it('detalle incluye participantes, tiradas y mini-podio', async () => {
    const id = await seedTournament();
    const res = await get(`/api/tournaments/${id}`);
    expect(res.status).toBe(200);
    const t = (await res.json()) as TournamentDetailView;
    expect(t.participants).toHaveLength(2);
    expect(t.rounds).toHaveLength(5);
    expect(t.miniPodium.length).toBeLessThanOrEqual(3);
    expect(t.miniPodium[0]?.rank).toBe(1);
    expect(t.miniPodium[0]?.participant).toBeDefined();
  });

  it('respeta ownership: detalle de otro usuario → 404', async () => {
    const id = await seedTournament();
    const jar2 = await registerUser(app, 'otro');
    expect((await get(`/api/tournaments/${id}`, jar2)).status).toBe(404);
  });

  it('detalle inexistente → 404', async () => {
    expect((await get('/api/tournaments/9999')).status).toBe(404);
  });
});

describe('tournaments — finalizar (BE-9)', () => {
  let app: App;
  let jar: Jar;

  beforeEach(async () => {
    app = createApp(createDb(':memory:'));
    jar = await registerUser(app);
  });

  /** Crea un torneo con 1 participante, `rounds` tiradas de 1 flecha. Devuelve {id, pid}. */
  async function newTournament(rounds: number): Promise<{ id: number; pid: number }> {
    const avatarId = await makeAvatar(app, jar, 'Solo', 'compuesto');
    const res = await createTournament(app, jar, {
      name: 'Fin',
      modality: 'sala',
      roundsCount: rounds,
      arrowsPerEnd: 1,
      avatarIds: [avatarId],
    });
    const t = (await res.json()) as TournamentDetail;
    const first = t.participants[0];
    if (!first) throw new Error('sin participante');
    return { id: t.id, pid: first.id };
  }

  function loadRound(id: number, seq: number, pid: number): Promise<Response> {
    return jsonReq(
      app,
      `/api/tournaments/${id}/rounds/${seq}/scores/${pid}`,
      'PUT',
      {
        arrows: ['X'],
      },
      jar,
    );
  }

  function finish(id: number, j: Jar = jar): Promise<Response> {
    return jsonReq(app, `/api/tournaments/${id}/finish`, 'POST', null, j);
  }

  it('finaliza cuando todas las tiradas están completas y setea finished_at', async () => {
    const { id, pid } = await newTournament(1);
    await loadRound(id, 1, pid);
    const res = await finish(id);
    expect(res.status).toBe(200);
    const t = (await res.json()) as TournamentDetail;
    expect(t.status).toBe('finalizado');
    expect(typeof t.finishedAt).toBe('number');
  });

  it('bloquea si faltan tiradas (409)', async () => {
    const { id } = await newTournament(2);
    expect((await finish(id)).status).toBe(409);
  });

  it('no se puede finalizar dos veces (409)', async () => {
    const { id, pid } = await newTournament(1);
    await loadRound(id, 1, pid);
    expect((await finish(id)).status).toBe(200);
    expect((await finish(id)).status).toBe(409);
  });

  it('finalizado bloquea nueva carga de puntaje (409)', async () => {
    const { id, pid } = await newTournament(1);
    await loadRound(id, 1, pid);
    await finish(id);
    expect((await loadRound(id, 1, pid)).status).toBe(409);
  });

  it('respeta ownership: otro usuario no finaliza (404)', async () => {
    const { id, pid } = await newTournament(1);
    await loadRound(id, 1, pid);
    const jar2 = await registerUser(app, 'otro');
    expect((await finish(id, jar2)).status).toBe(404);
  });
});

describe('tournaments — editar en curso (agregar participantes/tirada)', () => {
  let app: App;
  let jar: Jar;

  beforeEach(async () => {
    app = createApp(createDb(':memory:'));
    jar = await registerUser(app);
  });

  async function seed(): Promise<{ id: number; pid: number }> {
    const a = await makeAvatar(app, jar, 'Ana', 'compuesto');
    const res = await createTournament(app, jar, {
      name: 'Editable',
      modality: 'sala',
      roundsCount: 1,
      arrowsPerEnd: 1,
      avatarIds: [a],
    });
    const t = (await res.json()) as TournamentDetail;
    return { id: t.id, pid: t.participants[0]?.id ?? 0 };
  }

  const detail = async (id: number) =>
    (await (
      await app.request(`/api/tournaments/${id}`, { headers: { cookie: cookieHeader(jar) } })
    ).json()) as TournamentDetailView;

  it('PATCH actualiza el nombre del torneo en curso', async () => {
    const { id } = await seed();
    const res = await jsonReq(app, `/api/tournaments/${id}`, 'PATCH', { name: 'Nuevo' }, jar);
    expect(res.status).toBe(200);
    expect(((await res.json()) as TournamentDetailView).name).toBe('Nuevo');
  });

  it('POST /rounds agrega una tirada (seq incremental)', async () => {
    const { id } = await seed();
    const res = await jsonReq(app, `/api/tournaments/${id}/rounds`, 'POST', null, jar);
    expect(res.status).toBe(200);
    const t = (await res.json()) as TournamentDetailView;
    expect(t.rounds.map((r) => r.seq)).toEqual([1, 2]);
    expect(t.roundsCount).toBe(2);
  });

  async function seedRounds(rounds: number): Promise<{ id: number; pid: number }> {
    const a = await makeAvatar(app, jar, 'Ana', 'compuesto');
    const t = (await (
      await createTournament(app, jar, {
        name: 'Del',
        modality: 'sala',
        roundsCount: rounds,
        arrowsPerEnd: 1,
        avatarIds: [a],
      })
    ).json()) as TournamentDetail;
    return { id: t.id, pid: t.participants[0]?.id ?? 0 };
  }

  it('DELETE /rounds/:seq elimina y renumera, baja rounds_count', async () => {
    const { id } = await seedRounds(3);
    const res = await jsonReq(app, `/api/tournaments/${id}/rounds/2`, 'DELETE', null, jar);
    expect(res.status).toBe(200);
    const t = (await res.json()) as TournamentDetailView;
    expect(t.rounds.map((r) => r.seq)).toEqual([1, 2]); // 1 y 3 → renumeradas
    expect(t.roundsCount).toBe(2);
  });

  it('eliminar una tirada con puntajes descuenta los rollups', async () => {
    const { id, pid } = await seedRounds(2);
    await jsonReq(
      app,
      `/api/tournaments/${id}/rounds/1/scores/${pid}`,
      'PUT',
      { arrows: ['X'] },
      jar,
    );
    const before = (await detail(id)).participants.find((p) => p.id === pid);
    expect(before?.totalScore).toBeGreaterThan(0);

    const t = (await (
      await jsonReq(app, `/api/tournaments/${id}/rounds/1`, 'DELETE', null, jar)
    ).json()) as TournamentDetailView;
    const ana = t.participants.find((p) => p.id === pid);
    expect(ana?.totalScore).toBe(0);
    expect(ana?.endsCompleted).toBe(0);
    expect(t.rounds.map((r) => r.seq)).toEqual([1]);
  });

  it('no permite eliminar la única tirada (409)', async () => {
    const { id } = await seed();
    expect(
      (await jsonReq(app, `/api/tournaments/${id}/rounds/1`, 'DELETE', null, jar)).status,
    ).toBe(409);
  });

  it('eliminar una tirada inexistente → 404', async () => {
    const { id } = await seedRounds(2);
    expect(
      (await jsonReq(app, `/api/tournaments/${id}/rounds/99`, 'DELETE', null, jar)).status,
    ).toBe(404);
  });

  it('agregar participante re-parea y reabre tiradas completas (en_proceso)', async () => {
    const { id, pid } = await seed();
    // Completa la única tirada con el participante inicial.
    await jsonReq(
      app,
      `/api/tournaments/${id}/rounds/1/scores/${pid}`,
      'PUT',
      { arrows: ['X'] },
      jar,
    );
    expect((await detail(id)).rounds[0]?.status).toBe('completa');

    const b = await makeAvatar(app, jar, 'Beto', 'cazador');
    const res = await jsonReq(
      app,
      `/api/tournaments/${id}/participants`,
      'POST',
      { avatarIds: [b] },
      jar,
    );
    expect(res.status).toBe(200);
    const t = (await res.json()) as TournamentDetailView;
    expect(t.participants).toHaveLength(2);
    // El nuevo arquero debe cargar la tirada ya completada → vuelve a en_proceso.
    expect(t.rounds[0]?.status).toBe('en_proceso');
    // Rollups del nuevo en cero.
    const beto = t.participants.find((p) => p.alias === 'Beto');
    expect(beto?.totalScore).toBe(0);
    expect(beto?.endsCompleted).toBe(0);
  });

  it('el nuevo completa el par incompleto existente (no re-parea)', async () => {
    const { id, pid } = await seed(); // Ana: par 0, solo (posición A)
    const b = await makeAvatar(app, jar, 'Beto', 'cazador');
    const t = (await (
      await jsonReq(app, `/api/tournaments/${id}/participants`, 'POST', { avatarIds: [b] }, jar)
    ).json()) as TournamentDetailView;

    const ana = t.participants.find((p) => p.id === pid);
    const beto = t.participants.find((p) => p.alias === 'Beto');
    // Beto completa el par de Ana (mismo pairIndex, posición B); Ana no cambia.
    expect(ana?.pairIndex).toBe(0);
    expect(ana?.pairPosition).toBe('A');
    expect(beto?.pairIndex).toBe(0);
    expect(beto?.pairPosition).toBe('B');
  });

  it('un tercero arranca un par nuevo (índice nuevo)', async () => {
    const { id } = await seed();
    const b = await makeAvatar(app, jar, 'Beto', 'cazador');
    const c = await makeAvatar(app, jar, 'Caro', 'raso');
    await jsonReq(app, `/api/tournaments/${id}/participants`, 'POST', { avatarIds: [b] }, jar);
    const t = (await (
      await jsonReq(app, `/api/tournaments/${id}/participants`, 'POST', { avatarIds: [c] }, jar)
    ).json()) as TournamentDetailView;

    const caro = t.participants.find((p) => p.alias === 'Caro');
    expect(caro?.pairIndex).toBe(1); // par nuevo, no toca el 0
    expect(caro?.pairPosition).toBe('A');
  });

  it('rechaza agregar un avatar que ya participa (409)', async () => {
    const a = await makeAvatar(app, jar, 'Ana', 'compuesto');
    const res = await createTournament(app, jar, {
      name: 'Dup',
      modality: 'sala',
      roundsCount: 1,
      arrowsPerEnd: 1,
      avatarIds: [a],
    });
    const id = ((await res.json()) as TournamentDetail).id;
    const dup = await jsonReq(
      app,
      `/api/tournaments/${id}/participants`,
      'POST',
      { avatarIds: [a] },
      jar,
    );
    expect(dup.status).toBe(409);
  });

  it('respeta ownership: otro usuario no edita (404)', async () => {
    const { id } = await seed();
    const jar2 = await registerUser(app, 'otro');
    expect(
      (await jsonReq(app, `/api/tournaments/${id}`, 'PATCH', { name: 'Hack' }, jar2)).status,
    ).toBe(404);
  });
});
