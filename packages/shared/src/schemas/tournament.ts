import { z } from 'zod';
import { LIMITS } from '../constants';
import { BOW_CATEGORIES, MODALITIES } from '../domain';

const name = z
  .string()
  .trim()
  .min(LIMITS.tournamentName.min, 'Ingresá un nombre.')
  .max(LIMITS.tournamentName.max, `Máximo ${LIMITS.tournamentName.max} caracteres.`);

/** Record con una clave por estaca (roja/azul/amarilla). */
function stakeRecord<T extends z.ZodTypeAny>(value: T) {
  return z
    .object({
      roja: value,
      azul: value,
      amarilla: value,
    })
    .strict();
}

const stakeMap = stakeRecord(z.array(z.enum(BOW_CATEGORIES)));

const distance = z.number().int().min(LIMITS.distanceMeters.min).max(LIMITS.distanceMeters.max);
const distances = stakeRecord(distance);

export const tournamentCreateSchema = z
  .object({
    name,
    modality: z.enum(MODALITIES),
    roundsCount: z.number().int().min(LIMITS.rounds.min).max(LIMITS.rounds.max),
    arrowsPerEnd: z.number().int().min(LIMITS.arrowsPerEnd.min).max(LIMITS.arrowsPerEnd.max),
    stakeMap: stakeMap.optional(),
    distances: distances.optional(),
    avatarIds: z
      .array(z.number().int().positive())
      .min(LIMITS.participants.min, 'Agregá al menos un participante.')
      .max(LIMITS.participants.max, `Máximo ${LIMITS.participants.max} participantes.`)
      .refine((ids) => new Set(ids).size === ids.length, 'Hay participantes repetidos.'),
  })
  .strict();

export type TournamentCreateInput = z.infer<typeof tournamentCreateSchema>;

/** Editar un torneo en curso (por ahora, solo el nombre). */
export const tournamentUpdateSchema = z.object({ name }).strict();
export type TournamentUpdateInput = z.infer<typeof tournamentUpdateSchema>;

/** Agregar participantes (avatares) a un torneo en curso. */
export const addParticipantsSchema = z
  .object({
    avatarIds: z
      .array(z.number().int().positive())
      .min(1, 'Agregá al menos un participante.')
      .max(LIMITS.participants.max, `Máximo ${LIMITS.participants.max} participantes.`)
      .refine((ids) => new Set(ids).size === ids.length, 'Hay participantes repetidos.'),
  })
  .strict();
export type AddParticipantsInput = z.infer<typeof addParticipantsSchema>;

/**
 * Autosave de un end. Solo `arrows` (tokens): el servidor deriva total y
 * contadores con `validateEndScore`; nunca confía en valores del cliente.
 * `.strict()` rechaza `endTotal` u otros campos derivados.
 */
export const scoreSaveSchema = z
  .object({
    arrows: z.array(z.string().min(1).max(2)).min(1).max(LIMITS.arrowsPerEnd.max),
  })
  .strict();

export type ScoreSaveInput = z.infer<typeof scoreSaveSchema>;
