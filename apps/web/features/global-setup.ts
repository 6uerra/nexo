/**
 * Global setup: corre UNA VEZ antes de toda la suite.
 * Reset el estado del cliente demo para que los tests siempre arranquen
 * de un baseline conocido (free_trial + active).
 */
import { request } from '@playwright/test';

const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:3001';
const ADMIN = { email: 'admin@nexo.local', password: 'NexoAdmin2026!' };

async function globalSetup() {
  const ctx = await request.newContext({ baseURL: API_BASE });
  const r = await ctx.post('/api/v1/auth/login', { data: ADMIN });
  if (!r.ok()) throw new Error(`Global setup: admin login fallo (${r.status()})`);
  const cs = await ctx.get('/api/v1/admin/clients').then((x) => x.json());
  const demo = cs.clients.find((c: any) => c.slug === 'demo');
  if (!demo) throw new Error('Global setup: tenant demo no existe');
  await ctx.post(`/api/v1/admin/clients/${demo.id}/set-plan`, { data: { planKey: 'free_trial' } });
  await ctx.post(`/api/v1/admin/clients/${demo.id}/set-subscription`, { data: { preset: 'active' } });
  await ctx.dispose();
  console.log('  ✔ Demo reset a free_trial + active');
}

export default globalSetup;
