/**
 * Puntuación WA — lógica pura compartida (FE + BE).
 * El servidor es la autoridad: deriva el valor de cada flecha desde su token
 * y recalcula totales/contadores. Nunca confía en valores del cliente.
 */

import { MISS_TOKEN, type Modality, SCORING, X_TOKEN } from './domain';

/** Resultado del cómputo de un end válido. */
export interface EndComputation {
  /** Puntaje total del end. */
  total: number;
  /** Contador del token de desempate primario (X / 6 / 11). */
  innerCount: number;
  /** Contador del token de desempate secundario (10 / 5 / 10). */
  secondCount: number;
  /** Contador de X (solo sala/aire libre; 0 en el resto). */
  xCount: number;
  /** Contador de M (miss). */
  mCount: number;
  /** Contadores por token de desempate, en orden de prioridad. */
  tiebreakCounts: number[];
}

export type EndValidationError =
  | { code: 'ARROW_COUNT'; expected: number; got: number }
  | { code: 'INVALID_TOKEN'; index: number; token: string };

export type EndValidationResult =
  | { ok: true; value: EndComputation }
  | { ok: false; error: EndValidationError };

/** True si el token pertenece al set de la modalidad. */
export function isValidToken(modality: Modality, token: string): boolean {
  return token in SCORING[modality].values;
}

/** Valor numérico canónico de un token. Lanza si el token es inválido. */
export function tokenValue(modality: Modality, token: string): number {
  const value = SCORING[modality].values[token];
  if (value === undefined) {
    throw new Error(`Token inválido para ${modality}: ${token}`);
  }
  return value;
}

/** Puntaje máximo posible de un end. */
export function maxEndScore(modality: Modality, arrowsPerEnd: number): number {
  return SCORING[modality].maxPerArrow * arrowsPerEnd;
}

function countToken(arrows: readonly string[], token: string): number {
  let n = 0;
  for (const a of arrows) {
    if (a === token) n++;
  }
  return n;
}

/**
 * Valida y computa un end. No exige orden descendente (es convención de carga
 * en la UI; el orden no altera el puntaje).
 */
export function validateEndScore(
  modality: Modality,
  arrowsPerEnd: number,
  arrows: readonly string[],
): EndValidationResult {
  if (arrows.length !== arrowsPerEnd) {
    return {
      ok: false,
      error: { code: 'ARROW_COUNT', expected: arrowsPerEnd, got: arrows.length },
    };
  }

  const cfg = SCORING[modality];
  let total = 0;
  for (let i = 0; i < arrows.length; i++) {
    const token = arrows[i] ?? '';
    const value = cfg.values[token];
    if (value === undefined) {
      return { ok: false, error: { code: 'INVALID_TOKEN', index: i, token } };
    }
    total += value;
  }

  const tiebreakCounts = cfg.tiebreakTokens.map((t) => countToken(arrows, t));

  return {
    ok: true,
    value: {
      total,
      innerCount: countToken(arrows, cfg.innerToken),
      secondCount: tiebreakCounts[1] ?? 0,
      xCount: cfg.hasX ? countToken(arrows, X_TOKEN) : 0,
      mCount: countToken(arrows, MISS_TOKEN),
      tiebreakCounts,
    },
  };
}

/**
 * Ordena las flechas de mayor a menor para la carga/visualización (notación WA).
 * A igual valor, el inner (X) va primero.
 */
export function sortArrowsDescending(modality: Modality, arrows: readonly string[]): string[] {
  const cfg = SCORING[modality];
  return [...arrows].sort((a, b) => {
    const delta = (cfg.values[b] ?? -1) - (cfg.values[a] ?? -1);
    if (delta !== 0) return delta;
    if (a === cfg.innerToken) return -1;
    if (b === cfg.innerToken) return 1;
    return 0;
  });
}
