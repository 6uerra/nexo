import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, login, waitForApi } from './setup.js';

const SUPER = process.env.SEED_SUPERADMIN_EMAIL ?? 'admin@nexo.local';
const PASS = process.env.SEED_SUPERADMIN_PASSWORD ?? 'NexoAdmin2026!';

async function getDemoTenantId(cookie: string) {
  const r = await http('/admin/clients', { cookie });
  return r.data.clients.find((c: any) => c.slug === 'demo')!.id;
}

describe('admin: presets de suscripción', () => {
  beforeAll(async () => { await waitForApi(); });
  afterAll(async () => {
    const cookie = await login(SUPER, PASS);
    const tid = await getDemoTenantId(cookie);
    await http(`/admin/clients/${tid}/set-subscription`, { method: 'POST', cookie, json: { preset: 'active' } });
    await http(`/admin/clients/${tid}/set-plan`, { method: 'POST', cookie, json: { planKey: 'free_trial' } });
  });

  it('preset active: status=active y vence en 30d', async () => {
    const cookie = await login(SUPER, PASS);
    const tid = await getDemoTenantId(cookie);
    const r = await http(`/admin/clients/${tid}/set-subscription`, { method: 'POST', cookie, json: { preset: 'active' } });
    expect(r.status).toBe(200);
    const sub = await http('/admin/clients/' + tid, { cookie });
    expect(sub.data.subscription.status).toBe('active');
  });

  it('preset blocked: status=blocked y blockAt en pasado', async () => {
    const cookie = await login(SUPER, PASS);
    const tid = await getDemoTenantId(cookie);
    const r = await http(`/admin/clients/${tid}/set-subscription`, { method: 'POST', cookie, json: { preset: 'blocked' } });
    expect(r.status).toBe(200);
    const sub = await http('/admin/clients/' + tid, { cookie });
    expect(sub.data.subscription.status).toBe('blocked');
    expect(new Date(sub.data.subscription.blockAt).getTime()).toBeLessThan(Date.now());
  });

  it('preset past_due: vence hace 30 días', async () => {
    const cookie = await login(SUPER, PASS);
    const tid = await getDemoTenantId(cookie);
    const r = await http(`/admin/clients/${tid}/set-subscription`, { method: 'POST', cookie, json: { preset: 'past_due' } });
    expect(r.status).toBe(200);
    const sub = await http('/admin/clients/' + tid, { cookie });
    expect(sub.data.subscription.status).toBe('past_due');
    expect(new Date(sub.data.subscription.currentPeriodEnd).getTime()).toBeLessThan(Date.now());
  });
});

describe('admin: set-plan sincroniza módulos del tenant', () => {
  beforeAll(async () => { await waitForApi(); });

  it('cambiar a Standard activa exactamente los módulos del plan', async () => {
    const cookie = await login(SUPER, PASS);
    const tid = await getDemoTenantId(cookie);
    const r = await http(`/admin/clients/${tid}/set-plan`, { method: 'POST', cookie, json: { planKey: 'standard' } });
    expect(r.status).toBe(200);
    const standardModulesCount = r.data.modulesEnabled;
    const detail = await http('/admin/clients/' + tid, { cookie });
    const enabled = detail.data.modules.filter((m: any) => m.enabled).length;
    expect(enabled).toBe(standardModulesCount);
  });

  it('volver a free_trial activa todos los módulos (10)', async () => {
    const cookie = await login(SUPER, PASS);
    const tid = await getDemoTenantId(cookie);
    const r = await http(`/admin/clients/${tid}/set-plan`, { method: 'POST', cookie, json: { planKey: 'free_trial' } });
    expect(r.status).toBe(200);
    expect(r.data.modulesEnabled).toBe(10);
  });
});
