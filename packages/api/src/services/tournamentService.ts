import {
  type AddParticipantsInput,
  type Avatar,
  BOW_CATEGORIES,
  DEFAULT_STAKE_MAP,
  type Pairable,
  type ParticipantStats,
  type PodiumCategory,
  type PodiumEntry,
  SCORING,
  type Stake,
  type StakeMap,
  type TournamentCreateInput,
  type TournamentDetail,
  type TournamentDetailView,
  type TournamentListItem,
  type TournamentParticipant,
  type TournamentPodium,
  type TournamentStats,
  type TournamentStatus,
  type TournamentUpdateInput,
  assignNewParticipants,
  buildPairs,
  participantStats,
  rankItems,
  stakeForCategory,
  tournamentStats,
  usesStakes,
} from '@bv/shared';
import { conflict, notFound } from '../lib/errors';
import type { AvatarRepo } from '../repositories/avatarRepo';
import type {
  AssignFn,
  MutateResult,
  ParticipantSeed,
  TournamentRepo,
} from '../repositories/tournamentRepo';

/** Traduce el resultado de una mutación que exige torneo en curso. */
function ensureMutated(result: MutateResult): void {
  if (result === 'not_found') throw notFound('El torneo no existe.');
  if (result === 'not_open') throw conflict('El torneo no está en curso.');
}

interface PairableAvatar extends Pairable {
  avatar: Avatar;
}

/** Convierte participantes en entradas de podio rankeadas (puesto compartido en empate). */
function podiumEntries(items: TournamentParticipant[]): PodiumEntry[] {
  return rankItems(items).map(({ item, rank }) => ({ rank, participant: item }));
}

/** Detalle + mini-podio (top 3 general). 404 si el torneo no pertenece al user. */
function detailView(repo: TournamentRepo, userId: number, id: number): TournamentDetailView {
  const detail = repo.getDetail(userId, id);
  if (!detail) throw notFound('El torneo no existe.');
  return { ...detail, miniPodium: podiumEntries(detail.participants).slice(0, 3) };
}

export function createTournamentService(repo: TournamentRepo, avatarRepo: AvatarRepo) {
  return {
    create(userId: number, input: TournamentCreateInput): TournamentDetail {
      // Verifica ownership de cada avatar y arma el snapshot (orden de input).
      const avatars = input.avatarIds.map((id) => {
        const a = avatarRepo.findOwned(userId, id);
        if (!a) throw notFound('Uno de los avatares no existe.');
        return a;
      });

      const useStake = usesStakes(input.modality);
      const stakeMap: StakeMap | null = useStake
        ? ((input.stakeMap as StakeMap | undefined) ?? DEFAULT_STAKE_MAP)
        : null;

      const pairables: PairableAvatar[] = avatars.map((avatar) => ({
        avatar,
        alias: avatar.alias,
        bowCategory: avatar.bowCategory,
        stake: stakeMap ? stakeForCategory(stakeMap, avatar.bowCategory) : null,
      }));

      const participants: ParticipantSeed[] = buildPairs(pairables).map(
        ({ item, pairIndex, position }) => ({
          avatarId: item.avatar.id,
          alias: item.avatar.alias,
          bowCategory: item.avatar.bowCategory,
          color: item.avatar.color,
          experience: item.avatar.experience,
          stake: item.stake,
          pairIndex,
          pairPosition: position,
        }),
      );

      const distances = useStake
        ? ((input.distances as Record<Stake, number> | undefined) ?? null)
        : null;

      const id = repo.create(userId, {
        name: input.name,
        modality: input.modality,
        roundsCount: input.roundsCount,
        arrowsPerEnd: input.arrowsPerEnd,
        scoringSet: [...SCORING[input.modality].tokens],
        stakeMap,
        distances,
        participants,
      });

      const detail = repo.getDetail(userId, id);
      if (!detail) throw notFound('No se pudo crear el torneo.');
      return detail;
    },

    list(userId: number, status?: TournamentStatus): TournamentListItem[] {
      return repo.list(userId, status);
    },

    getDetailView(userId: number, id: number): TournamentDetailView {
      return detailView(repo, userId, id);
    },

    finish(userId: number, id: number): TournamentDetailView {
      const result = repo.finish(userId, id);
      if (result === 'not_found') throw notFound('El torneo no existe.');
      if (result === 'already_finished') throw conflict('El torneo ya está finalizado.');
      if (result === 'incomplete') throw conflict('Faltan tiradas por completar.');
      return detailView(repo, userId, id);
    },

    updateName(userId: number, id: number, input: TournamentUpdateInput): TournamentDetailView {
      ensureMutated(repo.updateName(userId, id, input.name));
      return detailView(repo, userId, id);
    },

    addRound(userId: number, id: number): TournamentDetailView {
      ensureMutated(repo.addRound(userId, id));
      return detailView(repo, userId, id);
    },

    deleteRound(userId: number, id: number, seq: number): TournamentDetailView {
      const result = repo.deleteRound(userId, id, seq);
      if (result === 'not_found') throw notFound('El torneo no existe.');
      if (result === 'not_open') throw conflict('El torneo no está en curso.');
      if (result === 'round_not_found') throw notFound('La tirada no existe.');
      if (result === 'last_round') throw conflict('No podés eliminar la única tirada.');
      return detailView(repo, userId, id);
    },

    addParticipants(userId: number, id: number, input: AddParticipantsInput): TournamentDetailView {
      const detail = repo.getDetail(userId, id);
      if (!detail) throw notFound('El torneo no existe.');
      if (detail.status !== 'en_curso') throw conflict('El torneo no está en curso.');

      const existingAvatarIds = new Set(detail.participants.map((p) => p.avatarId));
      const useStake = usesStakes(detail.modality);
      const stakeMap = detail.stakeMap;

      const seeds: ParticipantSeed[] = input.avatarIds.map((avatarId) => {
        if (existingAvatarIds.has(avatarId)) {
          throw conflict('Ese avatar ya participa del torneo.');
        }
        const a = avatarRepo.findOwned(userId, avatarId);
        if (!a) throw notFound('Uno de los avatares no existe.');
        return {
          avatarId: a.id,
          alias: a.alias,
          bowCategory: a.bowCategory,
          color: a.color,
          experience: a.experience,
          stake: useStake && stakeMap ? stakeForCategory(stakeMap, a.bowCategory) : null,
          pairIndex: 0,
          pairPosition: 'A',
        };
      });

      // Pareo incremental: completa pares incompletos (misma estaca) y arma
      // pares nuevos sólo con los recién llegados. No toca los existentes.
      const assign: AssignFn = (existingPairs, newcomers) => {
        const out = new Map<number, { pairIndex: number; pairPosition: 'A' | 'B' | 'C' }>();
        for (const { item, pairIndex, position } of assignNewParticipants(
          existingPairs,
          newcomers,
        )) {
          out.set(item.id, { pairIndex, pairPosition: position });
        }
        return out;
      };

      ensureMutated(repo.addParticipants(userId, id, seeds, assign));
      return detailView(repo, userId, id);
    },

    getPodium(userId: number, id: number): TournamentPodium {
      const ps = repo.getParticipants(userId, id);
      if (!ps) throw notFound('El torneo no existe.');
      const byCategory: PodiumCategory[] = BOW_CATEGORIES.map((category) => ({
        category,
        items: ps.filter((p) => p.bowCategory === category),
      }))
        .filter((g) => g.items.length > 0)
        .map((g) => ({ category: g.category, entries: podiumEntries(g.items) }));
      return {
        general: podiumEntries(ps),
        byCategory,
        escuela: podiumEntries(ps.filter((p) => p.experience === 'escuela')),
      };
    },

    getStats(userId: number, id: number): TournamentStats {
      const ps = repo.getParticipants(userId, id);
      if (!ps) throw notFound('El torneo no existe.');
      return tournamentStats(
        ps.map((p) => ({
          bowCategory: p.bowCategory,
          totalScore: p.totalScore,
          totalX: p.totalX,
          totalM: p.totalM,
        })),
      );
    },

    getParticipantStats(userId: number, id: number, participantId: number): ParticipantStats {
      const data = repo.getParticipantStatsData(userId, id, participantId);
      if (!data.ok) {
        throw notFound(
          data.reason === 'no_tournament' ? 'El torneo no existe.' : 'El participante no existe.',
        );
      }
      return participantStats(data.modality, data.ends);
    },
  };
}

export type TournamentService = ReturnType<typeof createTournamentService>;
