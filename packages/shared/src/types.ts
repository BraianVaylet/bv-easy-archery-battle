/**
 * Tipos de las entidades tal como las devuelve la API (camelCase).
 * Las filas de la DB (snake_case) se mapean a estos tipos en los repositories.
 */

import type {
  BowCategory,
  Experience,
  Modality,
  PairPosition,
  RoundStatus,
  Stake,
  StakeMap,
  TournamentStatus,
} from './domain';

export interface PublicUser {
  id: number;
  alias: string;
}

export interface Avatar {
  id: number;
  alias: string;
  bowCategory: BowCategory;
  color: string;
  experience: Experience;
  createdAt: number;
  updatedAt: number;
}

export interface CatalogModality {
  key: string;
  label: string;
  defaultArrows: number;
  maxPerArrow: number;
  scoringSet: string[];
  defaultRounds: number;
}

export interface Catalog {
  bowCategories: { key: string; label: string }[];
  modalities: CatalogModality[];
  colors: { key: string; label: string; hex: string }[];
}

/** Participante de un torneo: snapshot del avatar + asignación + rollups. */
export interface TournamentParticipant {
  id: number;
  avatarId: number | null;
  alias: string;
  bowCategory: BowCategory;
  color: string;
  experience: Experience;
  stake: Stake | null;
  pairIndex: number;
  pairPosition: PairPosition;
  totalScore: number;
  totalInner: number;
  totalSecond: number;
  totalX: number;
  totalM: number;
  endsCompleted: number;
}

export interface TournamentRound {
  id: number;
  seq: number;
  arrowsPerEnd: number;
  status: RoundStatus;
  completedAt: number | null;
}

/** Cabecera del torneo (sin participantes ni tiradas). */
export interface TournamentSummary {
  id: number;
  name: string;
  modality: Modality;
  roundsCount: number;
  arrowsPerEnd: number;
  scoringSet: string[];
  stakeMap: StakeMap | null;
  distances: Record<Stake, number> | null;
  status: TournamentStatus;
  createdAt: number;
  finishedAt: number | null;
}

/** Ítem de listado: cabecera + contadores para la Home. */
export interface TournamentListItem extends TournamentSummary {
  participantsCount: number;
  roundsCompleted: number;
}

/** Detalle completo del torneo (config + participantes + tiradas). */
export interface TournamentDetail extends TournamentSummary {
  participants: TournamentParticipant[];
  rounds: TournamentRound[];
}

/** Entrada de podio: puesto (compartido en empate) + participante. */
export interface PodiumEntry {
  rank: number;
  participant: TournamentParticipant;
}

/** Vista de detalle para la pantalla de torneo: detalle + mini-podio top 3. */
export interface TournamentDetailView extends TournamentDetail {
  miniPodium: PodiumEntry[];
}

/** Podio de una categoría de arco. */
export interface PodiumCategory {
  category: BowCategory;
  entries: PodiumEntry[];
}

/** Podios del torneo: general, por categoría y de escuela. */
export interface TournamentPodium {
  general: PodiumEntry[];
  byCategory: PodiumCategory[];
  escuela: PodiumEntry[];
}

/** Puntaje cargado de un participante en una tirada (derivado por el servidor). */
export interface RoundScore {
  participantId: number;
  arrows: string[];
  endTotal: number;
  innerCount: number;
  secondCount: number;
  xCount: number;
  mCount: number;
  status: RoundStatus;
  updatedAt: number;
}

/** Fila de la pantalla de tirada: participante + su score (o null si pendiente). */
export interface RoundParticipantEntry {
  participant: TournamentParticipant;
  score: RoundScore | null;
}

/** Vista de una tirada: orden por estaca/par/posición + scores + estado. */
export interface RoundView {
  tournamentId: number;
  modality: Modality;
  seq: number;
  arrowsPerEnd: number;
  status: RoundStatus;
  entries: RoundParticipantEntry[];
}

/** Respuesta del autosave: score derivado + estado resultante de la tirada. */
export interface ScoreSaveResult {
  score: RoundScore;
  round: { seq: number; status: RoundStatus };
}
