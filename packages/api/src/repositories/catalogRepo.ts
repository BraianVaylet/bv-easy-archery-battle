import type { Catalog } from '@bv/shared';
import type { DB } from '../db/connection';

interface ModalityRow {
  key: string;
  label: string;
  default_arrows: number;
  max_per_arrow: number;
  scoring_set: string;
  default_rounds: number;
}

/** Lee los catálogos sembrados (categorías, modalidades, colores). */
export function createCatalogRepo(db: DB) {
  const bowCategories = db.prepare('SELECT key, label FROM bow_categories ORDER BY sort');
  const modalities = db.prepare<[], ModalityRow>('SELECT * FROM modalities ORDER BY rowid');
  const colors = db.prepare('SELECT key, label, hex FROM colors ORDER BY sort');

  return {
    get(): Catalog {
      return {
        bowCategories: bowCategories.all() as Catalog['bowCategories'],
        modalities: modalities.all().map((m) => ({
          key: m.key,
          label: m.label,
          defaultArrows: m.default_arrows,
          maxPerArrow: m.max_per_arrow,
          scoringSet: JSON.parse(m.scoring_set) as string[],
          defaultRounds: m.default_rounds,
        })),
        colors: colors.all() as Catalog['colors'],
      };
    },
  };
}

export type CatalogRepo = ReturnType<typeof createCatalogRepo>;
