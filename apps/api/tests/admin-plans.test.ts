import { describe, it, expect, beforeAll } from 'vitest';
import { http, login, waitForApi } from './setup.js';

const SUPER = process.env.SEED_SUPERADMIN_EMAIL ?? 'admin@nexo.local';
const PASS = process.env.SEED_SUPERADMIN_PASSWORD ?? 'NexoAdmin2026!';

describe('admin/plans', () => {
  beforeAll(async () => { await waitForApi(); });

  it('GET /plans público lista 4 planes', async () => {
    const r = await http('/plans');
    expect(r.status).toBe(200);
    expect(r.data.plans.length).toBeGreaterThanOrEqual(4);
    const keys = r.data.plans.map((p: any) => p.key);
    expect(keys).toEqual(expect.arrayContaining(['free_trial', 'standard', 'pro', 'enterprise']));
  });

  it('GET /admin/plans requiere super-admin', async () => {
    const cookieClient = await login('admin@demo.local', 'Demo2026!');
    const r = await http('/admin/plans', { cookie: cookieClient });
    expect(r.status).toBe(403);
  });

  it('PUT /admin/plans/:id actualiza fields', async () => {
    const cookie = await login(SUPER, PASS);
    const list = await http('/admin/plans', { cookie });
    const standard = list.data.plans.find((p: any) => p.key === 'standard');
    expect(standard).toBeDefined();
    const newTagline = `Test ${Date.now()}`;
    const upd = await http(`/admin/plans/${standard.id}`, { method: 'PUT', cookie, json: { tagline: newTagline } });
    expect(upd.status).toBe(200);
    expect(upd.data.plan.tagline).toBe(newTagline);
    // Restaurar
    await http(`/admin/plans/${standard.id}`, { method: 'PUT', cookie, json: { tagline: 'Para empresas en crecimiento' } });
  });

  it('POST /admin/plans crea + DELETE limpia', async () => {
    const cookie = await login(SUPER, PASS);
    const key = `t_${Date.now()}`;
    const create = await http('/admin/plans', {
      method: 'POST', cookie,
      json: { key, name: 'Temp', modules: ['vehicles'], highlights: ['demo'] },
    });
    expect(create.status).toBe(200);
    const del = await http(`/admin/plans/${create.data.plan.id}`, { method: 'DELETE', cookie });
    expect(del.status).toBe(200);
  });
});
