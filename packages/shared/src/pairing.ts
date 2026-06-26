/**
 * Pareo de arqueros (puro). Arma pares (2 por blanco) intentando emparejar
 * dentro de la misma estaca; el sobrante de cada estaca se combina al final.
 * Nunca hay tríos: si el total es impar, el último arquero tira solo.
 * Determinista.
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
      pairs.push([leftovers[i] as T]); // impar → arquero solo (nunca trío)
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

/** Estado de un par existente para el pareo incremental. */
export interface ExistingPairSlot {
  pairIndex: number;
  /** Estaca del par (la de sus miembros). */
  stake: Stake | null;
  /** Miembros actuales (1 = incompleto, se puede completar). */
  count: number;
}

/**
 * Pareo incremental al agregar arqueros a un torneo en curso: NO toca los pares
 * existentes. Primero completa pares incompletos (1 miembro) con un recién
 * llegado de la MISMA estaca; el resto forma pares nuevos con índices nuevos.
 * Determinista.
 */
export function assignNewParticipants<T extends Pairable>(
  existingPairs: readonly ExistingPairSlot[],
  newcomers: readonly T[],
): Paired<T>[] {
  const incomplete = existingPairs
    .filter((p) => p.count === 1)
    .sort((a, b) => a.pairIndex - b.pairIndex);
  const maxIndex = existingPairs.reduce((m, p) => Math.max(m, p.pairIndex), -1);

  const sorted = sortGroup(newcomers);
  const used = new Set<T>();
  const out: Paired<T>[] = [];

  // 1) Completar pares incompletos con un recién llegado de la misma estaca.
  for (const slot of incomplete) {
    const fill = sorted.find((n) => !used.has(n) && n.stake === slot.stake);
    if (fill) {
      used.add(fill);
      out.push({ item: fill, pairIndex: slot.pairIndex, position: 'B' });
    }
  }

  // 2) Los restantes forman pares nuevos (reusa buildPairs) con índices nuevos.
  const remaining = sorted.filter((n) => !used.has(n));
  for (const p of buildPairs(remaining)) {
    out.push({ item: p.item, pairIndex: maxIndex + 1 + p.pairIndex, position: p.position });
  }
  return out;
}
