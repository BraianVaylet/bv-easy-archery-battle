/**
 * Ranking y desempate WA (puro). Orden: puntaje total → inner → segundo →
 * menos M. Empate total → puesto compartido (ranking de competición: 1,2,2,4).
 */

export interface Rankable {
  totalScore: number;
  totalInner: number;
  totalSecond: number;
  totalM: number;
}

export interface Ranked<T> {
  item: T;
  /** Puesto 1-based; compartido en empates. */
  rank: number;
}

/** Comparador de clasificación (negativo → a va antes que b). */
export function compareRank(a: Rankable, b: Rankable): number {
  if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
  if (b.totalInner !== a.totalInner) return b.totalInner - a.totalInner;
  if (b.totalSecond !== a.totalSecond) return b.totalSecond - a.totalSecond;
  return a.totalM - b.totalM; // menos M clasifica mejor
}

/** Ordena y asigna puestos (compartidos en empate total). Estable ante empates. */
export function rankItems<T extends Rankable>(items: readonly T[]): Ranked<T>[] {
  const sorted = [...items].sort(compareRank);
  const out: Ranked<T>[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i] as T;
    const prev = sorted[i - 1];
    const sharesPrev = prev !== undefined && compareRank(prev, item) === 0;
    const rank = sharesPrev ? (out[i - 1] as Ranked<T>).rank : i + 1;
    out.push({ item, rank });
  }
  return out;
}
