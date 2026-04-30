/**
 * Step definitions en español — versión optimizada.
 * - Fixtures con storageState pre-cargado por rol (sin UI login en cada test)
 * - POM (pages.ts)
 * - Workers paralelos seguros: cada test puede mutar estado vía Given API
 *   y los Given hacen reset/cambio justo antes del flow
 */
import { createBdd, test as base } from 'playwright-bdd';
import { expect, request, type APIRequestContext, type BrowserContext } from '@playwright/test';
import { resolve } from 'node:path';
import { LoginPage, Sidebar, AdminClientsPage } from './pages.js';

const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:3001';

export const ADMIN = { email: 'admin@nexo.local', password: 'NexoAdmin2026!' };
export const CLIENT = { email: 'admin@demo.local', password: 'Demo2026!' };

type Fixtures = {
  loginPage: LoginPage;
  sidebar: Sidebar;
  adminClients: AdminClientsPage;
  /** Carga la sesión guardada por el global-setup en el contexto del navegador */
  loadAuth: (role: 'admin' | 'cliente') => Promise<void>;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  sidebar: async ({ page }, use) => use(new Sidebar(page)),
  adminClients: async ({ page }, use) => use(new AdminClientsPage(page)),
  loadAuth: async ({ context }, use) => {
    use(async (role: 'admin' | 'cliente') => {
      const file = resolve(process.cwd(), '.auth', `${role}.json`);
      const fs = await import('node:fs/promises');
      const raw = await fs.readFile(file, 'utf-8');
      const state = JSON.parse(raw);
      // Cargar cookies en el contexto vivo
      if (state.cookies?.length) await context.addCookies(state.cookies);
    });
  },
});

export const { Given, When, Then, Before, After } = createBdd(test);

async function adminApi(): Promise<APIRequestContext> {
  const ctx = await request.newContext({ baseURL: API_BASE });
  const r = await ctx.post('/api/v1/auth/login', { data: ADMIN });
  if (!r.ok()) throw new Error(`Admin login fallo: ${r.status()}`);
  return ctx;
}

async function getDemoTenantId(ctx: APIRequestContext): Promise<string> {
  const r = await ctx.get('/api/v1/admin/clients');
  const data = await r.json();
  const demo = data.clients.find((c: any) => c.slug === 'demo');
  if (!demo) throw new Error('No se encontró tenant demo');
  return demo.id;
}

// ============ DADO ============

Given('que el cliente demo está en estado {string} con plan {string}', async ({}, status: string, planKey: string) => {
  const ctx = await adminApi();
  const tid = await getDemoTenantId(ctx);
  await ctx.post(`/api/v1/admin/clients/${tid}/set-plan`, { data: { planKey } });
  await ctx.post(`/api/v1/admin/clients/${tid}/set-subscription`, { data: { preset: status } });
  await ctx.dispose();
});

Given('que el admin cambia el plan del cliente demo a {string}', async ({}, planKey: string) => {
  const ctx = await adminApi();
  const tid = await getDemoTenantId(ctx);
  await ctx.post(`/api/v1/admin/clients/${tid}/set-plan`, { data: { planKey } });
  await ctx.post(`/api/v1/admin/clients/${tid}/set-subscription`, { data: { preset: 'active' } });
  await ctx.dispose();
});

Given('que el admin cambia la suscripción del cliente demo a {string}', async ({}, preset: string) => {
  const ctx = await adminApi();
  const tid = await getDemoTenantId(ctx);
  await ctx.post(`/api/v1/admin/clients/${tid}/set-subscription`, { data: { preset } });
  await ctx.dispose();
});

/** Sesión sin UI: usa storageState precargado. Mucho más rápido. */
Given('estoy autenticado como {string}', async ({ loadAuth, page }, role: string) => {
  await loadAuth(role as 'admin' | 'cliente');
  // Aterrizar en una página default según rol
  await page.goto(role === 'admin' ? '/admin/clients' : '/dashboard');
});

// ============ CUANDO ============

When('visito la landing {string}', async ({ page }, path: string) => {
  await page.goto(path);
});

When('visito {string}', async ({ page }, path: string) => {
  await page.goto(path);
});

When('inicio sesión como {string}', async ({ loadAuth, page }, role: string) => {
  // Para escenarios donde el rol cambia a mitad de flujo (ej. set blocked → login):
  // Recreamos cookies y vamos al destino. Si está bloqueado el middleware redirige.
  await loadAuth(role as 'admin' | 'cliente');
  if (role === 'admin') {
    await page.goto('/admin/clients');
  } else {
    await page.goto('/dashboard');
    // Esperar a que estabilice (puede redirigir a /blocked si la sub está bloqueada)
    await page.waitForLoadState('domcontentloaded');
  }
});

When('completo el campo {string} con {string}', async ({ page }, name: string, value: string) => {
  if (name === 'email' || name === 'password') {
    await page.fill(`input[type=${name}]`, value);
  } else {
    await page.fill(`input[name=${name}]`, value);
  }
});

When('hago click en {string}', async ({ page }, label: string) => {
  const exact = new RegExp(`^\\s*${label}\\s*$`, 'i');
  const tryClick = async (loc: any) => {
    const n = await loc.count();
    for (let i = 0; i < n; i++) {
      const el = loc.nth(i);
      if (await el.isVisible().catch(() => false)) { await el.click(); return true; }
    }
    return false;
  };
  if (await tryClick(page.getByRole('button', { name: exact }))) return;
  if (await tryClick(page.getByRole('link', { name: exact }))) return;
  if (await tryClick(page.getByRole('button', { name: new RegExp(label, 'i') }))) return;
  if (await tryClick(page.getByRole('link', { name: new RegExp(label, 'i') }))) return;
  await page.getByText(new RegExp(label, 'i')).first().click();
});

When('visito {string} y entro al detalle del cliente demo', async ({ page, adminClients }, path: string) => {
  await page.goto(path);
  await adminClients.detailLink().click();
  await page.waitForURL((u) => /\/admin\/clients\/[a-f0-9-]+/.test(u.pathname));
});

// ============ ENTONCES ============

Then('estoy en la URL {string}', async ({ page }, expectedPath: string) => {
  await page.waitForURL((u) => u.pathname === expectedPath, { timeout: 10000 }).catch(() => {});
  const url = new URL(page.url());
  expect(url.pathname).toBe(expectedPath);
});

Then('veo el texto {string}', async ({ page }, text: string) => {
  await expect(page.getByText(new RegExp(text, 'i')).first()).toBeVisible({ timeout: 8000 });
});

Then('NO veo el texto {string}', async ({ page }, text: string) => {
  await expect(page.getByText(new RegExp(text, 'i'))).toHaveCount(0);
});

Then('veo el título {string}', async ({ page }, text: string) => {
  await expect(page.locator('h1').first()).toContainText(new RegExp(text, 'i'));
});

Then('veo la sección {string}', async ({ page }, selector: string) => {
  await expect(page.locator(selector)).toBeVisible();
});

Then('veo la sección de planes {string}', async ({ page }, selector: string) => {
  await expect(page.locator(selector)).toBeVisible();
});

Then('veo el botón {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name: new RegExp(name, 'i') }).first()).toBeVisible();
});

Then('veo el mensaje {string}', async ({ page }, text: string) => {
  await expect(page.getByText(new RegExp(text, 'i')).first()).toBeVisible({ timeout: 8000 });
});

Then('el sidebar contiene {string}', async ({ sidebar }, text: string) => {
  await expect(sidebar.root()).toContainText(new RegExp(text, 'i'));
});

Then('el sidebar NO contiene {string}', async ({ sidebar }, text: string) => {
  const html = await sidebar.textContent();
  expect(html).not.toMatch(new RegExp(text, 'i'));
});

Then('el módulo {string} aparece bloqueado en el sidebar', async ({ sidebar }, label: string) => {
  await expect(sidebar.lockedItem(label).first()).toBeVisible();
});

Then('NO veo el sidebar de operación', async ({ page }) => {
  await expect(page.locator('aside')).toHaveCount(0);
});
