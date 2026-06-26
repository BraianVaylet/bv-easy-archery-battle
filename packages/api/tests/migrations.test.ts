import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { runFixups } from '../src/db/migrations';
import { SCHEMA_SQL } from '../src/db/schema';

const OLD_TABLE = `
CREATE TABLE tournament_participants (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  avatar_id     INTEGER,
  alias         TEXT    NOT NULL,
  bow_category  TEXT    NOT NULL,
  color         TEXT    NOT NULL,
  experience    TEXT    NOT NULL CHECK (experience IN ('escuela','senior')),
  stake         TEXT    CHECK (stake IN ('roja','azul','amarilla') OR stake IS NULL),
  pair_index    INTEGER NOT NULL,
  pair_position TEXT    NOT NULL CHECK (pair_position IN ('A','B')),
  total_score    INTEGER NOT NULL DEFAULT 0,
  total_inner    INTEGER NOT NULL DEFAULT 0,
  total_second   INTEGER NOT NULL DEFAULT 0,
  total_x        INTEGER NOT NULL DEFAULT 0,
  total_m        INTEGER NOT NULL DEFAULT 0,
  ends_completed INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);`;

const insertParticipant = (db: Database.Database, pos: string) =>
  db
    .prepare(
      `INSERT INTO tournament_participants
       (tournament_id, alias, bow_category, color, experience, pair_index, pair_position, created_at)
       VALUES (1, 'X', 'raso', 'red', 'senior', 0, ?, 0)`,
    )
    .run(pos);

describe('runFixups — pair_position drift', () => {
  function dbWithOldConstraint(): Database.Database {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = OFF');
    db.exec(SCHEMA_SQL);
    db.exec('DROP TABLE tournament_participants');
    db.exec(OLD_TABLE);
    return db;
  }

  it("reconstruye la tabla a CHECK ('A','B','C') preservando datos", () => {
    const db = dbWithOldConstraint();
    insertParticipant(db, 'A'); // fila previa válida en el esquema viejo

    // En el esquema viejo, 'C' (trío) es rechazado.
    expect(() => insertParticipant(db, 'C')).toThrow();

    runFixups(db);

    const sql = (
      db
        .prepare(
          "SELECT sql FROM sqlite_master WHERE type='table' AND name='tournament_participants'",
        )
        .get() as { sql: string }
    ).sql;
    expect(sql).toContain("'A','B','C'");

    db.pragma('foreign_keys = OFF');
    expect(() => insertParticipant(db, 'C')).not.toThrow();
    const count = (
      db.prepare('SELECT COUNT(*) AS n FROM tournament_participants').get() as { n: number }
    ).n;
    expect(count).toBe(2); // la fila 'A' previa + la nueva 'C'
  });

  it('es idempotente sobre un esquema ya correcto (no-op)', () => {
    const db = new Database(':memory:');
    db.exec(SCHEMA_SQL);
    expect(() => runFixups(db)).not.toThrow();
    runFixups(db); // segunda pasada, sigue ok
    db.pragma('foreign_keys = OFF');
    expect(() => insertParticipant(db, 'C')).not.toThrow();
  });
});

const OLD_ROUNDS = `
CREATE TABLE rounds (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id  INTEGER NOT NULL,
  seq            INTEGER NOT NULL,
  arrows_per_end INTEGER NOT NULL,
  status         TEXT    NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','completa')),
  created_at     INTEGER NOT NULL,
  completed_at   INTEGER,
  UNIQUE (tournament_id, seq)
);`;

const insertRound = (db: Database.Database, status: string) =>
  db
    .prepare(
      'INSERT INTO rounds (tournament_id, seq, arrows_per_end, status, created_at) VALUES (1, 1, 3, ?, 0)',
    )
    .run(status);

describe('runFixups — rounds.status drift', () => {
  it("agrega 'en_proceso' preservando datos", () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = OFF');
    db.exec(SCHEMA_SQL);
    db.exec('DROP TABLE round_scores');
    db.exec('DROP TABLE rounds');
    db.exec(OLD_ROUNDS);
    insertRound(db, 'completa');

    expect(() => insertRound(db, 'en_proceso')).toThrow();
    runFixups(db);

    const sql = (
      db.prepare("SELECT sql FROM sqlite_master WHERE name='rounds'").get() as { sql: string }
    ).sql;
    expect(sql).toContain("'en_proceso'");
    db.pragma('foreign_keys = OFF');
    db.exec('UPDATE rounds SET seq = 2 WHERE seq = 1'); // libera el UNIQUE
    expect(() => insertRound(db, 'en_proceso')).not.toThrow();
  });
});
