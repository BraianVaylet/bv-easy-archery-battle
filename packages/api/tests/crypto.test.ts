import { describe, expect, it } from 'vitest';
import { hashSecret, verifySecret } from '../src/lib/hash';
import { randomToken, safeEqual, sha256 } from '../src/lib/tokens';

describe('tokens', () => {
  it('sha256 es determinista y sensible al input', () => {
    expect(sha256('abc')).toBe(sha256('abc'));
    expect(sha256('abc')).not.toBe(sha256('abd'));
  });

  it('randomToken genera hex de la longitud esperada', () => {
    expect(randomToken(16)).toHaveLength(32);
    expect(randomToken()).toHaveLength(64);
  });

  it('safeEqual compara en tiempo constante', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'ab')).toBe(false);
  });
});

describe('hash argon2id', () => {
  it('hashea y verifica un secreto', async () => {
    const h = await hashSecret('archery123');
    expect(h).not.toBe('archery123');
    expect(await verifySecret(h, 'archery123')).toBe(true);
    expect(await verifySecret(h, 'wrong')).toBe(false);
  });
});
