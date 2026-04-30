import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb, users, tenants, subscriptions, tenantModules, MODULE_KEYS } from '@nexo/db';
import { loginSchema, registerSchema, type AuthSession } from '@nexo/shared';
import { signSession } from './jwt.js';
import { config } from '../config.js';
import { HttpError } from '../common/error-handler.js';
import { authMiddleware } from './auth.middleware.js';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: false,
  path: '/',
  maxAge: 7 * 24 * 60 * 60,
};

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (req, reply) => {
    const body = loginSchema.parse(req.body);
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (!user || !user.isActive) throw new HttpError(401, 'Credenciales inválidas');
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new HttpError(401, 'Credenciales inválidas');

    let tenantSlug: string | null = null;
    if (user.tenantId) {
      const [t] = await db.select({ slug: tenants.slug }).from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
      tenantSlug = t?.slug ?? null;
    }

    const session: AuthSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenantSlug,
    };
    const token = signSession(session);
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    reply.setCookie(config.cookieName, token, COOKIE_OPTS);
    return { session, token };
  });

  app.post('/auth/register', async (req, reply) => {
    const body = registerSchema.parse(req.body);
    const db = getDb();

    const existsUser = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (existsUser.length) throw new HttpError(409, 'El correo ya está registrado');

    const existsSlug = await db.select().from(tenants).where(eq(tenants.slug, body.tenantSlug)).limit(1);
    if (existsSlug.length) throw new HttpError(409, 'Ese identificador de empresa ya existe');

    const [tenant] = await db
      .insert(tenants)
      .values({
        slug: body.tenantSlug,
        name: body.tenantName,
        country: 'CO',
      })
      .returning();
    const tenantId = tenant!.id;

    const passwordHash = await bcrypt.hash(body.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        tenantId,
        email: body.email,
        passwordHash,
        name: body.adminName,
        role: 'tenant_admin',
        isActive: true,
        emailVerified: false,
      })
      .returning();

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const blockAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    await db.insert(subscriptions).values({
      tenantId,
      plan: 'free_trial',
      status: 'trial',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      blockAt,
    });

    for (const key of MODULE_KEYS) {
      await db.insert(tenantModules).values({ tenantId, moduleKey: key, enabled: true });
    }

    const session: AuthSession = {
      userId: user!.id,
      email: user!.email,
      name: user!.name,
      role: user!.role,
      tenantId,
      tenantSlug: tenant!.slug,
    };
    const token = signSession(session);
    reply.setCookie(config.cookieName, token, COOKIE_OPTS);
    return { session, token };
  });

  app.post('/auth/logout', async (_req, reply) => {
    reply.clearCookie(config.cookieName, { path: '/' });
    return { ok: true };
  });

  app.get('/auth/me', { preHandler: authMiddleware }, async (req) => {
    return { session: req.session };
  });
}
