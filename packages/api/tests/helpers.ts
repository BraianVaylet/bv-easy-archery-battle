import type { createApp } from '../src/app';

export type App = ReturnType<typeof createApp>;
export type Jar = Record<string, string>;

export function readCookies(res: Response, jar: Jar): void {
  for (const sc of res.headers.getSetCookie()) {
    const pair = sc.split(';')[0] ?? '';
    const idx = pair.indexOf('=');
    if (idx > 0) jar[pair.slice(0, idx)] = pair.slice(idx + 1);
  }
}

export function cookieHeader(jar: Jar): string {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

export async function jsonReq(
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

export async function registerUser(app: App, alias = 'brai'): Promise<Jar> {
  const jar: Jar = {};
  const res = await jsonReq(app, '/api/auth/register', 'POST', {
    alias,
    password: 'archery123',
    securityQuestionId: 3,
    securityAnswer: 'Firulais',
  });
  readCookies(res, jar);
  return jar;
}
