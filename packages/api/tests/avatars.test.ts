import type { Avatar } from '@bv/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createDb } from '../src/db/connection';
import { type App, type Jar, cookieHeader, jsonReq, registerUser } from './helpers';

const NEW_AVATAR = {
  alias: 'Brai',
  bowCategory: 'recurvo_olimpico',
  color: 'blue',
  beginner: true,
};

describe('avatars', () => {
  let app: App;
  let jar: Jar;

  beforeEach(async () => {
    app = createApp(createDb(':memory:'));
    jar = await registerUser(app);
  });

  async function create(body: unknown = NEW_AVATAR): Promise<Response> {
    return jsonReq(app, '/api/avatars', 'POST', body, jar);
  }

  it('crea un avatar (201) y mapea beginner → escuela', async () => {
    const res = await create();
    expect(res.status).toBe(201);
    const a = (await res.json()) as Avatar;
    expect(a.alias).toBe('Brai');
    expect(a.experience).toBe('escuela');
  });

  it('lista solo los avatares del usuario', async () => {
    await create();
    const res = await app.request('/api/avatars', { headers: { cookie: cookieHeader(jar) } });
    const list = (await res.json()) as Avatar[];
    expect(list).toHaveLength(1);
  });

  it('PATCH actualiza y recalcula la experiencia', async () => {
    const id = ((await (await create()).json()) as Avatar).id;
    const res = await jsonReq(app, `/api/avatars/${id}`, 'PATCH', { beginner: false }, jar);
    expect(res.status).toBe(200);
    expect(((await res.json()) as Avatar).experience).toBe('senior');
  });

  it('DELETE archiva (desaparece de la lista)', async () => {
    const id = ((await (await create()).json()) as Avatar).id;
    const del = await jsonReq(app, `/api/avatars/${id}`, 'DELETE', null, jar);
    expect(del.status).toBe(204);
    const list = (await (
      await app.request('/api/avatars', { headers: { cookie: cookieHeader(jar) } })
    ).json()) as Avatar[];
    expect(list).toHaveLength(0);
  });

  it('rechaza mutación sin CSRF (403)', async () => {
    const res = await app.request('/api/avatars', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: `bv_session=${jar.bv_session}` },
      body: JSON.stringify(NEW_AVATAR),
    });
    expect(res.status).toBe(403);
  });

  it('rechaza color y categoría inválidos (400)', async () => {
    expect((await create({ ...NEW_AVATAR, color: 'nope' })).status).toBe(400);
    expect((await create({ ...NEW_AVATAR, bowCategory: 'ballesta' })).status).toBe(400);
  });

  it('requiere sesión (401 sin cookie)', async () => {
    const res = await app.request('/api/avatars');
    expect(res.status).toBe(401);
  });

  it('respeta ownership: otro usuario no ve el avatar (404)', async () => {
    const id = ((await (await create()).json()) as Avatar).id;
    const jar2 = await registerUser(app, 'otro');
    const res = await app.request(`/api/avatars/${id}`, {
      headers: { cookie: cookieHeader(jar2) },
    });
    expect(res.status).toBe(404);
  });
});
