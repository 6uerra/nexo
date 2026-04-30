import type { FastifyInstance } from 'fastify';
import { eq, desc, count } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDb, tenants, users, subscriptions, tenantModules, platformPlans, MODULE_KEYS, type ModuleKey } from '@nexo/db';
import { and } from 'drizzle-orm';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
import { HttpError } from '../common/error-handler.js';
import { generateToken, expiresIn } from '../auth/activation.js';
import { sendTemplatedEmail } from '../notifications/email.service.js';
import { config } from '../config.js';

const createClientSchema = z.object({
  tenantName: z.string().min(2),
  tenantSlug: z.string().min(3).max(64).regex(/^[a-z0-9-]+$/).optional(),
  legalName: z.string().optional(),
  nit: z.string().optional(),
  city: z.string().optional(),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  trialDays: z.number().int().min(1).max(3650).default(30),
  plan: z.enum(['free_trial', 'standard', 'pro', 'enterprise']).default('free_trial'),
  modules: z.array(z.string()).optional(), // si no, todos
});

function slugify(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64) || 'cliente';
}

export async function registerAdminClientsRoutes(app: FastifyInstance) {
  // Listar clientes (solo super-admin) con datos resumidos
  app.get('/admin/clients', { preHandler: [authMiddleware, requireRole('super_admin')] }, async () => {
    const db = getDb();
    const list = await db.select().from(tenants).orderBy(desc(tenants.createdAt));
    const enriched = await Promise.all(list.map(async (t) => {
      const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, t.id)).limit(1);
      const [u] = await db.select({ c: count() }).from(users).where(eq(users.tenantId, t.id));
      const mods = await db.select().from(tenantModules).where(eq(tenantModules.tenantId, t.id));
      return {
        ...t,
        subscription: sub ?? null,
        usersCount: u?.c ?? 0,
        modulesActive: mods.filter((m) => m.enabled).length,
        modulesTotal: mods.length,
      };
    }));
    return { clients: enriched };
  });

  app.get('/admin/clients/:id', { preHandler: [authMiddleware, requireRole('super_admin')] }, async (req) => {
    const { id } = req.params as { id: string };
    const db = getDb();
    const [t] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    if (!t) throw new HttpError(404, 'Cliente no encontrado');
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, id)).limit(1);
    const tenantUsers = await db.select().from(users).where(eq(users.tenantId, id));
    const mods = await db.select().from(tenantModules).where(eq(tenantModules.tenantId, id));
    return {
      tenant: t,
      subscription: sub ?? null,
      users: tenantUsers.map((u) => ({
        id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive,
        emailVerified: u.emailVerified, lastLoginAt: u.lastLoginAt,
      })),
      modules: mods,
    };
  });

  app.post('/admin/clients', { preHandler: [authMiddleware, requireRole('super_admin')] }, async (req) => {
    const body = createClientSchema.parse(req.body);
    const db = getDb();

    let slug = body.tenantSlug ?? slugify(body.tenantName);
    let attempt = 0;
    while (attempt < 5) {
      const e = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
      if (e.length === 0) break;
      attempt++;
      slug = `${slugify(body.tenantName)}-${Math.floor(Math.random() * 9000) + 1000}`;
    }
    if (attempt === 5) throw new HttpError(409, 'No se pudo generar identificador único');

    const existsEmail = await db.select().from(users).where(eq(users.email, body.adminEmail)).limit(1);
    if (existsEmail.length) throw new HttpError(409, 'Ese correo ya está en uso');

    const [tenant] = await db.insert(tenants).values({
      slug,
      name: body.tenantName,
      legalName: body.legalName ?? null,
      nit: body.nit ?? null,
      city: body.city ?? null,
      country: 'CO',
    }).returning();

    const now = new Date();
    const periodEnd = new Date(now.getTime() + body.trialDays * 24 * 60 * 60 * 1000);
    const blockAt = new Date(periodEnd.getTime() + 90 * 24 * 60 * 60 * 1000);
    await db.insert(subscriptions).values({
      tenantId: tenant!.id,
      plan: body.plan,
      status: 'trial',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      blockAt,
      notes: `Creado por super-admin ${req.session!.email} con ${body.trialDays} días de trial`,
    });

    const moduleSet = new Set<string>(body.modules ?? MODULE_KEYS);
    for (const key of MODULE_KEYS) {
      await db.insert(tenantModules).values({
        tenantId: tenant!.id,
        moduleKey: key,
        enabled: moduleSet.has(key),
        updatedBy: req.session!.userId,
      });
    }

    const activationToken = generateToken();
    const [adminUser] = await db.insert(users).values({
      tenantId: tenant!.id,
      email: body.adminEmail,
      passwordHash: '',
      name: body.adminName,
      role: 'tenant_admin',
      isActive: true,
      emailVerified: false,
      activationToken,
      activationExpiresAt: expiresIn(48),
    }).returning();

    sendTemplatedEmail({
      to: body.adminEmail,
      template: 'welcomeClient',
      tenantId: tenant!.id,
      vars: {
        adminName: body.adminName,
        tenantName: body.tenantName,
        activationUrl: `${config.webUrl}/activate?token=${activationToken}`,
        trialDays: body.trialDays,
        modulesCount: moduleSet.size,
      },
    });

    return { tenant, user: { id: adminUser!.id, email: adminUser!.email }, activationToken };
  });

  // Extender suscripción manualmente (regalar días)
  app.post('/admin/clients/:id/extend-subscription', { preHandler: [authMiddleware, requireRole('super_admin')] }, async (req) => {
    const { id } = req.params as { id: string };
    const body = z.object({ days: z.number().int().min(1).max(3650) }).parse(req.body);
    const db = getDb();
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, id)).limit(1);
    if (!sub) throw new HttpError(404, 'Sin suscripción');
    const newEnd = new Date(Math.max(sub.currentPeriodEnd.getTime(), Date.now()) + body.days * 24 * 60 * 60 * 1000);
    const newBlock = new Date(newEnd.getTime() + 90 * 24 * 60 * 60 * 1000);
    await db.update(subscriptions)
      .set({ currentPeriodEnd: newEnd, blockAt: newBlock, status: 'active', updatedAt: new Date() })
      .where(eq(subscriptions.id, sub.id));
    return { ok: true };
  });

  app.put('/admin/clients/:id', { preHandler: [authMiddleware, requireRole('super_admin')] }, async (req) => {
    const { id } = req.params as { id: string };
    const body = z.object({
      name: z.string().min(2).optional(),
      legalName: z.string().nullable().optional(),
      nit: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
    }).parse(req.body);
    const db = getDb();
    const [t] = await db.update(tenants).set({ ...body, updatedAt: new Date() }).where(eq(tenants.id, id)).returning();
    if (!t) throw new HttpError(404, 'No encontrado');
    return { tenant: t };
  });

  app.delete('/admin/clients/:id', { preHandler: [authMiddleware, requireRole('super_admin')] }, async (req) => {
    const { id } = req.params as { id: string };
    const db = getDb();
    await db.delete(tenants).where(eq(tenants.id, id));
    return { ok: true };
  });

  // Cambiar plan: actualiza subscription.plan + sincroniza tenant_modules con plan.modules
  app.post('/admin/clients/:id/set-plan', { preHandler: [authMiddleware, requireRole('super_admin')] }, async (req) => {
    const { id } = req.params as { id: string };
    const body = z.object({ planKey: z.string().min(2) }).parse(req.body);
    const db = getDb();
    const [plan] = await db.select().from(platformPlans).where(eq(platformPlans.key, body.planKey)).limit(1);
    if (!plan) throw new HttpError(404, 'Plan no encontrado');
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, id)).limit(1);
    if (sub) {
      await db.update(subscriptions)
        .set({ plan: body.planKey as any, updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id));
    }
    // Sincronizar módulos: enable los del plan, disable los demás
    const planMods = new Set<string>(plan.modules ?? []);
    for (const key of MODULE_KEYS) {
      const enabled = planMods.has(key);
      const existing = await db.select().from(tenantModules)
        .where(and(eq(tenantModules.tenantId, id), eq(tenantModules.moduleKey, key))).limit(1);
      if (existing.length === 0) {
        await db.insert(tenantModules).values({ tenantId: id, moduleKey: key, enabled, updatedBy: req.session!.userId });
      } else {
        await db.update(tenantModules)
          .set({ enabled, updatedAt: new Date(), updatedBy: req.session!.userId })
          .where(and(eq(tenantModules.tenantId, id), eq(tenantModules.moduleKey, key)));
      }
    }
    return { ok: true, planKey: plan.key, planName: plan.name, modulesEnabled: planMods.size };
  });

  // Aplicar preset al estado de la suscripción (para probar bloqueos)
  app.post('/admin/clients/:id/set-subscription', { preHandler: [authMiddleware, requireRole('super_admin')] }, async (req) => {
    const { id } = req.params as { id: string };
    const body = z.object({
      preset: z.enum(['active', 'expiring_soon', 'past_due', 'blocked']),
    }).parse(req.body);
    const db = getDb();
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, id)).limit(1);
    if (!sub) throw new HttpError(404, 'Sin suscripción');
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    let update: Partial<typeof sub> = { updatedAt: now };
    if (body.preset === 'active') {
      const end = new Date(now.getTime() + 30 * day);
      update = { ...update, status: 'active', currentPeriodEnd: end, blockAt: new Date(end.getTime() + 90 * day) };
    } else if (body.preset === 'expiring_soon') {
      const end = new Date(now.getTime() + 5 * day);
      update = { ...update, status: 'past_due', currentPeriodEnd: end, blockAt: new Date(end.getTime() + 90 * day) };
    } else if (body.preset === 'past_due') {
      const end = new Date(now.getTime() - 30 * day);
      update = { ...update, status: 'past_due', currentPeriodEnd: end, blockAt: new Date(end.getTime() + 90 * day) };
    } else if (body.preset === 'blocked') {
      const end = new Date(now.getTime() - 100 * day);
      update = { ...update, status: 'blocked', currentPeriodEnd: end, blockAt: new Date(now.getTime() - day) };
    }
    await db.update(subscriptions).set(update as any).where(eq(subscriptions.id, sub.id));
    return { ok: true, preset: body.preset };
  });

  // Activar / desactivar tenant
  app.post('/admin/clients/:id/toggle-active', { preHandler: [authMiddleware, requireRole('super_admin')] }, async (req) => {
    const { id } = req.params as { id: string };
    const body = z.object({ isActive: z.boolean() }).parse(req.body);
    const db = getDb();
    await db.update(tenants).set({ isActive: body.isActive, updatedAt: new Date() }).where(eq(tenants.id, id));
    return { ok: true };
  });

  // Reenviar email de activación
  app.post('/admin/clients/:id/resend-activation', { preHandler: [authMiddleware, requireRole('super_admin')] }, async (req) => {
    const { id } = req.params as { id: string };
    const db = getDb();
    const adminUsers = await db.select().from(users)
      .where(eq(users.tenantId, id));
    const adminUser = adminUsers.find((u) => u.role === 'tenant_admin');
    if (!adminUser) throw new HttpError(404, 'Sin admin');
    const [t] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, id)).limit(1);
    const mods = await db.select().from(tenantModules).where(eq(tenantModules.tenantId, id));
    const activationToken = generateToken();
    await db.update(users)
      .set({ activationToken, activationExpiresAt: expiresIn(48), updatedAt: new Date() })
      .where(eq(users.id, adminUser.id));
    sendTemplatedEmail({
      to: adminUser.email,
      template: 'welcomeClient',
      tenantId: id,
      vars: {
        adminName: adminUser.name,
        tenantName: t?.name ?? '',
        activationUrl: `${config.webUrl}/activate?token=${activationToken}`,
        trialDays: sub ? Math.max(0, Math.ceil((sub.currentPeriodEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : 30,
        modulesCount: mods.filter((m) => m.enabled).length,
      },
    });
    return { ok: true };
  });
}
