import { describe, expect, it } from 'vitest';
import { participantComparison, participantStats, tournamentStats } from '../src/stats';

describe('participantStats', () => {
  const ends = [
    { seq: 1, arrows: ['X', '9', '7'] }, // 26
    { seq: 2, arrows: ['10', '8', 'M'] }, // 18
  ];

  it('agrega totales, promedios y mejor tirada', () => {
    const s = participantStats('sala', ends);
    expect(s.endsCompleted).toBe(2);
    expect(s.arrowsShot).toBe(6);
    expect(s.totalScore).toBe(44);
    expect(s.averagePerEnd).toBe(22);
    expect(s.averagePerArrow).toBeCloseTo(44 / 6, 5);
    expect(s.bestEnd).toBe(26);
  });

  it('cuenta X, M e inner', () => {
    const s = participantStats('sala', ends);
    expect(s.xCount).toBe(1);
    expect(s.mCount).toBe(1);
    expect(s.innerCount).toBe(1); // X es el inner en sala
  });

  it('arma la evolución por tirada con acumulado', () => {
    const s = participantStats('sala', ends);
    expect(s.evolution).toEqual([
      { seq: 1, total: 26, cumulative: 26 },
      { seq: 2, total: 18, cumulative: 44 },
    ]);
  });

  it('arma la distribución por anillo sobre el set de la modalidad', () => {
    const s = participantStats('sala', ends);
    expect(s.distribution.X).toBe(1);
    expect(s.distribution['10']).toBe(1);
    expect(s.distribution['9']).toBe(1);
    expect(s.distribution['8']).toBe(1);
    expect(s.distribution['7']).toBe(1);
    expect(s.distribution.M).toBe(1);
    expect(s.distribution['1']).toBe(0); // token del set no usado
  });

  it('calcula consistencia (desvío estándar de los totales) y peor tirada', () => {
    const s = participantStats('sala', ends);
    // totales 26 y 18, media 22 → varianza ((4)²+(4)²)/2 = 16 → desvío 4.
    expect(s.consistency).toBeCloseTo(4, 5);
    expect(s.worstEnd).toBe(18);
  });

  it('consistencia es 0 con una sola tirada', () => {
    const s = participantStats('sala', [{ seq: 1, arrows: ['X', '9', '7'] }]);
    expect(s.consistency).toBe(0);
    expect(s.worstEnd).toBe(26);
  });

  it('maneja el caso sin tiradas', () => {
    const s = participantStats('sala', []);
    expect(s.endsCompleted).toBe(0);
    expect(s.totalScore).toBe(0);
    expect(s.averagePerArrow).toBe(0);
    expect(s.averagePerEnd).toBe(0);
    expect(s.bestEnd).toBeNull();
    expect(s.consistency).toBe(0);
    expect(s.worstEnd).toBeNull();
  });

  it('respeta el set de cada modalidad (3D)', () => {
    const s = participantStats('3d', [{ seq: 1, arrows: ['11', '10'] }]);
    expect(s.totalScore).toBe(21);
    expect(s.innerCount).toBe(1); // 11 es el inner en 3D
    expect(s.distribution['11']).toBe(1);
    expect(s.distribution['5']).toBe(0);
  });
});

describe('tournamentStats', () => {
  const participants = [
    { bowCategory: 'compuesto', totalScore: 44, totalX: 1, totalM: 1, arrowsShot: 6 },
    { bowCategory: 'recurvo_olimpico', totalScore: 30, totalX: 0, totalM: 0, arrowsShot: 6 },
    { bowCategory: 'compuesto', totalScore: 50, totalX: 2, totalM: 0, arrowsShot: 6 },
  ] as const;

  it('agrega X, M, promedio general y mejor general', () => {
    const s = tournamentStats([...participants]);
    expect(s.participants).toBe(3);
    expect(s.totalX).toBe(3);
    expect(s.totalM).toBe(1);
    expect(s.averageScore).toBeCloseTo((44 + 30 + 50) / 3, 5);
    expect(s.bestScore).toBe(50);
  });

  it('agrega por categoría (promedio y mejor)', () => {
    const s = tournamentStats([...participants]);
    const comp = s.byCategory.find((c) => c.category === 'compuesto');
    const recu = s.byCategory.find((c) => c.category === 'recurvo_olimpico');
    expect(comp?.participants).toBe(2);
    expect(comp?.averageScore).toBe(47); // (44+50)/2
    expect(comp?.bestScore).toBe(50);
    expect(recu?.participants).toBe(1);
    expect(recu?.bestScore).toBe(30);
  });

  it('maneja torneo sin participantes', () => {
    const s = tournamentStats([]);
    expect(s.participants).toBe(0);
    expect(s.averageScore).toBe(0);
    expect(s.bestScore).toBeNull();
    expect(s.byCategory).toEqual([]);
  });
});

describe('participantComparison', () => {
  const field = [
    { id: 1, totalScore: 44, bowCategory: 'compuesto' },
    { id: 2, totalScore: 30, bowCategory: 'recurvo_olimpico' },
    { id: 3, totalScore: 50, bowCategory: 'compuesto' },
  ] as const;

  it('compara contra el promedio general y de categoría, con posiciones', () => {
    const c = participantComparison(1, [...field]);
    expect(c).not.toBeNull();
    expect(c?.generalAvg).toBeCloseTo((44 + 30 + 50) / 3, 5);
    expect(c?.categoryAvg).toBe(47); // (44+50)/2
    expect(c?.totalParticipants).toBe(3);
    expect(c?.categoryParticipants).toBe(2);
    expect(c?.rankGeneral).toBe(2); // solo 50 supera a 44
    expect(c?.rankCategory).toBe(2);
  });

  it('devuelve null si el participante no está en el campo', () => {
    expect(participantComparison(99, [...field])).toBeNull();
  });
});
