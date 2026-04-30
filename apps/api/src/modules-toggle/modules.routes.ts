import type { FastifyInstance } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { getDb, tenantModules, MODULE_KEYS, type ModuleKey } from '@nexo/db';
import { moduleToggleSchema } from '@nexo/shared';
import { authMiddleware, requireRole, subscriptionGuard } from '../auth/auth.middleware.js';
import { HttpError } from '../common/error-handler.js';

export async function registerModuleRoutes(app: FastifyInstance) {
  app.get('/modules', { preHandler: [authMiddleware] }, async (req) => {
    if (!req.session?.tenantId) return { modules: [] };
    const db = getDb();
    const list = await db.select().from(tenantModules).where(eq(tenantModules.tenantId, req.session.tenantId));
    return { modules: list };
  });

  // Super-admin puede togglear módulos para cualquier tenant via :tenantId,
  // tenant_admin sólo para el suyo.
  app.put(
    '/modules/:tenantId',
    { preHandler: [authMiddleware, subscriptionGuard] },
    async (req) => {
      const { tenantId } = req.params as { tenantId: string };
      const body = moduleToggleSchema.parse(req.body);
      if (!MODULE_KEYS.includes(body.moduleKey as ModuleKey)) {
        throw new HttpError(400, `Módulo inválido. Permitidos: ${MODULE_KEYS.join(', ')}`);
      }
      if (req.session!.role !== 'super_admin' && req.session!.tenantId !== tenantId) {
        throw new HttpError(403, 'No autorizado');
      }
      const db = getDb();
      const existing = await db
        .select()
        .from(tenantModules)
        .where(and(eq(tenantModules.tenantId, tenantId), eq(tenantModules.moduleKey, body.moduleKey)))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(tenantModules).values({
          tenantId,
          moduleKey: body.moduleKey,
          enabled: body.enabled,
          updatedBy: req.session!.userId,
        });
      } else {
        await db
          .update(tenantModules)
          .set({ enabled: body.enabled, updatedAt: new Date(), updatedBy: req.session!.userId })
          .where(and(eq(tenantModules.tenantId, tenantId), eq(tenantModules.moduleKey, body.moduleKey)));
      }
      return { ok: true };
    },
  );
}
