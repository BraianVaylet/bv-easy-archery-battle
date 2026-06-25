import { describe, expect, it } from 'vitest';
import {
  isValidToken,
  maxEndScore,
  sortArrowsDescending,
  tokenValue,
  validateEndScore,
} from '../src/index';

describe('tokenValue', () => {
  it('deriva el valor canónico por token', () => {
    expect(tokenValue('sala', 'X')).toBe(10);
    expect(tokenValue('sala', '10')).toBe(10);
    expect(tokenValue('sala', 'M')).toBe(0);
    expect(tokenValue('campo', '6')).toBe(6);
    expect(tokenValue('3d', '11')).toBe(11);
    expect(tokenValue('3d', '8')).toBe(8);
  });

  it('lanza ante token inválido para la modalidad', () => {
    expect(() => tokenValue('sala', '11')).toThrow();
    expect(() => tokenValue('campo', '7')).toThrow();
    expect(() => tokenValue('3d', '9')).toThrow();
  });
});

describe('isValidToken', () => {
  it('reconoce tokens válidos e inválidos por modalidad', () => {
    expect(isValidToken('sala', 'X')).toBe(true);
    expect(isValidToken('sala', '11')).toBe(false);
    expect(isValidToken('campo', '6')).toBe(true);
    expect(isValidToken('campo', '7')).toBe(false);
    expect(isValidToken('3d', '11')).toBe(true);
    expect(isValidToken('3d', '9')).toBe(false);
  });
});

describe('maxEndScore', () => {
  it('calcula el máximo por modalidad y flechas', () => {
    expect(maxEndScore('sala', 3)).toBe(30);
    expect(maxEndScore('aire_libre', 6)).toBe(60);
    expect(maxEndScore('campo', 3)).toBe(18);
    expect(maxEndScore('3d', 2)).toBe(22);
  });
});

describe('validateEndScore — casos válidos', () => {
  it('sala: X,9,7 = 26 con inner/x=1', () => {
    const r = validateEndScore('sala', 3, ['X', '9', '7']);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.total).toBe(26);
    expect(r.value.innerCount).toBe(1);
    expect(r.value.xCount).toBe(1);
    expect(r.value.mCount).toBe(0);
  });

  it('sala: X,10,M cuenta inner, segundo y miss', () => {
    const r = validateEndScore('sala', 3, ['X', '10', 'M']);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.total).toBe(20);
    expect(r.value.innerCount).toBe(1);
    expect(r.value.secondCount).toBe(1);
    expect(r.value.mCount).toBe(1);
  });

  it('campo: 6,5,M = 11 con inner(6)=1', () => {
    const r = validateEndScore('campo', 3, ['6', '5', 'M']);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.total).toBe(11);
    expect(r.value.innerCount).toBe(1);
    expect(r.value.xCount).toBe(0);
  });

  it('3d: 11,5 = 16 con inner(11)=1', () => {
    const r = validateEndScore('3d', 2, ['11', '5']);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.total).toBe(16);
    expect(r.value.innerCount).toBe(1);
  });

  it('cuenta múltiples inner (campo 6,6,5)', () => {
    const r = validateEndScore('campo', 3, ['6', '6', '5']);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.innerCount).toBe(2);
  });
});

describe('validateEndScore — errores', () => {
  it('rechaza cantidad de flechas distinta', () => {
    const r = validateEndScore('sala', 3, ['X', '9']);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('ARROW_COUNT');
  });

  it('rechaza token inválido e informa el índice', () => {
    const r = validateEndScore('sala', 3, ['X', '11', '7']);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('INVALID_TOKEN');
    if (r.error.code !== 'INVALID_TOKEN') return;
    expect(r.error.index).toBe(1);
    expect(r.error.token).toBe('11');
  });

  it('un total no puede superar el máximo del end (validado por tokens)', () => {
    // No existe token > maxPerArrow, así que el total nunca lo supera.
    const r = validateEndScore('campo', 3, ['6', '6', '6']);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.total).toBe(18);
    expect(r.value.total).toBeLessThanOrEqual(maxEndScore('campo', 3));
  });
});

describe('sortArrowsDescending', () => {
  it('ordena de mayor a menor, X antes que 10', () => {
    expect(sortArrowsDescending('sala', ['7', 'X', '9', '10'])).toEqual(['X', '10', '9', '7']);
  });

  it('ubica M al final', () => {
    expect(sortArrowsDescending('3d', ['5', 'M', '11', '8'])).toEqual(['11', '8', '5', 'M']);
  });
});
