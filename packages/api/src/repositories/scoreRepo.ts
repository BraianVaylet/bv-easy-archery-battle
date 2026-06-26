import type {
  EndComputation,
  Modality,
  RoundParticipantEntry,
  RoundScore,
  RoundStatus,
  TournamentStatus,
} from '@bv/shared';
import type { DB } from '../db/connection';
import { now } from '../lib/time';
import { type ParticipantRow, toParticipant } from './tournamentRepo';

/** Metadatos del torneo necesarios para validar/cargar puntajes. */
export interface TournamentMeta {
  id: number;
  modality: Modality;
  arrowsPerEnd: number;
  status: TournamentStatus;
  roundsCount: number;
}

export interface RoundMeta {
  id: number;
  seq: number;
  arrowsPerEnd: number;
  status: RoundStatus;
}

export interface SaveScoreParams {
  roundId: number;
  participantId: number;
  tournamentId: number;
  arrows: string[];
  computed: EndComputation;
  expectedParticipants: number;
}

interface MetaRow {
  id: number;
  modality: string;
  arrows_per_end: number;
  status: string;
  rounds_count: number;
}

interface RoundRow {
  id: number;
  seq: number;
  arrows_per_end: number;
  status: string;
}

interface ScoreRow {
  id: number;
  participant_id: number;
  arrows: string;
  end_total: number;
  inner_count: number;
  second_count: number;
  x_count: number;
  m_count: number;
  status: string;
  updated_at: number;
}

/** Fila del join participante ⟕ round_scores (columnas de score con prefijo s_). */
interface EntryRow extends ParticipantRow {
  s_id: number | null;
  s_arrows: string | null;
  s_end_total: number | null;
  s_inner: number | null;
  s_second: number | null;
  s_x: number | null;
  s_m: number | null;
  s_status: string | null;
  s_updated: number | null;
}

const toScore = (r: ScoreRow): RoundScore => ({
  participantId: r.participant_id,
  arrows: JSON.parse(r.arrows) as string[],
  endTotal: r.end_total,
  innerCount: r.inner_count,
  secondCount: r.second_count,
  xCount: r.x_count,
  mCount: r.m_count,
  status: r.status as RoundStatus,
  updatedAt: r.updated_at,
});

export function createScoreRepo(db: DB) {
  const meta = db.prepare<[number, number], MetaRow>(
    'SELECT id, modality, arrows_per_end, status, rounds_count FROM tournaments WHERE id = ? AND user_id = ?',
  );
  const roundBySeq = db.prepare<[number, number], RoundRow>(
    'SELECT id, seq, arrows_per_end, status FROM rounds WHERE tournament_id = ? AND seq = ?',
  );
  const participantExists = db.prepare<[number, number], { id: number }>(
    'SELECT id FROM tournament_participants WHERE id = ? AND tournament_id = ?',
  );
  const participantCount = db.prepare<[number], { n: number }>(
    'SELECT COUNT(*) AS n FROM tournament_participants WHERE tournament_id = ?',
  );
  const entries = db.prepare<[number, number], EntryRow>(
    `SELECT p.*,
        s.id AS s_id, s.arrows AS s_arrows, s.end_total AS s_end_total,
        s.inner_count AS s_inner, s.second_count AS s_second, s.x_count AS s_x,
        s.m_count AS s_m, s.status AS s_status, s.updated_at AS s_updated
     FROM tournament_participants p
     LEFT JOIN round_scores s ON s.participant_id = p.id AND s.round_id = ?
     WHERE p.tournament_id = ?
     ORDER BY p.pair_index, p.pair_position`,
  );

  const getScore = db.prepare<[number, number], ScoreRow>(
    'SELECT * FROM round_scores WHERE round_id = ? AND participant_id = ?',
  );
  const insertScore = db.prepare(
    `INSERT INTO round_scores
       (round_id, participant_id, tournament_id, arrows, end_total, inner_count, second_count, x_count, m_count, status, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completa', ?)`,
  );
  const updateScore = db.prepare(
    `UPDATE round_scores
       SET arrows = ?, end_total = ?, inner_count = ?, second_count = ?, x_count = ?, m_count = ?, status = 'completa', updated_at = ?
     WHERE round_id = ? AND participant_id = ?`,
  );
  const bumpRollups = db.prepare(
    `UPDATE tournament_participants
       SET total_score = total_score + ?, total_inner = total_inner + ?, total_second = total_second + ?,
           total_x = total_x + ?, total_m = total_m + ?, ends_completed = ends_completed + ?
     WHERE id = ?`,
  );
  const countScores = db.prepare<[number], { n: number }>(
    'SELECT COUNT(*) AS n FROM round_scores WHERE round_id = ?',
  );
  const completeRound = db.prepare(
    "UPDATE rounds SET status = 'completa', completed_at = ? WHERE id = ? AND status != 'completa'",
  );
  const markInProcess = db.prepare(
    "UPDATE rounds SET status = 'en_proceso' WHERE id = ? AND status = 'pendiente'",
  );

  const save = db.transaction(
    (params: SaveScoreParams): { score: RoundScore; roundStatus: RoundStatus } => {
      const { roundId, participantId, tournamentId, arrows, computed, expectedParticipants } =
        params;
      const ts = now();
      const arrowsJson = JSON.stringify(arrows);
      const existing = getScore.get(roundId, participantId);

      if (existing) {
        bumpRollups.run(
          computed.total - existing.end_total,
          computed.innerCount - existing.inner_count,
          computed.secondCount - existing.second_count,
          computed.xCount - existing.x_count,
          computed.mCount - existing.m_count,
          0, // ends_completed no cambia al editar
          participantId,
        );
        updateScore.run(
          arrowsJson,
          computed.total,
          computed.innerCount,
          computed.secondCount,
          computed.xCount,
          computed.mCount,
          ts,
          roundId,
          participantId,
        );
      } else {
        insertScore.run(
          roundId,
          participantId,
          tournamentId,
          arrowsJson,
          computed.total,
          computed.innerCount,
          computed.secondCount,
          computed.xCount,
          computed.mCount,
          ts,
        );
        bumpRollups.run(
          computed.total,
          computed.innerCount,
          computed.secondCount,
          computed.xCount,
          computed.mCount,
          1,
          participantId,
        );
      }

      let roundStatus: RoundStatus = 'en_proceso';
      const scored = countScores.get(roundId)?.n ?? 0;
      if (scored >= expectedParticipants) {
        completeRound.run(ts, roundId);
        roundStatus = 'completa';
      } else {
        // Parcial: al menos una carga pero faltan participantes → en proceso.
        markInProcess.run(roundId);
      }

      const score = toScore(getScore.get(roundId, participantId) as ScoreRow);
      return { score, roundStatus };
    },
  );

  return {
    getMeta(userId: number, tournamentId: number): TournamentMeta | undefined {
      const r = meta.get(tournamentId, userId);
      if (!r) return undefined;
      return {
        id: r.id,
        modality: r.modality as Modality,
        arrowsPerEnd: r.arrows_per_end,
        status: r.status as TournamentStatus,
        roundsCount: r.rounds_count,
      };
    },
    getRound(tournamentId: number, seq: number): RoundMeta | undefined {
      const r = roundBySeq.get(tournamentId, seq);
      if (!r) return undefined;
      return {
        id: r.id,
        seq: r.seq,
        arrowsPerEnd: r.arrows_per_end,
        status: r.status as RoundStatus,
      };
    },
    participantBelongs(tournamentId: number, participantId: number): boolean {
      return participantExists.get(participantId, tournamentId) !== undefined;
    },
    participantCount(tournamentId: number): number {
      return participantCount.get(tournamentId)?.n ?? 0;
    },
    listEntries(tournamentId: number, roundId: number): RoundParticipantEntry[] {
      return entries.all(roundId, tournamentId).map((r) => ({
        participant: toParticipant(r),
        score:
          r.s_id === null
            ? null
            : toScore({
                id: r.s_id,
                participant_id: r.id,
                arrows: r.s_arrows as string,
                end_total: r.s_end_total as number,
                inner_count: r.s_inner as number,
                second_count: r.s_second as number,
                x_count: r.s_x as number,
                m_count: r.s_m as number,
                status: r.s_status as string,
                updated_at: r.s_updated as number,
              }),
      }));
    },
    save(params: SaveScoreParams): { score: RoundScore; roundStatus: RoundStatus } {
      return save(params);
    },
  };
}

export type ScoreRepo = ReturnType<typeof createScoreRepo>;
