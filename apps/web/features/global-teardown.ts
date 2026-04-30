/**
 * Global teardown: corre UNA VEZ al finalizar la suite.
 * Restaura el estado del cliente demo para no dejar la BD sucia.
 */
import { request } from '@playwright/test';

const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:3001';
const ADMIN = { email: 'admin@nexo.local', password: 'NexoAdmin2026!' };

async function globalTeardown() {
  try {
    const ctx = await request.newContext({ baseURL: API_BASE });
    const r = await ctx.post('/api/v1/auth/login', { data: ADMIN });
    if (!r.ok()) return;
    const cs = await ctx.get('/api/v1/admin/clients').then((x) => x.json());
    const demo = cs.clients.find((c: any) => c.slug === 'demo');
    if (demo) {
      await ctx.post(`/api/v1/admin/clients/${demo.id}/set-plan`, { data: { planKey: 'free_trial' } });
      await ctx.post(`/api/v1/admin/clients/${demo.id}/set-subscription`, { data: { preset: 'active' } });
    }
    await ctx.dispose();
    console.log('  ✔ Demo restaurado a free_trial + active');
  } catch {
    // best-effort
  }
}

export default globalTeardown;
