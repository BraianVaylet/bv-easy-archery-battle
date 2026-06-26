import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from './apiClient';

function mockFetch(res: Partial<Response> & { jsonData?: unknown }) {
  const fn = vi.fn().mockResolvedValue({
    ok: res.ok ?? true,
    status: res.status ?? 200,
    json: async () => res.jsonData,
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('apiClient', () => {
  beforeEach(() => {
    document.cookie = 'bv_csrf=tok123';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('GET no manda header CSRF', async () => {
    const fetchFn = mockFetch({ jsonData: { ok: true } });
    await api.get('/foo');
    const [url, init] = fetchFn.mock.calls[0] ?? [];
    expect(url).toBe('/api/foo');
    expect(init.method).toBe('GET');
    expect(init.headers['x-csrf-token']).toBeUndefined();
    expect(init.credentials).toBe('include');
  });

  it('POST adjunta CSRF desde la cookie y serializa el body', async () => {
    const fetchFn = mockFetch({ status: 201, jsonData: { id: 1 } });
    const out = await api.post<{ id: number }>('/foo', { a: 1 });
    const [, init] = fetchFn.mock.calls[0] ?? [];
    expect(init.method).toBe('POST');
    expect(init.headers['x-csrf-token']).toBe('tok123');
    expect(init.headers['content-type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ a: 1 });
    expect(out).toEqual({ id: 1 });
  });

  it('si falta la cookie CSRF, la pide a /auth/csrf y reintenta con el header', async () => {
    // Limpia la cookie sembrada en beforeEach.
    document.cookie = 'bv_csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    expect(document.cookie).not.toContain('bv_csrf');

    const fetchFn = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/auth/csrf') {
        document.cookie = 'bv_csrf=minted456';
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ csrfToken: 'x' }) });
      }
      return Promise.resolve({ ok: true, status: 201, json: async () => ({ id: 9 }) });
    });
    vi.stubGlobal('fetch', fetchFn);

    const out = await api.post<{ id: number }>('/foo', { a: 1 });

    expect(fetchFn.mock.calls[0]?.[0]).toBe('/api/auth/csrf');
    const postInit = fetchFn.mock.calls[1]?.[1];
    expect(postInit.method).toBe('POST');
    expect(postInit.headers['x-csrf-token']).toBe('minted456');
    expect(out).toEqual({ id: 9 });
  });

  it('204 devuelve undefined', async () => {
    mockFetch({ status: 204 });
    expect(await api.del('/foo')).toBeUndefined();
  });

  it('lanza ApiError tipado en error de la API', async () => {
    mockFetch({
      ok: false,
      status: 400,
      jsonData: { error: { code: 'VALIDATION_ERROR', message: 'Campos inválidos' } },
    });
    await expect(api.post('/foo', {})).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Campos inválidos',
    });
    await expect(api.post('/foo', {})).rejects.toBeInstanceOf(ApiError);
  });
});
