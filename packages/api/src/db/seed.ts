/**
 * Seed de desarrollo. En BE-1 solo asegura los catálogos (sembrados al abrir la
 * conexión) e informa el estado. Los datos demo (usuario + torneo de ejemplo) se
 * agregan cuando existan los servicios de auth/avatar/torneo (post BE-3).
 */

import { env } from '../env';
import { createDb } from './connection';

const db = createDb();

const count = (table: string): number =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

console.log('🌱 Catálogos sembrados:');
console.log(`   categorías: ${count('bow_categories')}`);
console.log(`   modalidades: ${count('modalities')}`);
console.log(`   colores: ${count('colors')}`);
console.log(`   (DB: ${env.DATABASE_PATH})`);

db.close();
