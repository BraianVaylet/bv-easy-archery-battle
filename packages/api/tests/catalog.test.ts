import type { Catalog } from '@bv/shared';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createDb } from '../src/db/connection';

describe('catalog', () => {
  it('GET /api/catalog devuelve categorías, modalidades y colores', async () => {
    const app = createApp(createDb(':memory:'));
    const res = await app.request('/api/catalog');
    expect(res.status).toBe(200);

    const body = (await res.json()) as Catalog;
    expect(body.modalities).toHaveLength(4);
    expect(body.bowCategories).toHaveLength(6);
    expect(body.colors).toHaveLength(12);

    const sala = body.modalities.find((m) => m.key === 'sala');
    expect(sala?.defaultArrows).toBe(3);
    expect(sala?.maxPerArrow).toBe(10);
    expect(sala?.scoringSet).toContain('X');
  });
});
