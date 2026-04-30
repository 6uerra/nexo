import { describe, it, expect, beforeAll } from 'vitest';
import { http, login, waitForApi } from './setup.js';

const SUPER_EMAIL = process.env.SEED_SUPERADMIN_EMAIL ?? 'admin@nexo.local';
const SUPER_PASS = process.env.SEED_SUPERADMIN_PASSWORD ?? 'NexoAdmin2026!';

describe('magic link activation', () => {
  beforeAll(async () => {
    await waitForApi();
  });

  it('flujo completo: super crea cliente → activa → puede loguear', async () => {
    const superCookie = await login(SUPER_EMAIL, SUPER_PASS);
    const slug = `act-${Date.now()}`;
    const email = `admin-${slug}@test.local`;

    const created = await http('/admin/clients', {
      method: 'POST', cookie: superCookie,
      json: {
        tenantName: `Activate ${slug}`,
        adminName: 'New Admin',
        adminEmail: email,
        plan: 'free_trial', trialDays: 30,
      },
    });
    expect(created.status).toBe(200);
    const token = created.data.activationToken;
    expect(token).toBeTruthy();

    const activated = await http('/auth/activate', {
      method: 'POST',
      json: { token, password: 'NewPassword123!' },
    });
    expect(activated.status).toBe(200);
    expect(activated.data.session.email).toBe(email);

    // Y ahora puede loguear con esa contraseña
    const loginRes = await http('/auth/login', {
      method: 'POST', json: { email, password: 'NewPassword123!' },
    });
    expect(loginRes.status).toBe(200);
  });

  it('rechaza token inválido', async () => {
    const r = await http('/auth/activate', { method: 'POST', json: { token: 'a'.repeat(43), password: 'Whatever123' } });
    expect(r.status).toBe(400);
  });

  it('forgot-password siempre 200 (no filtra emails)', async () => {
    const r1 = await http('/auth/forgot-password', { method: 'POST', json: { email: 'admin@demo.local' } });
    expect(r1.status).toBe(200);
    const r2 = await http('/auth/forgot-password', { method: 'POST', json: { email: 'noexiste@x.com' } });
    expect(r2.status).toBe(200);
  });
});
