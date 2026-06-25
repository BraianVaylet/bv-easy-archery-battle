import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';

const OPTS = { algorithm: 2 /* argon2id */ } as const;

/** Hash de contraseña con argon2id. */
export function hashSecret(secret: string): Promise<string> {
  return argonHash(secret, OPTS);
}

/** Verifica un secreto (password / respuesta de recuperación) contra su hash. */
export async function verifySecret(hash: string, secret: string): Promise<boolean> {
  try {
    return await argonVerify(hash, secret, OPTS);
  } catch {
    return false;
  }
}

/** Hash dummy para igualar el tiempo de respuesta cuando el alias no existe. */
let dummy: string | null = null;
export async function getDummyHash(): Promise<string> {
  if (!dummy) dummy = await hashSecret('timing-attack-mitigation-dummy');
  return dummy;
}
