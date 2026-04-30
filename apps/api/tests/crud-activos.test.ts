import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, login, waitForApi } from './setup.js';

const SUPER = process.env.SEED_SUPERADMIN_EMAIL ?? 'admin@nexo.local';
const PASS = process.env.SEED_SUPERADMIN_PASSWORD ?? 'NexoAdmin2026!';

async function ensureActive() {
  const c = await login(SUPER, PASS);
  const list = await http('/admin/clients', { cookie: c });
  const demo = list.data.clients.find((x: any) => x.slug === 'demo');
  if (demo) {
    await http(`/admin/clients/${demo.id}/set-plan`, { method: 'POST', cookie: c, json: { planKey: 'free_trial' } });
    await http(`/admin/clients/${demo.id}/set-subscription`, { method: 'POST', cookie: c, json: { preset: 'active' } });
  }
}

describe('CRUD activos (Sprint 2): vehicles, drivers, owners', () => {
  beforeAll(async () => { await waitForApi(); await ensureActive(); });
  afterAll(async () => { await ensureActive(); });

  // ============ OWNERS ============
  describe('owners', () => {
    let createdId: string | null = null;

    it('POST crea propietario válido (200)', async () => {
      const cookie = await login('admin@demo.local', 'Demo2026!');
      const r = await http('/owners', {
        method: 'POST', cookie,
        json: { fullName: 'Test Owner', document: '999111222', documentType: 'CC', email: 'test@x.com' },
      });
      expect(r.status).toBe(200);
      expect(r.data.owner.fullName).toBe('Test Owner');
      createdId = r.data.owner.id;
    });

    it('POST rechaza fullName corto (Black Box: valor límite < 2)', async () => {
      const cookie = await login('admin@demo.local', 'Demo2026!');
      const r = await http('/owners', { method: 'POST', cookie, json: { fullName: 'A', document: '12345' } });
      expect(r.status).toBe(400);
    });

    it('PUT edita propio propietario (200)', async () => {
      const cookie = await login('admin@demo.local', 'Demo2026!');
      const r = await http(`/owners/${createdId}`, { method: 'PUT', cookie, json: { fullName: 'Test Owner Edited' } });
      expect(r.status).toBe(200);
      expect(r.data.owner.fullName).toBe('Test Owner Edited');
    });

    it('DELETE borra propio propietario (200)', async () => {
      const cookie = await login('admin@demo.local', 'Demo2026!');
      const r = await http(`/owners/${createdId}`, { method: 'DELETE', cookie });
      expect(r.status).toBe(200);
    });
  });

  // ============ DRIVERS ============
  describe('drivers', () => {
    let createdId: string | null = null;

    it('POST crea conductor válido (200)', async () => {
      const cookie = await login('admin@demo.local', 'Demo2026!');
      const r = await http('/drivers', {
        method: 'POST', cookie,
        json: { fullName: 'Test Driver', document: '999333444', documentType: 'CC', licenseCategory: 'C2' },
      });
      expect(r.status).toBe(200);
      createdId = r.data.driver.id;
    });

    it('PUT edita conductor', async () => {
      const cookie = await login('admin@demo.local', 'Demo2026!');
      const r = await http(`/drivers/${createdId}`, { method: 'PUT', cookie, json: { eps: 'Sura' } });
      expect(r.status).toBe(200);
      expect(r.data.driver.eps).toBe('Sura');
    });

    it('DELETE borra conductor', async () => {
      const cookie = await login('admin@demo.local', 'Demo2026!');
      const r = await http(`/drivers/${createdId}`, { method: 'DELETE', cookie });
      expect(r.status).toBe(200);
    });
  });

  // ============ VEHICLES ============
  describe('vehicles', () => {
    let createdId: string | null = null;

    it('POST crea vehículo válido (200)', async () => {
      const cookie = await login('admin@demo.local', 'Demo2026!');
      const r = await http('/vehicles', {
        method: 'POST', cookie,
        json: { plate: `TST-${Date.now() % 10000}`, type: 'sedan', brand: 'Test', model: 'Model', year: 2020 },
      });
      expect(r.status).toBe(200);
      createdId = r.data.vehicle.id;
      expect(r.data.vehicle.plate).toMatch(/^TST-/);
    });

    it('POST rechaza placa con caracteres inválidos (Black Box: clase invalida)', async () => {
      const cookie = await login('admin@demo.local', 'Demo2026!');
      const r = await http('/vehicles', { method: 'POST', cookie, json: { plate: 'AB@123', type: 'sedan' } });
      expect(r.status).toBe(400);
    });

    it('PUT actualiza vehículo', async () => {
      const cookie = await login('admin@demo.local', 'Demo2026!');
      const r = await http(`/vehicles/${createdId}`, { method: 'PUT', cookie, json: { color: 'Rojo' } });
      expect(r.status).toBe(200);
      expect(r.data.vehicle.color).toBe('Rojo');
    });

    it('DELETE borra vehículo', async () => {
      const cookie = await login('admin@demo.local', 'Demo2026!');
      const r = await http(`/vehicles/${createdId}`, { method: 'DELETE', cookie });
      expect(r.status).toBe(200);
    });
  });
});
