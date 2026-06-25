import { describe, expect, it } from 'vitest';
import { type Rankable, compareRank, rankItems } from '../src/index';

const mk = (
  id: string,
  totalScore: number,
  totalInner = 0,
  totalSecond = 0,
  totalM = 0,
): Rankable & { id: string } => ({ id, totalScore, totalInner, totalSecond, totalM });

describe('rankItems', () => {
  it('ordena por puntaje total descendente', () => {
    const ranked = rankItems([mk('a', 270), mk('b', 290), mk('c', 280)]);
    expect(ranked.map((r) => r.item.id)).toEqual(['b', 'c', 'a']);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('desempata por inner, luego segundo, luego menos M', () => {
    const byInner = rankItems([mk('a', 300, 5), mk('b', 300, 9)]);
    expect(byInner[0]?.item.id).toBe('b');

    const bySecond = rankItems([mk('a', 300, 5, 10), mk('b', 300, 5, 12)]);
    expect(bySecond[0]?.item.id).toBe('b');

    const byMiss = rankItems([mk('a', 300, 5, 10, 3), mk('b', 300, 5, 10, 1)]);
    expect(byMiss[0]?.item.id).toBe('b');
  });

  it('empate total → puesto compartido (1,2,2,4)', () => {
    const ranked = rankItems([
      mk('a', 300, 5, 5, 0),
      mk('b', 290, 4, 4, 0),
      mk('c', 290, 4, 4, 0),
      mk('d', 280, 0, 0, 0),
    ]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 2, 4]);
  });

  it('compareRank es consistente con el orden', () => {
    expect(compareRank(mk('a', 300), mk('b', 290))).toBeLessThan(0);
    expect(compareRank(mk('a', 290), mk('b', 290))).toBe(0);
  });
});
