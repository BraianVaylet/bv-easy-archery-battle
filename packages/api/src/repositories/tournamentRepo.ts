import type {
  BowCategory,
  ExistingPairSlot,
  Experience,
  Modality,
  PairPosition,
  Stake,
  StakeMap,
  StatEnd,
  TournamentDetail,
  TournamentListItem,
  TournamentParticipant,
  TournamentRound,
  TournamentStatus,
  TournamentSummary,
} from '@bv/shared';
import type { DB } from '../db/connection';
import { now } from '../lib/time';

/** Datos ya resueltos (estaca + par asignados) para persistir un participante. */
export interface ParticipantSeed {
  avatarId: number;
  alias: string;
  bowCategory: BowCategory;
  color: string;
  experience: Experience;
  stake: Stake | null;
  pairIndex: number;
  pairPosition: PairPosition;
}

/** Resultado de intentar finalizar un torneo. */
export type FinishResult = 'ok' | 'not_found' | 'already_finished' | 'incomplete';

/** Resultado de una mutación que exige torneo existente y en curso. */
export type MutateResult = 'ok' | 'not_found' | 'not_open';

/** Resultado de eliminar una tirada. */
export type DeleteRoundResult = MutateResult | 'round_not_found' | 'last_round';

/** Participante mínimo para re-parear al agregar gente. */
export interface PairingInput {
  id: number;
  alias: string;
  bowCategory: BowCategory;
  stake: Stake | null;
}

/** Asigna pareo SOLO a los recién llegados (no toca los existentes). */
export type AssignFn = (
  existingPairs: ExistingPairSlot[],
  newcomers: PairingInput[],
) => Map<number, { pairIndex: number; pairPosition: PairPosition }>;

/** Datos para estadísticas de un participante (o motivo de fallo). */
export type ParticipantStatsData =
  | { ok: true; modality: Modality; ends: StatEnd[] }
  | { ok: false; reason: 'no_tournament' | 'no_participant' };

export interface CreateTournamentData {
  name: string;
  modality: Modality;
  roundsCount: number;
  arrowsPerEnd: number;
  scoringSet: string[];
  stakeMap: StakeMap | null;
  distances: Record<Stake, number> | null;
  participants: ParticipantSeed[];
}

interface TournamentRow {
  id: number;
  name: string;
  modality: string;
  rounds_count: number;
  arrows_per_end: number;
  scoring_set: string;
  stake_map: string | null;
  distances: string | null;
  status: string;
  created_at: number;
  finished_at: number | null;
}

export interface ParticipantRow {
  id: number;
  avatar_id: number | null;
  alias: string;
  bow_category: string;
  color: string;
  experience: string;
  stake: string | null;
  pair_index: number;
  pair_position: string;
  total_score: number;
  total_inner: number;
  total_second: number;
  total_x: number;
  total_m: number;
  ends_completed: number;
}

interface RoundRow {
  id: number;
  seq: number;
  arrows_per_end: number;
  status: string;
  completed_at: number | null;
}

interface ListRow extends TournamentRow {
  participants_count: number;
  rounds_completed: number;
}

const toSummary = (t: TournamentRow): TournamentSummary => ({
  id: t.id,
  name: t.name,
  modality: t.modality as Modality,
  roundsCount: t.rounds_count,
  arrowsPerEnd: t.arrows_per_end,
  scoringSet: JSON.parse(t.scoring_set) as string[],
  stakeMap: t.stake_map ? (JSON.parse(t.stake_map) as StakeMap) : null,
  distances: t.distances ? (JSON.parse(t.distances) as Record<Stake, number>) : null,
  status: t.status as TournamentStatus,
  createdAt: t.created_at,
  finishedAt: t.finished_at,
});

export const toParticipant = (r: ParticipantRow): TournamentParticipant => ({
  id: r.id,
  avatarId: r.avatar_id,
  alias: r.alias,
  bowCategory: r.bow_category as BowCategory,
  color: r.color,
  experience: r.experience as Experience,
  stake: r.stake as Stake | null,
  pairIndex: r.pair_index,
  pairPosition: r.pair_position as PairPosition,
  totalScore: r.total_score,
  totalInner: r.total_inner,
  totalSecond: r.total_second,
  totalX: r.total_x,
  totalM: r.total_m,
  endsCompleted: r.ends_completed,
});

const toRound = (r: RoundRow): TournamentRound => ({
  id: r.id,
  seq: r.seq,
  arrowsPerEnd: r.arrows_per_end,
  status: r.status as TournamentRound['status'],
  completedAt: r.completed_at,
});

export function createTournamentRepo(db: DB) {
  const insertTournament = db.prepare(
    `INSERT INTO tournaments
       (user_id, name, modality, rounds_count, arrows_per_end, scoring_set, stake_map, distances, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'en_curso', ?) RETURNING id`,
  );
  const insertParticipant = db.prepare(
    `INSERT INTO tournament_participants
       (tournament_id, avatar_id, alias, bow_category, color, experience, stake, pair_index, pair_position, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertRound = db.prepare(
    `INSERT INTO rounds (tournament_id, seq, arrows_per_end, status, created_at)
     VALUES (?, ?, ?, 'pendiente', ?)`,
  );

  const findTournament = db.prepare<[number, number], TournamentRow>(
    'SELECT * FROM tournaments WHERE id = ? AND user_id = ?',
  );
  const listSelect = `SELECT t.*,
      (SELECT COUNT(*) FROM tournament_participants p WHERE p.tournament_id = t.id) AS participants_count,
      (SELECT COUNT(*) FROM rounds r WHERE r.tournament_id = t.id AND r.status = 'completa') AS rounds_completed
    FROM tournaments t WHERE t.user_id = ?`;
  const listAll = db.prepare<[number], ListRow>(`${listSelect} ORDER BY t.created_at DESC`);
  const listByStatus = db.prepare<[number, string], ListRow>(
    `${listSelect} AND t.status = ? ORDER BY t.created_at DESC`,
  );
  const listParticipants = db.prepare<[number], ParticipantRow>(
    `SELECT * FROM tournament_participants WHERE tournament_id = ?
     ORDER BY pair_index, pair_position`,
  );
  const listRounds = db.prepare<[number], RoundRow>(
    'SELECT * FROM rounds WHERE tournament_id = ? ORDER BY seq',
  );
  const findStatus = db.prepare<[number, number], { status: string }>(
    'SELECT status FROM tournaments WHERE id = ? AND user_id = ?',
  );
  const countPending = db.prepare<[number], { n: number }>(
    "SELECT COUNT(*) AS n FROM rounds WHERE tournament_id = ? AND status != 'completa'",
  );
  const markFinished = db.prepare(
    "UPDATE tournaments SET status = 'finalizado', finished_at = ? WHERE id = ?",
  );
  const updateNameStmt = db.prepare(
    "UPDATE tournaments SET name = ? WHERE id = ? AND user_id = ? AND status = 'en_curso'",
  );
  const maxSeq = db.prepare<[number], { m: number }>(
    'SELECT COALESCE(MAX(seq), 0) AS m FROM rounds WHERE tournament_id = ?',
  );
  const allForPairing = db.prepare<
    [number],
    { id: number; alias: string; bow_category: string; stake: string | null; pair_index: number }
  >(
    'SELECT id, alias, bow_category, stake, pair_index FROM tournament_participants WHERE tournament_id = ? ORDER BY id',
  );
  const updatePairing = db.prepare(
    'UPDATE tournament_participants SET pair_index = ?, pair_position = ? WHERE id = ?',
  );
  const reopenCompletedRounds = db.prepare(
    "UPDATE rounds SET status = 'en_proceso', completed_at = NULL WHERE tournament_id = ? AND status = 'completa'",
  );
  const participantInTournament = db.prepare<[number, number], { id: number }>(
    'SELECT id FROM tournament_participants WHERE id = ? AND tournament_id = ?',
  );
  const roundBySeqFull = db.prepare<[number, number], { id: number; seq: number }>(
    'SELECT id, seq FROM rounds WHERE tournament_id = ? AND seq = ?',
  );
  const countRounds = db.prepare<[number], { n: number }>(
    'SELECT COUNT(*) AS n FROM rounds WHERE tournament_id = ?',
  );
  const scoresOfRound = db.prepare<
    [number],
    {
      participant_id: number;
      end_total: number;
      inner_count: number;
      second_count: number;
      x_count: number;
      m_count: number;
    }
  >(
    'SELECT participant_id, end_total, inner_count, second_count, x_count, m_count FROM round_scores WHERE round_id = ?',
  );
  const decRollups = db.prepare(
    `UPDATE tournament_participants
       SET total_score = total_score - ?, total_inner = total_inner - ?, total_second = total_second - ?,
           total_x = total_x - ?, total_m = total_m - ?, ends_completed = ends_completed - 1
     WHERE id = ?`,
  );
  const deleteRoundStmt = db.prepare('DELETE FROM rounds WHERE id = ?');
  const shiftSeqUp = db.prepare(
    'UPDATE rounds SET seq = seq + 100000 WHERE tournament_id = ? AND seq > ?',
  );
  const shiftSeqDown = db.prepare(
    'UPDATE rounds SET seq = seq - 100001 WHERE tournament_id = ? AND seq > 100000',
  );
  const bumpRoundsCount = db.prepare(
    'UPDATE tournaments SET rounds_count = rounds_count + ? WHERE id = ?',
  );
  const participantEnds = db.prepare<[number, number], { seq: number; arrows: string }>(
    `SELECT r.seq AS seq, s.arrows AS arrows
     FROM round_scores s JOIN rounds r ON r.id = s.round_id
     WHERE s.participant_id = ? AND s.tournament_id = ?
     ORDER BY r.seq`,
  );

  const finish = db.transaction((userId: number, id: number): FinishResult => {
    const t = findStatus.get(id, userId);
    if (!t) return 'not_found';
    if (t.status === 'finalizado') return 'already_finished';
    if ((countPending.get(id)?.n ?? 0) > 0) return 'incomplete';
    markFinished.run(now(), id);
    return 'ok';
  });

  const addRoundTx = db.transaction((userId: number, id: number): MutateResult => {
    const t = findTournament.get(id, userId);
    if (!t) return 'not_found';
    if (t.status !== 'en_curso') return 'not_open';
    const seq = (maxSeq.get(id)?.m ?? 0) + 1;
    insertRound.run(id, seq, t.arrows_per_end, now());
    bumpRoundsCount.run(1, id);
    return 'ok';
  });

  const deleteRoundTx = db.transaction(
    (userId: number, id: number, seq: number): DeleteRoundResult => {
      const t = findStatus.get(id, userId);
      if (!t) return 'not_found';
      if (t.status !== 'en_curso') return 'not_open';
      const round = roundBySeqFull.get(id, seq);
      if (!round) return 'round_not_found';
      if ((countRounds.get(id)?.n ?? 0) <= 1) return 'last_round';

      // Descuenta de los rollups los puntajes de esta tirada antes de borrarla.
      for (const s of scoresOfRound.all(round.id)) {
        decRollups.run(
          s.end_total,
          s.inner_count,
          s.second_count,
          s.x_count,
          s.m_count,
          s.participant_id,
        );
      }
      deleteRoundStmt.run(round.id); // round_scores cae por ON DELETE CASCADE

      // Renumera las tiradas siguientes para mantener seq contiguo (offset evita
      // colisiones del UNIQUE(tournament_id, seq)).
      shiftSeqUp.run(id, round.seq);
      shiftSeqDown.run(id);
      bumpRoundsCount.run(-1, id);
      return 'ok';
    },
  );

  const addParticipantsTx = db.transaction(
    (userId: number, id: number, seeds: ParticipantSeed[], assign: AssignFn): MutateResult => {
      const t = findStatus.get(id, userId);
      if (!t) return 'not_found';
      if (t.status !== 'en_curso') return 'not_open';
      const ts = now();

      // Pares existentes ANTES de insertar (para detectar incompletos por estaca).
      const slots = new Map<number, { count: number; stake: string | null }>();
      for (const r of allForPairing.all(id)) {
        const cur = slots.get(r.pair_index) ?? { count: 0, stake: r.stake };
        cur.count += 1;
        slots.set(r.pair_index, cur);
      }
      const existingPairs: ExistingPairSlot[] = [...slots].map(([pairIndex, v]) => ({
        pairIndex,
        count: v.count,
        stake: v.stake as Stake | null,
      }));

      // Inserta los nuevos (pareo provisorio) y captura sus ids.
      const newcomers: PairingInput[] = seeds.map((p) => {
        const info = insertParticipant.run(
          id,
          p.avatarId,
          p.alias,
          p.bowCategory,
          p.color,
          p.experience,
          p.stake,
          p.pairIndex,
          p.pairPosition,
          ts,
        );
        return {
          id: Number(info.lastInsertRowid),
          alias: p.alias,
          bowCategory: p.bowCategory,
          stake: p.stake,
        };
      });

      // Asigna pareo SOLO a los nuevos (completa incompletos / arma pares nuevos)
      // y reabre las tiradas ya completas (los nuevos deben cargarlas).
      for (const [pid, a] of assign(existingPairs, newcomers)) {
        updatePairing.run(a.pairIndex, a.pairPosition, pid);
      }
      reopenCompletedRounds.run(id);
      return 'ok';
    },
  );

  const create = db.transaction((userId: number, data: CreateTournamentData): number => {
    const ts = now();
    const { id } = insertTournament.get(
      userId,
      data.name,
      data.modality,
      data.roundsCount,
      data.arrowsPerEnd,
      JSON.stringify(data.scoringSet),
      data.stakeMap ? JSON.stringify(data.stakeMap) : null,
      data.distances ? JSON.stringify(data.distances) : null,
      ts,
    ) as { id: number };

    for (const p of data.participants) {
      insertParticipant.run(
        id,
        p.avatarId,
        p.alias,
        p.bowCategory,
        p.color,
        p.experience,
        p.stake,
        p.pairIndex,
        p.pairPosition,
        ts,
      );
    }
    for (let seq = 1; seq <= data.roundsCount; seq++) {
      insertRound.run(id, seq, data.arrowsPerEnd, ts);
    }
    return id;
  });

  return {
    create(userId: number, data: CreateTournamentData): number {
      return create(userId, data);
    },
    list(userId: number, status?: TournamentStatus): TournamentListItem[] {
      const rows = status ? listByStatus.all(userId, status) : listAll.all(userId);
      return rows.map((r) => ({
        ...toSummary(r),
        participantsCount: r.participants_count,
        roundsCompleted: r.rounds_completed,
      }));
    },
    getDetail(userId: number, id: number): TournamentDetail | undefined {
      const t = findTournament.get(id, userId);
      if (!t) return undefined;
      return {
        ...toSummary(t),
        participants: listParticipants.all(id).map(toParticipant),
        rounds: listRounds.all(id).map(toRound),
      };
    },
    finish(userId: number, id: number): FinishResult {
      return finish(userId, id);
    },
    updateName(userId: number, id: number, name: string): MutateResult {
      if (updateNameStmt.run(name, id, userId).changes > 0) return 'ok';
      return findStatus.get(id, userId) ? 'not_open' : 'not_found';
    },
    addRound(userId: number, id: number): MutateResult {
      return addRoundTx(userId, id);
    },
    deleteRound(userId: number, id: number, seq: number): DeleteRoundResult {
      return deleteRoundTx(userId, id, seq);
    },
    addParticipants(
      userId: number,
      id: number,
      seeds: ParticipantSeed[],
      assign: AssignFn,
    ): MutateResult {
      return addParticipantsTx(userId, id, seeds, assign);
    },
    getParticipants(userId: number, id: number): TournamentParticipant[] | undefined {
      if (!findStatus.get(id, userId)) return undefined;
      return listParticipants.all(id).map(toParticipant);
    },
    getParticipantStatsData(
      userId: number,
      tournamentId: number,
      participantId: number,
    ): ParticipantStatsData {
      const t = findTournament.get(tournamentId, userId);
      if (!t) return { ok: false, reason: 'no_tournament' };
      if (!participantInTournament.get(participantId, tournamentId)) {
        return { ok: false, reason: 'no_participant' };
      }
      const ends: StatEnd[] = participantEnds.all(participantId, tournamentId).map((r) => ({
        seq: r.seq,
        arrows: JSON.parse(r.arrows) as string[],
      }));
      return { ok: true, modality: t.modality as Modality, ends };
    },
  };
}

export type TournamentRepo = ReturnType<typeof createTournamentRepo>;
