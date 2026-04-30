/**
 * Global setup: corre UNA VEZ antes de toda la suite.
 * 1. Reset estado del cliente demo (free_trial + active).
 * 2. Genera storageState para admin y cliente vía API → guarda en .auth/{role}.json
 *    Esto permite que cada test cargue sesión sin pasar por UI login (~2-3s ahorrados/test).
 */
import { chromium, request } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:3001';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'nexo_session';

const ADMIN = { email: 'admin@nexo.local', password: 'NexoAdmin2026!' };
const CLIENT = { email: 'admin@demo.local', password: 'Demo2026!' };

async function loginAndSaveCookie(role: 'admin' | 'cliente', creds: typeof ADMIN) {
  // 1. Login vía API → recibe set-cookie
  const ctx = await request.newContext({ baseURL: API_BASE });
  const r = await ctx.post('/api/v1/auth/login', { data: creds });
  if (!r.ok()) throw new Error(`Login ${role} fallo: ${r.status()}`);
  const setCookies = r.headers()['set-cookie'] ?? '';
  const tokenMatch = setCookies.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!tokenMatch) throw new Error(`Cookie ${COOKIE_NAME} no recibida en login ${role}`);
  const token = tokenMatch[1]!;
  await ctx.dispose();

  // 2. Guardar como storageState
  const url = new URL(WEB_BASE);
  const state = {
    cookies: [
      {
        name: COOKIE_NAME,
        value: token,
        domain: url.hostname,
        path: '/',
        expires: -1,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax' as const,
      },
    ],
    origins: [],
  };
  const dir = resolve(process.cwd(), '.auth');
  await mkdir(dir, { recursive: true });
  await writeFile(resolve(dir, `${role}.json`), JSON.stringify(state, null, 2));
}

async function globalSetup() {
  // 1. Reset baseline del demo
  const ctx = await request.newContext({ baseURL: API_BASE });
  const r = await ctx.post('/api/v1/auth/login', { data: ADMIN });
  if (!r.ok()) throw new Error(`Global setup: admin login fallo (${r.status()})`);
  const cs = await ctx.get('/api/v1/admin/clients').then((x) => x.json());
  const demo = cs.clients.find((c: any) => c.slug === 'demo');
  if (!demo) throw new Error('Global setup: tenant demo no existe');
  await ctx.post(`/api/v1/admin/clients/${demo.id}/set-plan`, { data: { planKey: 'free_trial' } });
  await ctx.post(`/api/v1/admin/clients/${demo.id}/set-subscription`, { data: { preset: 'active' } });
  await ctx.dispose();

  // 2. Generar storageState por rol
  await loginAndSaveCookie('admin', ADMIN);
  await loginAndSaveCookie('cliente', CLIENT);

  console.log('  ✔ Demo reset a free_trial+active · storageState .auth/{admin,cliente}.json generados');
}

export default globalSetup;
