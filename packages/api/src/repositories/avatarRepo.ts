import type { Avatar, BowCategory, Experience } from '@bv/shared';
import type { DB } from '../db/connection';
import { now } from '../lib/time';

interface AvatarRow {
  id: number;
  alias: string;
  bow_category: string;
  color: string;
  experience: string;
  created_at: number;
  updated_at: number;
}

const toAvatar = (r: AvatarRow): Avatar => ({
  id: r.id,
  alias: r.alias,
  bowCategory: r.bow_category as BowCategory,
  color: r.color,
  experience: r.experience as Experience,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export interface AvatarFields {
  alias: string;
  bowCategory: BowCategory;
  color: string;
  experience: Experience;
}

export function createAvatarRepo(db: DB) {
  const list = db.prepare<[number], AvatarRow>(
    'SELECT * FROM avatars WHERE user_id = ? AND archived_at IS NULL ORDER BY updated_at DESC',
  );
  const findOwned = db.prepare<[number, number], AvatarRow>(
    'SELECT * FROM avatars WHERE id = ? AND user_id = ? AND archived_at IS NULL',
  );
  const insert = db.prepare(
    `INSERT INTO avatars (user_id, alias, bow_category, color, experience, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
  );
  const updateStmt = db.prepare(
    `UPDATE avatars SET alias = ?, bow_category = ?, color = ?, experience = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
  );
  const listArchived = db.prepare<[number], AvatarRow>(
    'SELECT * FROM avatars WHERE user_id = ? AND archived_at IS NOT NULL ORDER BY updated_at DESC',
  );
  const archiveStmt = db.prepare(
    'UPDATE avatars SET archived_at = ? WHERE id = ? AND user_id = ? AND archived_at IS NULL',
  );
  const unarchiveStmt = db.prepare(
    'UPDATE avatars SET archived_at = NULL, updated_at = ? WHERE id = ? AND user_id = ? AND archived_at IS NOT NULL',
  );

  return {
    list(userId: number): Avatar[] {
      return list.all(userId).map(toAvatar);
    },
    listArchived(userId: number): Avatar[] {
      return listArchived.all(userId).map(toAvatar);
    },
    findOwned(userId: number, id: number): Avatar | undefined {
      const r = findOwned.get(id, userId);
      return r ? toAvatar(r) : undefined;
    },
    create(userId: number, fields: AvatarFields): Avatar {
      const ts = now();
      const row = insert.get(
        userId,
        fields.alias,
        fields.bowCategory,
        fields.color,
        fields.experience,
        ts,
        ts,
      ) as AvatarRow;
      return toAvatar(row);
    },
    update(userId: number, id: number, fields: AvatarFields): Avatar | undefined {
      const current = findOwned.get(id, userId);
      if (!current) return undefined;
      updateStmt.run(
        fields.alias,
        fields.bowCategory,
        fields.color,
        fields.experience,
        now(),
        id,
        userId,
      );
      const updated = findOwned.get(id, userId);
      return updated ? toAvatar(updated) : undefined;
    },
    archive(userId: number, id: number): boolean {
      return archiveStmt.run(now(), id, userId).changes > 0;
    },
    unarchive(userId: number, id: number): boolean {
      return unarchiveStmt.run(now(), id, userId).changes > 0;
    },
  };
}

export type AvatarRepo = ReturnType<typeof createAvatarRepo>;
