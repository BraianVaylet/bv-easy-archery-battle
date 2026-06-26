import { describe, expect, it } from 'vitest';
import { ACCENTS, deriveAccent, luminance } from './accent';

describe('deriveAccent', () => {
  it('elige texto oscuro sobre acentos claros y blanco sobre oscuros', () => {
    // Amarillo: muy luminoso → texto oscuro.
    expect(deriveAccent('#F5D90A', 'light').onPrimary).toBe('#10100f');
    // Azul: oscuro → texto blanco.
    expect(deriveAccent('#0091FF', 'light').onPrimary).toBe('#ffffff');
  });

  it('aclara el acento en tema oscuro', () => {
    const hex = '#0091FF';
    const light = luminance({
      r: Number.parseInt(deriveAccent(hex, 'light').primary.slice(1, 3), 16),
      g: Number.parseInt(deriveAccent(hex, 'light').primary.slice(3, 5), 16),
      b: Number.parseInt(deriveAccent(hex, 'light').primary.slice(5, 7), 16),
    });
    const dark = luminance({
      r: Number.parseInt(deriveAccent(hex, 'dark').primary.slice(1, 3), 16),
      g: Number.parseInt(deriveAccent(hex, 'dark').primary.slice(3, 5), 16),
      b: Number.parseInt(deriveAccent(hex, 'dark').primary.slice(5, 7), 16),
    });
    expect(dark).toBeGreaterThan(light);
  });

  it('produce un soft con alpha', () => {
    expect(deriveAccent('#F76808', 'light').soft).toMatch(/^rgba\(.+0\.16\)$/);
  });

  it('todos los acentos de la paleta derivan vars válidas', () => {
    for (const a of ACCENTS) {
      const d = deriveAccent(a.hex, 'light');
      expect(d.primary).toMatch(/^#[0-9a-f]{6}$/);
      expect(d.strong).toMatch(/^#[0-9a-f]{6}$/);
      expect(['#10100f', '#ffffff']).toContain(d.onPrimary);
    }
  });
});
