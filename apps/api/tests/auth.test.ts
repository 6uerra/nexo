import { describe, it, expect, beforeAll } from 'vitest';
import { http, login, waitForApi } from './setup.js';

const SUPER_EMAIL = process.env.SEED_SUPERADMIN_EMAIL ?? 'admin@nexo.local';
const SUPER_PASS = process.env.SEED_SUPERADMIN_PASSWORD ?? 'NexoAdmin2026!';

describe('auth', () => {
  beforeAll(async () => {
    await waitForApi();
  });

  it('rechaza login con credenciales inválidas', async () => {
    const r = await http('/auth/login', { method: 'POST', json: { email: 'no@existe.com', password: 'wrong-password' } });
    expect(r.status).toBe(401);
  });

  it('valida payload con Zod', async () => {
    const r = await http('/auth/login', { method: 'POST', json: { email: 'no-email', password: '123' } });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('validation_error');
  });

  it('login del super admin devuelve sesión y cookie', async () => {
    const r = await http('/auth/login', { method: 'POST', json: { email: SUPER_EMAIL, password: SUPER_PASS } });
    expect(r.status).toBe(200);
    expect(r.data.session.role).toBe('super_admin');
    expect(r.cookies.length).toBeGreaterThan(0);
  });

  it('GET /auth/me con cookie devuelve la sesión', async () => {
    const cookie = await login(SUPER_EMAIL, SUPER_PASS);
    const r = await http('/auth/me', { cookie });
    expect(r.status).toBe(200);
    expect(r.data.session.email).toBe(SUPER_EMAIL);
  });

  it('GET /auth/me sin cookie es 401', async () => {
    const r = await http('/auth/me');
    expect(r.status).toBe(401);
  });

  it('logout limpia cookie', async () => {
    const cookie = await login(SUPER_EMAIL, SUPER_PASS);
    const r = await http('/auth/logout', { method: 'POST', cookie });
    expect(r.status).toBe(200);
  });

  it('registro crea tenant + usuario admin', async () => {
    const slug = `test-${Date.now()}`;
    const r = await http('/auth/register', {
      method: 'POST',
      json: {
        tenantName: `Test ${slug}`,
        tenantSlug: slug,
        adminName: 'Test Admin',
        email: `admin-${slug}@test.local`,
        password: 'TestPass123!',
        acceptTerms: true,
        acceptHabeasData: true,
      },
    });
    expect(r.status).toBe(200);
    expect(r.data.session.role).toBe('tenant_admin');
    expect(r.data.session.tenantSlug).toBe(slug);
  });

  it('registro rechaza slug duplicado', async () => {
    const slug = `dup-${Date.now()}`;
    const body = {
      tenantName: 'Test',
      tenantSlug: slug,
      adminName: 'Admin Test',
      email: `a-${slug}@t.local`,
      password: 'TestPass123!',
      acceptTerms: true,
      acceptHabeasData: true,
    };
    const r1 = await http('/auth/register', { method: 'POST', json: body });
    expect(r1.status).toBe(200);
    const r2 = await http('/auth/register', {
      method: 'POST',
      json: { ...body, email: `b-${slug}@t.local` },
    });
    expect(r2.status).toBe(409);
  });
});
