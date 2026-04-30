import { describe, it, expect, beforeAll } from 'vitest';
import { http, login, waitForApi } from './setup.js';

const SUPER_EMAIL = process.env.SEED_SUPERADMIN_EMAIL ?? 'admin@nexo.local';
const SUPER_PASS = process.env.SEED_SUPERADMIN_PASSWORD ?? 'NexoAdmin2026!';
const ADMIN_EMAIL = 'admin@demo.local';
const ADMIN_PASS = 'Demo2026!';

describe('modules toggle (solo Admin)', () => {
  beforeAll(async () => {
    await waitForApi();
  });

  it('cualquier usuario autenticado puede LISTAR sus módulos', async () => {
    const cookie = await login(ADMIN_EMAIL, ADMIN_PASS);
    const r = await http('/modules', { cookie });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.data.modules)).toBe(true);
    expect(r.data.modules.length).toBeGreaterThan(0);
  });

  it('SUPER ADMIN puede desactivar y reactivar módulos de cualquier tenant', async () => {
    const adminCookie = await login(ADMIN_EMAIL, ADMIN_PASS);
    const me = await http('/auth/me', { cookie: adminCookie });
    const tenantId = me.data.session.tenantId;

    const superCookie = await login(SUPER_EMAIL, SUPER_PASS);

    const off = await http(`/modules/${tenantId}`, {
      method: 'PUT',
      cookie: superCookie,
      json: { moduleKey: 'reports', enabled: false },
    });
    expect(off.status).toBe(200);

    const list1 = await http('/modules', { cookie: adminCookie });
    const reports1 = list1.data.modules.find((m: any) => m.moduleKey === 'reports');
    expect(reports1.enabled).toBe(false);

    const on = await http(`/modules/${tenantId}`, {
      method: 'PUT',
      cookie: superCookie,
      json: { moduleKey: 'reports', enabled: true },
    });
    expect(on.status).toBe(200);
  });

  it('TENANT ADMIN no puede togglear módulos (403)', async () => {
    const cookie = await login(ADMIN_EMAIL, ADMIN_PASS);
    const me = await http('/auth/me', { cookie });
    const r = await http(`/modules/${me.data.session.tenantId}`, {
      method: 'PUT',
      cookie,
      json: { moduleKey: 'reports', enabled: false },
    });
    expect(r.status).toBe(403);
  });

  it('ADMIN: rechaza moduleKey inválida con 400', async () => {
    const cookie = await login(SUPER_EMAIL, SUPER_PASS);
    const me = await login(ADMIN_EMAIL, ADMIN_PASS).then(async (c) => {
      const r = await http('/auth/me', { cookie: c });
      return r.data.session.tenantId;
    });
    const r = await http(`/modules/${me}`, {
      method: 'PUT',
      cookie,
      json: { moduleKey: 'nonexistent_module', enabled: true },
    });
    expect(r.status).toBe(400);
  });
});
