import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { getDb, tenants } from '@nexo/db';
import { tenantOnboardingSchema } from '@nexo/shared';
import { authMiddleware, subscriptionGuard, requireRole } from '../auth/auth.middleware.js';
import { HttpError } from '../common/error-handler.js';

export async function registerTenantRoutes(app: FastifyInstance) {
  app.get('/tenants/me', { preHandler: [authMiddleware] }, async (req) => {
    if (!req.session?.tenantId) throw new HttpError(404, 'Sin tenant asociado');
    const db = getDb();
    const [t] = await db.select().from(tenants).where(eq(tenants.id, req.session.tenantId)).limit(1);
    if (!t) throw new HttpError(404, 'Tenant no encontrado');
    return { tenant: t };
  });

  app.put(
    '/tenants/me/onboarding',
    { preHandler: [authMiddleware, subscriptionGuard, requireRole('tenant_admin', 'super_admin')] },
    async (req) => {
      if (!req.session?.tenantId) throw new HttpError(400, 'Sin tenant');
      const body = tenantOnboardingSchema.parse(req.body);
      const db = getDb();
      const [t] = await db
        .update(tenants)
        .set({ ...body, onboardingCompleted: true, updatedAt: new Date() })
        .where(eq(tenants.id, req.session.tenantId))
        .returning();
      return { tenant: t };
    },
  );

  // Super admin: listar tenants
  app.get('/tenants', { preHandler: [authMiddleware, requireRole('super_admin')] }, async () => {
    const db = getDb();
    const list = await db.select().from(tenants);
    return { tenants: list };
  });
}
