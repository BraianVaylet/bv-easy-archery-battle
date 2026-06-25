/**
 * Siembra de catálogos (categorías, modalidades, colores) desde @bv/shared,
 * única fuente de verdad. Idempotente (upsert por `key`). Se ejecuta al abrir
 * la conexión, así app y tests siempre tienen los catálogos disponibles.
 */

import {
  AVATAR_COLORS,
  BOW_CATEGORIES,
  BOW_CATEGORY_LABELS,
  DEFAULT_ARROWS,
  DEFAULT_ROUNDS,
  MODALITIES,
  MODALITY_LABELS,
  SCORING,
} from '@bv/shared';
import type { DB } from './connection';

export function seedCatalog(db: DB): void {
  const cat = db.prepare(
    `INSERT INTO bow_categories (key, label, sort) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET label = excluded.label, sort = excluded.sort`,
  );
  BOW_CATEGORIES.forEach((key, i) => cat.run(key, BOW_CATEGORY_LABELS[key], i));

  const mod = db.prepare(
    `INSERT INTO modalities (key, label, default_arrows, max_per_arrow, scoring_set, default_rounds)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       label = excluded.label,
       default_arrows = excluded.default_arrows,
       max_per_arrow = excluded.max_per_arrow,
       scoring_set = excluded.scoring_set,
       default_rounds = excluded.default_rounds`,
  );
  for (const key of MODALITIES) {
    const cfg = SCORING[key];
    mod.run(
      key,
      MODALITY_LABELS[key],
      DEFAULT_ARROWS[key],
      cfg.maxPerArrow,
      JSON.stringify(cfg.tokens),
      DEFAULT_ROUNDS,
    );
  }

  const col = db.prepare(
    `INSERT INTO colors (key, label, hex, sort) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET label = excluded.label, hex = excluded.hex, sort = excluded.sort`,
  );
  AVATAR_COLORS.forEach((c, i) => col.run(c.key, c.label, c.hex, i));
}
