/**
 * Pareo de arqueros (puro). Arma pares (2 por blanco) intentando emparejar
 * dentro de la misma estaca; el sobrante de cada estaca se combina al final, y
 * un único sobrante total forma un trío con el último par. Determinista.
 */

import {
  BOW_CATEGORIES,
  type BowCategory,
  PAIR_POSITIONS,
  type PairPosition,
  STAKES,
  type Stake,
} from './domain';

export interface Pairable {
  bowCategory: BowCategory;
  alias: string;
  stake: Stake | null;
}

export interface Paired<T> {
  item: T;
  pairIndex: number;
  position: PairPosition;
}

/** Orden determinista dentro de un grupo: por categoría y luego alias. */
function sortGroup<T extends Pairable>(arr: readonly T[]): T[] {
  return [...arr].sort((a, b) => {
    const ci = BOW_CATEGORIES.indexOf(a.bowCategory) - BOW_CATEGORIES.indexOf(b.bowCategory);
    if (ci !== 0) return ci;
    return a.alias.localeCompare(b.alias);
  });
}

export function buildPairs<T extends Pairable>(participants: readonly T[]): Paired<T>[] {
  const groupsOrder: (Stake | null)[] = [...STAKES, null];
  const pairs: T[][] = [];
  const leftovers: T[] = [];

  for (const stake of groupsOrder) {
    const group = sortGroup(participants.filter((p) => p.stake === stake));
    for (let i = 0; i + 1 < group.length; i += 2) {
      pairs.push([group[i] as T, group[i + 1] as T]);
    }
    if (group.length % 2 === 1) leftovers.push(group[group.length - 1] as T);
  }

  for (let i = 0; i < leftovers.length; i += 2) {
    if (i + 1 < leftovers.length) {
      pairs.push([leftovers[i] as T, leftovers[i + 1] as T]);
    } else {
      const last = pairs[pairs.length - 1];
      if (last) {
        last.push(leftovers[i] as T); // trío
      } else {
        pairs.push([leftovers[i] as T]); // único participante
      }
    }
  }

  const out: Paired<T>[] = [];
  pairs.forEach((members, pairIndex) => {
    members.forEach((item, j) => {
      out.push({ item, pairIndex, position: PAIR_POSITIONS[j] as PairPosition });
    });
  });
  return out;
}
