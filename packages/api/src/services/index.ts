import type { DB } from '../db/connection';
import { createAvatarRepo } from '../repositories/avatarRepo';
import { createCatalogRepo } from '../repositories/catalogRepo';
import { createUserRepo } from '../repositories/userRepo';
import { createAuthService } from './authService';
import { createAvatarService } from './avatarService';

/** Construye repos + services a partir de una conexión. Facilita la inyección en tests. */
export function createServices(db: DB) {
  const userRepo = createUserRepo(db);
  const avatarRepo = createAvatarRepo(db);
  const catalogRepo = createCatalogRepo(db);

  return {
    auth: createAuthService(db, userRepo),
    avatar: createAvatarService(avatarRepo),
    catalog: catalogRepo,
    // tournament / scoring / podium / stats se agregan en BE-6+.
  };
}

export type Services = ReturnType<typeof createServices>;
