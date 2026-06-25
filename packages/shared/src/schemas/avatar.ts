import { z } from 'zod';
import { LIMITS } from '../constants';
import { AVATAR_COLOR_KEYS, BOW_CATEGORIES } from '../domain';

const alias = z
  .string()
  .trim()
  .min(LIMITS.avatarAlias.min, 'Ingresá un alias.')
  .max(LIMITS.avatarAlias.max, `Máximo ${LIMITS.avatarAlias.max} caracteres.`);

const color = z
  .string()
  .refine((v) => (AVATAR_COLOR_KEYS as readonly string[]).includes(v), 'Color inválido.');

export const avatarCreateSchema = z
  .object({
    alias,
    bowCategory: z.enum(BOW_CATEGORIES),
    color,
    beginner: z.boolean().optional(),
  })
  .strict();

export const avatarUpdateSchema = avatarCreateSchema.partial().strict();

export type AvatarCreateInput = z.infer<typeof avatarCreateSchema>;
export type AvatarUpdateInput = z.infer<typeof avatarUpdateSchema>;
