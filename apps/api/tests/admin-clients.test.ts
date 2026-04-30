import { describe, it, expect, beforeAll } from 'vitest';
import { http, login, waitForApi } from './setup.js';

const SUPER_EMAIL = process.env.SEED_SUPERADMIN_EMAIL ?? 'admin@nexo.local';
const SUPER_PASS = process.env.SEED_SUPERADMIN_PASSWORD ?? 'NexoAdmin2026!';

describe('admin/clients (super-admin)', () => {
  beforeAll(async () => {
    await waitForApi();
  });

  it('lista clientes para super-admin', async () => {
    const cookie = await login(SUPER_EMAIL, SUPER_PASS);
    const r = await http('/admin/clients', { cookie });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.data.clients)).toBe(true);
  });

  it('rechaza tenant_admin (403)', async () => {
    const cookie = await login('admin@demo.local', 'Demo2026!');
    const r = await http('/admin/clients', { cookie });
    expect(r.status).toBe(403);
  });

  it('crea cliente con plan, módulos y trial parametrizado', async () => {
    const cookie = await login(SUPER_EMAIL, SUPER_PASS);
    const slug = `tc-${Date.now()}`;
    const r = await http('/admin/clients', {
      method: 'POST',
      cookie,
      json: {
        tenantName: `TestClient ${slug}`,
        adminName: 'Test Admin',
        adminEmail: `admin-${slug}@test.local`,
        plan: 'pro',
        trialDays: 60,
        modules: ['vehicles', 'drivers', 'owners'],
      },
    });
    expect(r.status).toBe(200);
    expect(r.data.activationToken).toBeDefined();
    expect(r.data.tenant.name).toBe(`TestClient ${slug}`);
  });

  it('extiende suscripción con días extra', async () => {
    const cookie = await login(SUPER_EMAIL, SUPER_PASS);
    const list = await http('/admin/clients', { cookie });
    const target = list.data.clients.find((c: any) => c.subscription);
    if (!target) return;
    const r = await http(`/admin/clients/${target.id}/extend-subscription`, {
      method: 'POST', cookie, json: { days: 7 },
    });
    expect(r.status).toBe(200);
  });
});
