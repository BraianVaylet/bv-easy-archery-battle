import type { DB } from '../db/connection';
import { createAvatarRepo } from '../repositories/avatarRepo';
import { createCatalogRepo } from '../repositories/catalogRepo';
import { createScoreRepo } from '../repositories/scoreRepo';
import { createTournamentRepo } from '../repositories/tournamentRepo';
import { createUserRepo } from '../repositories/userRepo';
import { createAuthService } from './authService';
import { createAvatarService } from './avatarService';
import { createScoreService } from './scoreService';
import { createTournamentService } from './tournamentService';

/** Construye repos + services a partir de una conexión. Facilita la inyección en tests. */
export function createServices(db: DB) {
  const userRepo = createUserRepo(db);
  const avatarRepo = createAvatarRepo(db);
  const catalogRepo = createCatalogRepo(db);
  const tournamentRepo = createTournamentRepo(db);
  const scoreRepo = createScoreRepo(db);

  return {
    auth: createAuthService(db, userRepo),
    avatar: createAvatarService(avatarRepo),
    catalog: catalogRepo,
    tournament: createTournamentService(tournamentRepo, avatarRepo),
    score: createScoreService(scoreRepo),
    // podium / stats se agregan en BE-9+.
  };
}

export type Services = ReturnType<typeof createServices>;
