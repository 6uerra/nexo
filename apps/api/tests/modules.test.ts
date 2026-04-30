import { describe, it, expect, beforeAll } from 'vitest';
import { http, login, waitForApi } from './setup.js';

const ADMIN_EMAIL = 'admin@demo.local';
const ADMIN_PASS = 'Demo2026!';
const VIEWER_EMAIL = 'viewer@demo.local';
const VIEWER_PASS = 'Viewer2026!';

describe('modules toggle', () => {
  beforeAll(async () => {
    await waitForApi();
  });

  it('admin puede listar módulos del tenant', async () => {
    const cookie = await login(ADMIN_EMAIL, ADMIN_PASS);
    const r = await http('/modules', { cookie });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.data.modules)).toBe(true);
    expect(r.data.modules.length).toBeGreaterThan(0);
  });

  it('admin puede desactivar y reactivar un módulo', async () => {
    const cookie = await login(ADMIN_EMAIL, ADMIN_PASS);
    const me = await http('/auth/me', { cookie });
    const tenantId = me.data.session.tenantId;

    const off = await http(`/modules/${tenantId}`, {
      method: 'PUT',
      cookie,
      json: { moduleKey: 'reports', enabled: false },
    });
    expect(off.status).toBe(200);

    const list1 = await http('/modules', { cookie });
    const reports1 = list1.data.modules.find((m: any) => m.moduleKey === 'reports');
    expect(reports1.enabled).toBe(false);

    const on = await http(`/modules/${tenantId}`, {
      method: 'PUT',
      cookie,
      json: { moduleKey: 'reports', enabled: true },
    });
    expect(on.status).toBe(200);

    const list2 = await http('/modules', { cookie });
    const reports2 = list2.data.modules.find((m: any) => m.moduleKey === 'reports');
    expect(reports2.enabled).toBe(true);
  });

  it('rechaza moduleKey inválida', async () => {
    const cookie = await login(ADMIN_EMAIL, ADMIN_PASS);
    const me = await http('/auth/me', { cookie });
    const r = await http(`/modules/${me.data.session.tenantId}`, {
      method: 'PUT',
      cookie,
      json: { moduleKey: 'nonexistent_module', enabled: true },
    });
    expect(r.status).toBe(400);
  });

  it('viewer no puede togglear módulos de OTRO tenant', async () => {
    const cookie = await login(VIEWER_EMAIL, VIEWER_PASS);
    const r = await http('/modules/00000000-0000-0000-0000-000000000000', {
      method: 'PUT',
      cookie,
      json: { moduleKey: 'reports', enabled: false },
    });
    expect(r.status).toBe(403);
  });
});
