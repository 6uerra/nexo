import { describe, it, expect, beforeAll } from 'vitest';
import { http, login, waitForApi } from './setup.js';

describe('vistas read-only del cliente (data demo)', () => {
  beforeAll(async () => {
    await waitForApi();
    // Asegurar que el demo está activo (otros tests pueden haberlo bloqueado)
    const cookie = await login(process.env.SEED_SUPERADMIN_EMAIL ?? 'admin@nexo.local', process.env.SEED_SUPERADMIN_PASSWORD ?? 'NexoAdmin2026!');
    const list = await http('/admin/clients', { cookie });
    const demo = list.data.clients.find((c: any) => c.slug === 'demo');
    if (demo) {
      await http(`/admin/clients/${demo.id}/set-plan`, { method: 'POST', cookie, json: { planKey: 'free_trial' } });
      await http(`/admin/clients/${demo.id}/set-subscription`, { method: 'POST', cookie, json: { preset: 'active' } });
    }
  });

  it('GET /vehicles devuelve la flota demo (8 vehículos)', async () => {
    const cookie = await login('admin@demo.local', 'Demo2026!');
    const r = await http('/vehicles', { cookie });
    expect(r.status).toBe(200);
    expect(r.data.vehicles.length).toBe(8);
    expect(r.data.vehicles[0]).toHaveProperty('plate');
    expect(r.data.vehicles[0]).toHaveProperty('ownerName');
  });

  it('GET /drivers devuelve 5 conductores', async () => {
    const cookie = await login('admin@demo.local', 'Demo2026!');
    const r = await http('/drivers', { cookie });
    expect(r.status).toBe(200);
    expect(r.data.drivers.length).toBe(5);
  });

  it('GET /owners devuelve 3 propietarios con bankInfo', async () => {
    const cookie = await login('admin@demo.local', 'Demo2026!');
    const r = await http('/owners', { cookie });
    expect(r.status).toBe(200);
    expect(r.data.owners.length).toBe(3);
    expect(r.data.owners[0].bankInfo).toBeTruthy();
  });

  it('GET /clients devuelve 3 empresas', async () => {
    const cookie = await login('admin@demo.local', 'Demo2026!');
    const r = await http('/clients', { cookie });
    expect(r.status).toBe(200);
    expect(r.data.clients.length).toBe(3);
  });

  it('GET /contracts devuelve 4 contratos con joins', async () => {
    const cookie = await login('admin@demo.local', 'Demo2026!');
    const r = await http('/contracts', { cookie });
    expect(r.status).toBe(200);
    expect(r.data.contracts.length).toBe(4);
    expect(r.data.contracts[0]).toHaveProperty('clientName');
    expect(r.data.contracts[0]).toHaveProperty('vehiclePlate');
  });

  it('GET /maintenance devuelve 5 mantenimientos', async () => {
    const cookie = await login('admin@demo.local', 'Demo2026!');
    const r = await http('/maintenance', { cookie });
    expect(r.status).toBe(200);
    expect(r.data.maintenances.length).toBe(5);
  });

  it('GET /invoices devuelve 4 facturas (2 cobros + 2 pagos)', async () => {
    const cookie = await login('admin@demo.local', 'Demo2026!');
    const r = await http('/invoices', { cookie });
    expect(r.status).toBe(200);
    expect(r.data.invoices.length).toBe(4);
    const charges = r.data.invoices.filter((i: any) => i.direction === 'client_charge');
    const payouts = r.data.invoices.filter((i: any) => i.direction === 'owner_payout');
    expect(charges.length).toBe(2);
    expect(payouts.length).toBe(2);
  });
});
