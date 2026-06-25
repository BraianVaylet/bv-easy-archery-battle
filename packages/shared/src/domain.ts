/**
 * Dominio WA — única fuente de verdad de constantes y tipos del torneo.
 * Puro (sin I/O). Usado por API y web. Reglas: ver docs/DOMAIN_WA.md.
 */

// ── Modalidades ────────────────────────────────────────────────────────────
export const MODALITIES = ['sala', 'aire_libre', 'campo', '3d'] as const;
export type Modality = (typeof MODALITIES)[number];

export const MODALITY_LABELS: Record<Modality, string> = {
  sala: 'Sala',
  aire_libre: 'Aire libre',
  campo: 'Juegos de campo',
  '3d': '3D',
};

// ── Categorías de arco ──────────────────────────────────────────────────────
export const BOW_CATEGORIES = [
  'compuesto',
  'cazador',
  'raso',
  'recurvo_olimpico',
  'recurvo_tradicional',
  'longbow',
] as const;
export type BowCategory = (typeof BOW_CATEGORIES)[number];

export const BOW_CATEGORY_LABELS: Record<BowCategory, string> = {
  compuesto: 'Compuesto',
  cazador: 'Cazador',
  raso: 'Raso',
  recurvo_olimpico: 'Recurvo olímpico',
  recurvo_tradicional: 'Recurvo tradicional',
  longbow: 'Longbow',
};

// ── Experiencia ─────────────────────────────────────────────────────────────
export const EXPERIENCES = ['escuela', 'senior'] as const;
export type Experience = (typeof EXPERIENCES)[number];

export const EXPERIENCE_LABELS: Record<Experience, string> = {
  escuela: 'Escuela',
  senior: 'Senior',
};

export const DEFAULT_EXPERIENCE: Experience = 'senior';

// ── Estacas (solo Campo / 3D) ───────────────────────────────────────────────
export const STAKES = ['roja', 'azul', 'amarilla'] as const;
export type Stake = (typeof STAKES)[number];

export const STAKE_LABELS: Record<Stake, string> = {
  roja: 'Roja',
  azul: 'Azul',
  amarilla: 'Amarilla',
};

/** Color hex del marcador de estaca (para la UI). */
export const STAKE_HEX: Record<Stake, string> = {
  roja: '#E5484D',
  azul: '#0091FF',
  amarilla: '#F5D90A',
};

/** Mapeo por defecto categoría → estaca (editable por torneo). */
export const DEFAULT_STAKE_MAP: Record<Stake, readonly BowCategory[]> = {
  roja: ['compuesto', 'recurvo_olimpico'],
  azul: ['raso', 'cazador'],
  amarilla: ['recurvo_tradicional', 'longbow'],
};

export type StakeMap = Record<Stake, readonly BowCategory[]>;

/** Modalidades que usan estacas/distancias por posición. */
export function usesStakes(modality: Modality): boolean {
  return modality === 'campo' || modality === '3d';
}

/** Estaca de una categoría según el mapeo dado, o null si no figura. */
export function stakeForCategory(map: StakeMap, category: BowCategory): Stake | null {
  for (const stake of STAKES) {
    if (map[stake].includes(category)) return stake;
  }
  return null;
}

// ── Puntuación (tokens WA por modalidad) ────────────────────────────────────
/** Token de miss (sin puntaje). */
export const MISS_TOKEN = 'M';
/** Token de inner-10 en modalidades de diana (sala/aire libre). */
export const X_TOKEN = 'X';

export interface ScoringConfig {
  /** Tokens válidos en orden descendente (mayor a menor), incluye inner y M. */
  readonly tokens: readonly string[];
  /** Valor numérico de cada token. */
  readonly values: Readonly<Record<string, number>>;
  /** Máximo puntaje por flecha. */
  readonly maxPerArrow: number;
  /** Token de desempate primario (X / 6 / 11). */
  readonly innerToken: string;
  /** Tokens contados para el desempate, en orden de prioridad. */
  readonly tiebreakTokens: readonly string[];
  /** Si la modalidad distingue el inner-10 (X). */
  readonly hasX: boolean;
}

const TARGET_SCORING: ScoringConfig = {
  tokens: ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'],
  values: {
    X: 10,
    '10': 10,
    '9': 9,
    '8': 8,
    '7': 7,
    '6': 6,
    '5': 5,
    '4': 4,
    '3': 3,
    '2': 2,
    '1': 1,
    M: 0,
  },
  maxPerArrow: 10,
  innerToken: 'X',
  tiebreakTokens: ['X', '10'],
  hasX: true,
};

/** Config de puntuación por modalidad. */
export const SCORING: Record<Modality, ScoringConfig> = {
  sala: TARGET_SCORING,
  aire_libre: TARGET_SCORING,
  campo: {
    tokens: ['6', '5', '4', '3', '2', '1', 'M'],
    values: { '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, '1': 1, M: 0 },
    maxPerArrow: 6,
    innerToken: '6',
    tiebreakTokens: ['6', '5'],
    hasX: false,
  },
  '3d': {
    tokens: ['11', '10', '8', '5', 'M'],
    values: { '11': 11, '10': 10, '8': 8, '5': 5, M: 0 },
    maxPerArrow: 11,
    innerToken: '11',
    tiebreakTokens: ['11', '10'],
    hasX: false,
  },
};

/** Flechas por tirada por defecto al crear el torneo (editable). */
export const DEFAULT_ARROWS: Record<Modality, number> = {
  sala: 3,
  aire_libre: 6,
  campo: 3,
  '3d': 2,
};

/** Cantidad de tiradas por defecto. */
export const DEFAULT_ROUNDS = 10;

/** Distancia fija de sala (m), informativa. */
export const SALA_DISTANCE = 18;

// ── Estados ─────────────────────────────────────────────────────────────────
export const TOURNAMENT_STATUSES = ['en_curso', 'finalizado'] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export const ROUND_STATUSES = ['pendiente', 'completa'] as const;
export type RoundStatus = (typeof ROUND_STATUSES)[number];

// A/B en pares; C solo para el trío sobrante cuando el total es impar.
export const PAIR_POSITIONS = ['A', 'B', 'C'] as const;
export type PairPosition = (typeof PAIR_POSITIONS)[number];

// ── Colores de avatar (paleta fija ≥10) ─────────────────────────────────────
export interface ColorOption {
  readonly key: string;
  readonly label: string;
  readonly hex: string;
}

export const AVATAR_COLORS: readonly ColorOption[] = [
  { key: 'red', label: 'Rojo', hex: '#E5484D' },
  { key: 'orange', label: 'Naranja', hex: '#F76808' },
  { key: 'amber', label: 'Ámbar', hex: '#FFB224' },
  { key: 'yellow', label: 'Amarillo', hex: '#F5D90A' },
  { key: 'green', label: 'Verde', hex: '#30A46C' },
  { key: 'teal', label: 'Teal', hex: '#12A594' },
  { key: 'blue', label: 'Azul', hex: '#0091FF' },
  { key: 'indigo', label: 'Índigo', hex: '#3E63DD' },
  { key: 'violet', label: 'Violeta', hex: '#8E4EC6' },
  { key: 'pink', label: 'Rosa', hex: '#E93D82' },
  { key: 'slate', label: 'Pizarra', hex: '#7B8497' },
  { key: 'brown', label: 'Marrón', hex: '#AD7F58' },
];

export const AVATAR_COLOR_KEYS = AVATAR_COLORS.map((c) => c.key);
