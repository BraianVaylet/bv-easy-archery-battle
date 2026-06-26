/**
 * Fix-ups idempotentes sobre DBs existentes. El esquema se aplica con
 * `CREATE TABLE IF NOT EXISTS`, que NO actualiza tablas ya creadas; cuando una
 * restricción cambia, las DBs viejas quedan desfasadas. Acá detectamos esos
 * desfases y reconstruimos la tabla preservando los datos.
 *
 * Se ejecutan al abrir la conexión, después de aplicar el esquema.
 */

import type { DB } from './connection';

export function runFixups(db: DB): void {
  fixPairPositionCheck(db);
}

/**
 * Drift: `tournament_participants.pair_position` tenía `CHECK IN ('A','B')`
 * (antes de soportar tríos con posición 'C'). Reconstruye la tabla con la
 * restricción correcta preservando filas, índices y FKs. Idempotente.
 */
function fixPairPositionCheck(db: DB): void {
  const row = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tournament_participants'")
    .get() as { sql: string } | undefined;
  // Solo actúa si está la restricción vieja (la nueva es `('A','B','C')`).
  if (!row || !row.sql.includes("pair_position IN ('A','B')")) return;

  db.exec(`
    PRAGMA foreign_keys=OFF;
    BEGIN;
    CREATE TABLE tournament_participants_new (
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
    INSERT INTO tournament_participants_new
      (id, tournament_id, avatar_id, alias, bow_category, color, experience, stake,
       pair_index, pair_position, total_score, total_inner, total_second, total_x,
       total_m, ends_completed, created_at)
      SELECT id, tournament_id, avatar_id, alias, bow_category, color, experience, stake,
       pair_index, pair_position, total_score, total_inner, total_second, total_x,
       total_m, ends_completed, created_at
      FROM tournament_participants;
    DROP TABLE tournament_participants;
    ALTER TABLE tournament_participants_new RENAME TO tournament_participants;
    CREATE INDEX IF NOT EXISTS idx_participants_tournament ON tournament_participants (tournament_id);
    COMMIT;
    PRAGMA foreign_keys=ON;
  `);
}
