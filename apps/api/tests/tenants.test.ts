import { describe, it, expect, beforeAll } from 'vitest';
import { http, login, waitForApi } from './setup.js';

describe('tenants', () => {
  beforeAll(async () => {
    await waitForApi();
  });

  it('GET /tenants/me devuelve datos del tenant del usuario', async () => {
    const cookie = await login('admin@demo.local', 'Demo2026!');
    const r = await http('/tenants/me', { cookie });
    expect(r.status).toBe(200);
    expect(r.data.tenant.slug).toBe('demo');
  });

  it('super admin puede listar todos los tenants', async () => {
    const cookie = await login(
      process.env.SEED_SUPERADMIN_EMAIL ?? 'admin@nexo.local',
      process.env.SEED_SUPERADMIN_PASSWORD ?? 'NexoAdmin2026!',
    );
    const r = await http('/tenants', { cookie });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.data.tenants)).toBe(true);
    expect(r.data.tenants.length).toBeGreaterThanOrEqual(1); // demo (system excluido)
  });

  it('tenant_admin NO puede listar todos los tenants (403)', async () => {
    const cookie = await login('admin@demo.local', 'Demo2026!');
    const r = await http('/tenants', { cookie });
    expect(r.status).toBe(403);
  });
});
