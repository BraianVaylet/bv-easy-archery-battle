import { describe, expect, it } from 'vitest';
import {
  AVATAR_COLORS,
  BOW_CATEGORIES,
  DEFAULT_ARROWS,
  DEFAULT_STAKE_MAP,
  MISS_TOKEN,
  MODALITIES,
  SCORING,
  STAKES,
  stakeForCategory,
  usesStakes,
} from '../src/index';

describe('domain catálogos', () => {
  it('cada modalidad tiene scoring y flechas por defecto', () => {
    for (const m of MODALITIES) {
      expect(SCORING[m]).toBeDefined();
      expect(DEFAULT_ARROWS[m]).toBeGreaterThan(0);
    }
  });

  it('flechas por defecto coinciden con WA', () => {
    expect(DEFAULT_ARROWS).toEqual({ sala: 3, aire_libre: 6, campo: 3, '3d': 2 });
  });

  it('paleta de colores tiene al menos 10 variantes únicas', () => {
    expect(AVATAR_COLORS.length).toBeGreaterThanOrEqual(10);
    const keys = new Set(AVATAR_COLORS.map((c) => c.key));
    expect(keys.size).toBe(AVATAR_COLORS.length);
  });
});

describe('scoring por modalidad', () => {
  it('todo set incluye M con valor 0 y un inner válido', () => {
    for (const m of MODALITIES) {
      const cfg = SCORING[m];
      expect(cfg.tokens).toContain(MISS_TOKEN);
      expect(cfg.values[MISS_TOKEN]).toBe(0);
      expect(cfg.tokens).toContain(cfg.innerToken);
      expect(cfg.values[cfg.innerToken]).toBeLessThanOrEqual(cfg.maxPerArrow);
    }
  });

  it('los valores de cada token no superan el máximo por flecha', () => {
    for (const m of MODALITIES) {
      const cfg = SCORING[m];
      for (const token of cfg.tokens) {
        expect(cfg.values[token]).toBeLessThanOrEqual(cfg.maxPerArrow);
      }
    }
  });

  it('sala y aire libre comparten el set de diana con X', () => {
    expect(SCORING.sala).toBe(SCORING.aire_libre);
    expect(SCORING.sala.hasX).toBe(true);
    expect(SCORING.campo.hasX).toBe(false);
    expect(SCORING['3d'].innerToken).toBe('11');
  });
});

describe('estacas', () => {
  it('solo campo y 3d usan estacas', () => {
    expect(usesStakes('campo')).toBe(true);
    expect(usesStakes('3d')).toBe(true);
    expect(usesStakes('sala')).toBe(false);
    expect(usesStakes('aire_libre')).toBe(false);
  });

  it('el mapeo por defecto cubre todas las categorías sin solapamiento', () => {
    const seen = new Set<string>();
    for (const stake of STAKES) {
      for (const cat of DEFAULT_STAKE_MAP[stake]) {
        expect(seen.has(cat)).toBe(false);
        seen.add(cat);
      }
    }
    expect(seen.size).toBe(BOW_CATEGORIES.length);
  });

  it('stakeForCategory resuelve según el mapeo', () => {
    expect(stakeForCategory(DEFAULT_STAKE_MAP, 'compuesto')).toBe('roja');
    expect(stakeForCategory(DEFAULT_STAKE_MAP, 'raso')).toBe('azul');
    expect(stakeForCategory(DEFAULT_STAKE_MAP, 'longbow')).toBe('amarilla');
  });
});
