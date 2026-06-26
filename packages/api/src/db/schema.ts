/**
 * Esquema SQL embebido (ver docs/TECHNICAL.md §Modelo de datos). Se embebe como
 * string para evitar problemas de rutas entre dev (tsx) y producción.
 * Idempotente (CREATE TABLE IF NOT EXISTS): se aplica al abrir la conexión.
 *
 * IDs: INTEGER AUTOINCREMENT (consistente con el auth reutilizado de bv-bow-sight).
 * Rollups denormalizados en tournament_participants → podio/stats O(participantes).
 */

export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

-- ── Auth (espejo de bv-bow-sight para reutilizar el módulo de auth) ──────────
CREATE TABLE IF NOT EXISTS users (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  alias                 TEXT    NOT NULL COLLATE NOCASE,
  password_hash         TEXT    NOT NULL,
  security_question_id  INTEGER NOT NULL,
  security_answer_hash  TEXT    NOT NULL,
  failed_attempts       INTEGER NOT NULL DEFAULT 0,
  locked_until          INTEGER,
  created_at            INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_alias ON users (alias);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT    PRIMARY KEY,
  user_id     INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);

-- ── Catálogos (sembrados desde @bv/shared) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS bow_categories (
  key   TEXT    NOT NULL UNIQUE,
  label TEXT    NOT NULL,
  sort  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS modalities (
  key            TEXT    NOT NULL UNIQUE,
  label          TEXT    NOT NULL,
  default_arrows INTEGER NOT NULL,
  max_per_arrow  INTEGER NOT NULL,
  scoring_set    TEXT    NOT NULL,
  default_rounds INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS colors (
  key   TEXT    NOT NULL UNIQUE,
  label TEXT    NOT NULL,
  hex   TEXT    NOT NULL,
  sort  INTEGER NOT NULL
);

-- ── Dominio ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avatars (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  alias       TEXT    NOT NULL,
  bow_category TEXT   NOT NULL,
  color       TEXT    NOT NULL,
  experience  TEXT    NOT NULL DEFAULT 'senior' CHECK (experience IN ('escuela','senior')),
  archived_at INTEGER,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_avatars_user ON avatars (user_id);

CREATE TABLE IF NOT EXISTS tournaments (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL,
  name           TEXT    NOT NULL,
  modality       TEXT    NOT NULL CHECK (modality IN ('sala','aire_libre','campo','3d')),
  rounds_count   INTEGER NOT NULL,
  arrows_per_end INTEGER NOT NULL,
  scoring_set    TEXT    NOT NULL,
  stake_map      TEXT,
  distances      TEXT,
  status         TEXT    NOT NULL DEFAULT 'en_curso' CHECK (status IN ('en_curso','finalizado')),
  created_at     INTEGER NOT NULL,
  finished_at    INTEGER,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tournaments_user_status ON tournaments (user_id, status);

CREATE TABLE IF NOT EXISTS tournament_participants (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  avatar_id     INTEGER,
  alias         TEXT    NOT NULL,
  bow_category  TEXT    NOT NULL,
  color         TEXT    NOT NULL,
  experience    TEXT    NOT NULL CHECK (experience IN ('escuela','senior')),
  stake         TEXT    CHECK (stake IN ('roja','azul','amarilla') OR stake IS NULL),
  pair_index    INTEGER NOT NULL,
  pair_position TEXT    NOT NULL CHECK (pair_position IN ('A','B','C')),
  total_score    INTEGER NOT NULL DEFAULT 0,
  total_inner    INTEGER NOT NULL DEFAULT 0,
  total_second   INTEGER NOT NULL DEFAULT 0,
  total_x        INTEGER NOT NULL DEFAULT 0,
  total_m        INTEGER NOT NULL DEFAULT 0,
  ends_completed INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
  FOREIGN KEY (avatar_id)     REFERENCES avatars     (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_participants_tournament ON tournament_participants (tournament_id);

CREATE TABLE IF NOT EXISTS rounds (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id  INTEGER NOT NULL,
  seq            INTEGER NOT NULL,
  arrows_per_end INTEGER NOT NULL,
  status         TEXT    NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','en_proceso','completa')),
  created_at     INTEGER NOT NULL,
  completed_at   INTEGER,
  FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
  UNIQUE (tournament_id, seq)
);

CREATE TABLE IF NOT EXISTS round_scores (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id       INTEGER NOT NULL,
  participant_id INTEGER NOT NULL,
  tournament_id  INTEGER NOT NULL,
  arrows         TEXT    NOT NULL,
  end_total      INTEGER NOT NULL,
  inner_count    INTEGER NOT NULL DEFAULT 0,
  second_count   INTEGER NOT NULL DEFAULT 0,
  x_count        INTEGER NOT NULL DEFAULT 0,
  m_count        INTEGER NOT NULL DEFAULT 0,
  status         TEXT    NOT NULL DEFAULT 'completa' CHECK (status IN ('pendiente','completa')),
  updated_at     INTEGER NOT NULL,
  FOREIGN KEY (round_id)       REFERENCES rounds                  (id) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES tournament_participants (id) ON DELETE CASCADE,
  FOREIGN KEY (tournament_id)  REFERENCES tournaments             (id) ON DELETE CASCADE,
  UNIQUE (round_id, participant_id)
);
CREATE INDEX IF NOT EXISTS idx_scores_round       ON round_scores (round_id);
CREATE INDEX IF NOT EXISTS idx_scores_participant ON round_scores (participant_id);
`;
