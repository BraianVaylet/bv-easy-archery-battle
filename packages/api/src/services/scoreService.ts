import {
  type EndValidationError,
  type RoundView,
  type ScoreSaveInput,
  type ScoreSaveResult,
  validateEndScore,
} from '@bv/shared';
import { type AppError, conflict, notFound, validationError } from '../lib/errors';
import type { ScoreRepo } from '../repositories/scoreRepo';

/** Traduce un error de validación de end (dominio) a un AppError 400. */
function scoreError(err: EndValidationError): AppError {
  const detail =
    err.code === 'ARROW_COUNT'
      ? { path: 'arrows', message: `Se esperaban ${err.expected} flechas, llegaron ${err.got}.` }
      : {
          path: 'arrows',
          message: `Token inválido en la posición ${err.index + 1}: ${err.token}.`,
        };
  return validationError('La tirada cargada no es válida.', [detail]);
}

export function createScoreService(repo: ScoreRepo) {
  return {
    getRound(userId: number, tournamentId: number, seq: number): RoundView {
      const meta = repo.getMeta(userId, tournamentId);
      if (!meta) throw notFound('El torneo no existe.');
      const round = repo.getRound(tournamentId, seq);
      if (!round) throw notFound('La tirada no existe.');
      return {
        tournamentId: meta.id,
        modality: meta.modality,
        seq: round.seq,
        arrowsPerEnd: round.arrowsPerEnd,
        status: round.status,
        entries: repo.listEntries(tournamentId, round.id),
      };
    },

    saveScore(
      userId: number,
      tournamentId: number,
      seq: number,
      participantId: number,
      input: ScoreSaveInput,
    ): ScoreSaveResult {
      const meta = repo.getMeta(userId, tournamentId);
      if (!meta) throw notFound('El torneo no existe.');
      if (meta.status === 'finalizado') throw conflict('El torneo está finalizado.');
      const round = repo.getRound(tournamentId, seq);
      if (!round) throw notFound('La tirada no existe.');
      if (!repo.participantBelongs(tournamentId, participantId)) {
        throw notFound('El participante no existe.');
      }

      const result = validateEndScore(meta.modality, round.arrowsPerEnd, input.arrows);
      if (!result.ok) throw scoreError(result.error);

      const saved = repo.save({
        roundId: round.id,
        participantId,
        tournamentId,
        arrows: input.arrows,
        computed: result.value,
        expectedParticipants: repo.participantCount(tournamentId),
      });

      return { score: saved.score, round: { seq: round.seq, status: saved.roundStatus } };
    },
  };
}

export type ScoreService = ReturnType<typeof createScoreService>;
