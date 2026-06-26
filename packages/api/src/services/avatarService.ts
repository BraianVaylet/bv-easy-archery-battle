import type { Avatar, AvatarCreateInput, AvatarUpdateInput, Experience } from '@bv/shared';
import { notFound } from '../lib/errors';
import type { AvatarRepo } from '../repositories/avatarRepo';

const NOT_FOUND = 'El avatar no existe.';

const experienceOf = (beginner: boolean | undefined): Experience =>
  beginner ? 'escuela' : 'senior';

export function createAvatarService(repo: AvatarRepo) {
  return {
    list(userId: number): Avatar[] {
      return repo.list(userId);
    },
    listArchived(userId: number): Avatar[] {
      return repo.listArchived(userId);
    },
    get(userId: number, id: number): Avatar {
      const a = repo.findOwned(userId, id);
      if (!a) throw notFound(NOT_FOUND);
      return a;
    },
    create(userId: number, input: AvatarCreateInput): Avatar {
      return repo.create(userId, {
        alias: input.alias,
        bowCategory: input.bowCategory,
        color: input.color,
        experience: experienceOf(input.beginner),
      });
    },
    update(userId: number, id: number, patch: AvatarUpdateInput): Avatar {
      const current = repo.findOwned(userId, id);
      if (!current) throw notFound(NOT_FOUND);
      const experience =
        patch.beginner === undefined ? current.experience : experienceOf(patch.beginner);
      const updated = repo.update(userId, id, {
        alias: patch.alias ?? current.alias,
        bowCategory: patch.bowCategory ?? current.bowCategory,
        color: patch.color ?? current.color,
        experience,
      });
      if (!updated) throw notFound(NOT_FOUND);
      return updated;
    },
    archive(userId: number, id: number): void {
      if (!repo.archive(userId, id)) throw notFound(NOT_FOUND);
    },
    unarchive(userId: number, id: number): Avatar {
      if (!repo.unarchive(userId, id)) throw notFound(NOT_FOUND);
      const restored = repo.findOwned(userId, id);
      if (!restored) throw notFound(NOT_FOUND);
      return restored;
    },
  };
}

export type AvatarService = ReturnType<typeof createAvatarService>;
