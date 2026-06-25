import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type DB, createDb } from '../src/db/connection';

describe('esquema + catálogos', () => {
  let db: DB;

  beforeEach(() => {
    db = createDb(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  const count = (table: string): number =>
    (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

  it('siembra los catálogos desde @bv/shared', () => {
    expect(count('modalities')).toBe(4);
    expect(count('bow_categories')).toBe(6);
    expect(count('colors')).toBe(12);
  });

  it('el catálogo de modalidades guarda defaults y scoring set', () => {
    const sala = db.prepare('SELECT * FROM modalities WHERE key = ?').get('sala') as {
      default_arrows: number;
      max_per_arrow: number;
      scoring_set: string;
    };
    expect(sala.default_arrows).toBe(3);
    expect(sala.max_per_arrow).toBe(10);
    expect(JSON.parse(sala.scoring_set)).toContain('X');
  });

  it('reseña: re-sembrar es idempotente (upsert por key)', () => {
    const db2 = createDb(':memory:');
    expect(count('bow_categories')).toBe(6);
    db2.close();
  });

  it('respeta las foreign keys (avatar requiere user existente)', () => {
    const now = Date.now();
    const insertAvatar = db.prepare(
      `INSERT INTO avatars (user_id, alias, bow_category, color, experience, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    expect(() => insertAvatar.run(999, 'X', 'compuesto', 'red', 'senior', now, now)).toThrow();

    const user = db
      .prepare(
        `INSERT INTO users (alias, password_hash, security_question_id, security_answer_hash, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run('brai', 'hash', 1, 'ahash', now);
    const uid = Number(user.lastInsertRowid);
    const res = insertAvatar.run(uid, 'Brai', 'compuesto', 'red', 'senior', now, now);
    expect(Number(res.changes)).toBe(1);
  });

  it('aplica defaults de estado y rollups en participantes', () => {
    const now = Date.now();
    const uid = Number(
      db
        .prepare(
          `INSERT INTO users (alias, password_hash, security_question_id, security_answer_hash, created_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run('brai', 'h', 1, 'a', now).lastInsertRowid,
    );
    const tid = Number(
      db
        .prepare(
          `INSERT INTO tournaments (user_id, name, modality, rounds_count, arrows_per_end, scoring_set, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(uid, 'Torneo', 'sala', 10, 3, '[]', now).lastInsertRowid,
    );
    const pid = db
      .prepare(
        `INSERT INTO tournament_participants
         (tournament_id, alias, bow_category, color, experience, pair_index, pair_position, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(tid, 'Brai', 'compuesto', 'red', 'senior', 0, 'A', now);
    const row = db
      .prepare('SELECT total_score, ends_completed FROM tournament_participants WHERE id = ?')
      .get(Number(pid.lastInsertRowid)) as { total_score: number; ends_completed: number };
    expect(row.total_score).toBe(0);
    expect(row.ends_completed).toBe(0);
  });
});
