import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createDb } from '../src/db/connection';

type App = ReturnType<typeof createApp>;
type Jar = Record<string, string>;

function readCookies(res: Response, jar: Jar): void {
  for (const sc of res.headers.getSetCookie()) {
    const pair = sc.split(';')[0] ?? '';
    const idx = pair.indexOf('=');
    if (idx > 0) jar[pair.slice(0, idx)] = pair.slice(idx + 1);
  }
}

function cookieHeader(jar: Jar): string {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function jsonReq(
  app: App,
  path: string,
  method: string,
  body: unknown,
  jar?: Jar,
): Promise<Response> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (jar) {
    headers.cookie = cookieHeader(jar);
    if (jar.bv_csrf) headers['x-csrf-token'] = jar.bv_csrf;
  }
  return app.request(path, { method, headers, body: JSON.stringify(body) });
}

const REGISTER = {
  alias: 'brai',
  password: 'archery123',
  securityQuestionId: 3,
  securityAnswer: 'Firulais',
};

describe('auth', () => {
  let app: App;
  let jar: Jar;

  beforeEach(async () => {
    app = createApp(createDb(':memory:'));
    jar = {};
  });

  async function register(): Promise<Response> {
    const res = await jsonReq(app, '/api/auth/register', 'POST', REGISTER);
    readCookies(res, jar);
    return res;
  }

  it('registra y devuelve el usuario (201) + cookies de sesión y csrf', async () => {
    const res = await register();
    expect(res.status).toBe(201);
    const body = (await res.json()) as { user: { alias: string } };
    expect(body.user.alias).toBe('brai');
    expect(jar.bv_session).toBeTruthy();
    expect(jar.bv_csrf).toBeTruthy();
  });

  it('la cookie CSRF es persistente (Max-Age) y sobrevive al reinicio del navegador', async () => {
    const res = await register();
    const csrf = res.headers.getSetCookie().find((sc) => sc.startsWith('bv_csrf='));
    expect(csrf).toBeDefined();
    expect(csrf).toMatch(/Max-Age=/i);
  });

  it('GET /auth/csrf emite una cookie CSRF (rehidratación del front)', async () => {
    const res = await app.request('/api/auth/csrf');
    expect(res.status).toBe(200);
    const csrf = res.headers.getSetCookie().find((sc) => sc.startsWith('bv_csrf='));
    expect(csrf).toMatch(/Max-Age=/i);
  });

  it('rechaza alias duplicado (409)', async () => {
    await register();
    const res = await jsonReq(app, '/api/auth/register', 'POST', REGISTER);
    expect(res.status).toBe(409);
  });

  it('rechaza payload con propiedad extra (.strict → 400)', async () => {
    const res = await jsonReq(app, '/api/auth/register', 'POST', { ...REGISTER, role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('GET /me devuelve el usuario con sesión, 401 sin ella', async () => {
    await register();
    const ok = await app.request('/api/auth/me', { headers: { cookie: cookieHeader(jar) } });
    expect(ok.status).toBe(200);

    const anon = await app.request('/api/auth/me');
    expect(anon.status).toBe(401);
  });

  it('login: correcto 200, contraseña incorrecta 401', async () => {
    await register();
    const bad = await jsonReq(app, '/api/auth/login', 'POST', {
      alias: 'brai',
      password: 'wrongpass',
    });
    expect(bad.status).toBe(401);

    const good = await jsonReq(app, '/api/auth/login', 'POST', {
      alias: 'brai',
      password: 'archery123',
    });
    expect(good.status).toBe(200);
  });

  it('logout exige CSRF: sin token 403, con token 204', async () => {
    await register();
    const noCsrf = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { cookie: `bv_session=${jar.bv_session}` },
    });
    expect(noCsrf.status).toBe(403);

    const ok = await jsonReq(app, '/api/auth/logout', 'POST', {}, jar);
    expect(ok.status).toBe(204);
  });

  it('alias-available refleja el estado', async () => {
    const free = await app.request('/api/auth/alias-available?alias=brai');
    expect(((await free.json()) as { available: boolean }).available).toBe(true);
    await register();
    const taken = await app.request('/api/auth/alias-available?alias=brai');
    expect(((await taken.json()) as { available: boolean }).available).toBe(false);
  });

  it('recuperación: pregunta + reset y login con la nueva contraseña', async () => {
    await register();
    const q = await app.request('/api/auth/recovery/brai');
    expect(q.status).toBe(200);
    expect(((await q.json()) as { question: { id: number } }).question.id).toBe(3);

    const reset = await jsonReq(app, '/api/auth/recovery', 'POST', {
      alias: 'brai',
      answer: 'firulais',
      newPassword: 'newpass456',
    });
    expect(reset.status).toBe(200);

    const login = await jsonReq(app, '/api/auth/login', 'POST', {
      alias: 'brai',
      password: 'newpass456',
    });
    expect(login.status).toBe(200);
  });
});
