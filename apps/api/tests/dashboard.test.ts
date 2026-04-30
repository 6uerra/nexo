import { describe, it, expect, beforeAll } from 'vitest';
import { http, login, waitForApi } from './setup.js';

describe('dashboard kpis', () => {
  beforeAll(async () => {
    await waitForApi();
  });

  it('admin del tenant demo recibe KPIs (en cero al inicio)', async () => {
    const cookie = await login('admin@demo.local', 'Demo2026!');
    const r = await http('/dashboard/kpis', { cookie });
    expect(r.status).toBe(200);
    expect(typeof r.data.kpis.vehicles).toBe('number');
    expect(typeof r.data.kpis.drivers).toBe('number');
  });

  it('sin sesión devuelve 401', async () => {
    const r = await http('/dashboard/kpis');
    expect(r.status).toBe(401);
  });
});
