/**
 * Aplica el esquema y los catálogos a la DB configurada.
 * El esquema es idempotente (CREATE TABLE IF NOT EXISTS); seguro de re-ejecutar.
 */

import { env } from '../env';
import { createDb } from './connection';

const db = createDb();
db.close();
console.log(`✅ Esquema + catálogos aplicados en ${env.DATABASE_PATH}`);
