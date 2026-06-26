/**
 * Estadísticas derivadas (puras, FE + BE). Por participante (sobre sus ends) y
 * por torneo (sobre los rollups denormalizados). Reglas: ver docs/DOMAIN_WA.md §8.
 */

import { MISS_TOKEN, type Modality, SCORING, X_TOKEN } from './domain';
import type { BowCategory } from './domain';

/** Un end cargado: número de tirada + tokens. */
export interface StatEnd {
  seq: number;
  arrows: readonly string[];
}

export interface ParticipantStats {
  endsCompleted: number;
  arrowsShot: number;
  totalScore: number;
  averagePerArrow: number;
  averagePerEnd: number;
  /** Mejor tirada (mayor total), o null si no hay ends. */
  bestEnd: number | null;
  /** Peor tirada (menor total), o null si no hay ends. */
  worstEnd: number | null;
  /** Consistencia: desvío estándar (poblacional) de los totales por tirada. Menor = más regular. */
  consistency: number;
  xCount: number;
  mCount: number;
  innerCount: number;
  /** Total por tirada con acumulado (orden por seq). */
  evolution: { seq: number; total: number; cumulative: number }[];
  /** Conteo por token del set de la modalidad (todos los tokens presentes). */
  distribution: Record<string, number>;
}

/** Estadísticas de un participante a partir de sus ends. */
export function participantStats(modality: Modality, ends: readonly StatEnd[]): ParticipantStats {
  const cfg = SCORING[modality];
  const distribution: Record<string, number> = {};
  for (const token of cfg.tokens) distribution[token] = 0;

  let totalScore = 0;
  let arrowsShot = 0;
  let xCount = 0;
  let mCount = 0;
  let innerCount = 0;
  let bestEnd: number | null = null;
  let worstEnd: number | null = null;

  const ordered = [...ends].sort((a, b) => a.seq - b.seq);
  const evolution: ParticipantStats['evolution'] = [];
  const endTotals: number[] = [];
  let cumulative = 0;

  for (const end of ordered) {
    let endTotal = 0;
    for (const token of end.arrows) {
      const value = cfg.values[token] ?? 0;
      endTotal += value;
      arrowsShot++;
      if (token in distribution) distribution[token] = (distribution[token] ?? 0) + 1;
      if (token === X_TOKEN && cfg.hasX) xCount++;
      if (token === MISS_TOKEN) mCount++;
      if (token === cfg.innerToken) innerCount++;
    }
    totalScore += endTotal;
    cumulative += endTotal;
    endTotals.push(endTotal);
    evolution.push({ seq: end.seq, total: endTotal, cumulative });
    if (bestEnd === null || endTotal > bestEnd) bestEnd = endTotal;
    if (worstEnd === null || endTotal < worstEnd) worstEnd = endTotal;
  }

  const averagePerEnd = ordered.length ? totalScore / ordered.length : 0;
  // Desvío estándar poblacional de los totales (0 si hay menos de 2 tiradas).
  const consistency =
    endTotals.length > 1
      ? Math.sqrt(
          endTotals.reduce((acc, t) => acc + (t - averagePerEnd) ** 2, 0) / endTotals.length,
        )
      : 0;

  return {
    endsCompleted: ordered.length,
    arrowsShot,
    totalScore,
    averagePerArrow: arrowsShot ? totalScore / arrowsShot : 0,
    averagePerEnd,
    bestEnd,
    worstEnd,
    consistency,
    xCount,
    mCount,
    innerCount,
    evolution,
    distribution,
  };
}

/** Rollup de un participante para agregaciones del torneo. */
export interface StatParticipant {
  bowCategory: BowCategory;
  totalScore: number;
  totalX: number;
  totalM: number;
}

export interface CategoryStat {
  category: BowCategory;
  participants: number;
  averageScore: number;
  bestScore: number;
}

export interface TournamentStats {
  participants: number;
  totalX: number;
  totalM: number;
  averageScore: number;
  bestScore: number | null;
  byCategory: CategoryStat[];
}

/** Un participante del campo para comparativas (rollups). */
export interface FieldParticipant {
  id: number;
  totalScore: number;
  bowCategory: BowCategory;
}

export interface ParticipantComparison {
  generalAvg: number;
  categoryAvg: number;
  /** Posición 1-based en la general (empates comparten posición). */
  rankGeneral: number;
  totalParticipants: number;
  rankCategory: number;
  categoryParticipants: number;
}

/**
 * Compara a un participante contra el resto del torneo: promedio y posición
 * en la general y en su categoría. Puro; deriva de los rollups del campo.
 */
export function participantComparison(
  targetId: number,
  field: readonly FieldParticipant[],
): ParticipantComparison | null {
  const me = field.find((p) => p.id === targetId);
  if (!me) return null;

  const n = field.length;
  const generalAvg = n ? field.reduce((a, p) => a + p.totalScore, 0) / n : 0;
  const cat = field.filter((p) => p.bowCategory === me.bowCategory);
  const categoryAvg = cat.length ? cat.reduce((a, p) => a + p.totalScore, 0) / cat.length : 0;

  return {
    generalAvg,
    categoryAvg,
    rankGeneral: 1 + field.filter((p) => p.totalScore > me.totalScore).length,
    totalParticipants: n,
    rankCategory: 1 + cat.filter((p) => p.totalScore > me.totalScore).length,
    categoryParticipants: cat.length,
  };
}

/** Estadísticas agregadas del torneo a partir de los rollups de participantes. */
export function tournamentStats(participants: readonly StatParticipant[]): TournamentStats {
  if (participants.length === 0) {
    return {
      participants: 0,
      totalX: 0,
      totalM: 0,
      averageScore: 0,
      bestScore: null,
      byCategory: [],
    };
  }

  let totalX = 0;
  let totalM = 0;
  let sumScore = 0;
  let bestScore = participants[0]?.totalScore ?? 0;
  const groups = new Map<BowCategory, number[]>();

  for (const p of participants) {
    totalX += p.totalX;
    totalM += p.totalM;
    sumScore += p.totalScore;
    if (p.totalScore > bestScore) bestScore = p.totalScore;
    const list = groups.get(p.bowCategory) ?? [];
    list.push(p.totalScore);
    groups.set(p.bowCategory, list);
  }

  const byCategory: CategoryStat[] = [...groups.entries()].map(([category, scores]) => ({
    category,
    participants: scores.length,
    averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    bestScore: Math.max(...scores),
  }));

  return {
    participants: participants.length,
    totalX,
    totalM,
    averageScore: sumScore / participants.length,
    bestScore,
    byCategory,
  };
}
