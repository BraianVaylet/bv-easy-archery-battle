import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '../lib/queryClient';
import { useAuth } from './useAuth';

function wrapper() {
  const qc = createQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function mockFetch(status: number, jsonData: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => jsonData }),
  );
}

describe('useAuth', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('resuelve la sesión cuando /auth/me responde', async () => {
    mockFetch(200, { user: { id: 7, alias: 'brai' } });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toEqual({ id: 7, alias: 'brai' });
  });

  it('devuelve user null en 401', async () => {
    mockFetch(401, { error: { code: 'UNAUTHENTICATED', message: 'no' } });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });
});
