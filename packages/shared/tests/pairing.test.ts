import { describe, expect, it } from 'vitest';
import { type BowCategory, type Stake, buildPairs } from '../src/index';

const p = (alias: string, stake: Stake | null, bowCategory: BowCategory = 'compuesto') => ({
  alias,
  stake,
  bowCategory,
});

/** Agrupa los items por pairIndex preservando posición. */
function pairsOf<T extends { alias: string }>(
  out: Array<{ item: T; pairIndex: number; position: string }>,
): string[][] {
  const map = new Map<number, string[]>();
  for (const { item, pairIndex } of out) {
    const arr = map.get(pairIndex) ?? [];
    arr.push(item.alias);
    map.set(pairIndex, arr);
  }
  return [...map.keys()].sort((a, b) => a - b).map((k) => map.get(k) as string[]);
}

describe('buildPairs', () => {
  it('sin estaca: arma pares de a 2 con posiciones A/B', () => {
    const out = buildPairs([p('a', null), p('b', null), p('c', null), p('d', null)]);
    expect(pairsOf(out)).toHaveLength(2);
    expect(out.every((o) => o.position === 'A' || o.position === 'B')).toBe(true);
  });

  it('empareja dentro de la misma estaca', () => {
    const out = buildPairs([
      p('r1', 'roja'),
      p('r2', 'roja'),
      p('z1', 'azul'),
      p('z2', 'azul'),
      p('y1', 'amarilla'),
      p('y2', 'amarilla'),
    ]);
    const pairs = pairsOf(out);
    expect(pairs).toEqual([
      ['r1', 'r2'],
      ['z1', 'z2'],
      ['y1', 'y2'],
    ]);
  });

  it('total impar → el último arquero tira solo (nunca trío)', () => {
    const out = buildPairs([
      p('a', 'roja'),
      p('b', 'roja'),
      p('c', 'roja'),
      p('d', 'roja'),
      p('e', 'roja'),
    ]);
    const pairs = pairsOf(out);
    expect(pairs).toHaveLength(3); // 2 pares + 1 solo
    expect(pairs[2]).toHaveLength(1); // arquero solo
    expect(out.every((o) => o.position === 'A' || o.position === 'B')).toBe(true);
    expect(out.some((o) => o.position === 'C')).toBe(false);
  });

  it('sobrantes de distintas estacas se combinan', () => {
    const out = buildPairs([p('r1', 'roja'), p('r2', 'roja'), p('r3', 'roja'), p('z1', 'azul')]);
    const pairs = pairsOf(out);
    expect(pairs).toHaveLength(2);
    // par 0 = roja pura; par 1 = sobrante roja + azul
    expect(pairs[0]).toEqual(['r1', 'r2']);
    expect(pairs[1]).toEqual(['r3', 'z1']);
  });

  it('es determinista', () => {
    const input = [p('b', null), p('a', null), p('c', null)];
    expect(buildPairs(input)).toEqual(buildPairs(input));
  });
});
