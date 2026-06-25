/**
 * Límites de validación y metadatos compartidos (FE + BE).
 * Reglas de negocio: ver docs/FUNCTIONAL.md y docs/DOMAIN_WA.md.
 */

export const APP_NAME = 'BV Archery Battle';

/** Límites de validación compartidos por schemas Zod (SH) y formularios (FE). */
export const LIMITS = {
  alias: { min: 3, max: 30, pattern: /^[a-zA-Z0-9._-]+$/ },
  password: { min: 8, max: 128 },
  securityAnswer: { min: 2, max: 100 },
  avatarAlias: { min: 1, max: 30 },
  tournamentName: { min: 1, max: 60 },
  rounds: { min: 1, max: 50 },
  arrowsPerEnd: { min: 1, max: 12 },
  participants: { min: 1, max: 60 },
  distanceMeters: { min: 1, max: 90 },
} as const;
