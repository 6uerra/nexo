import type { FastifyInstance } from 'fastify';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, platformPlans } from '@nexo/db';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
import { HttpError } from '../common/error-handler.js';

const planSchema = z.object({
  key: z.string().min(2).max(32).regex(/^[a-z0-9_]+$/),
  name: z.string().min(1).max(100),
  tagline: z.string().max(200).nullable().optional(),
  description: z.string().nullable().optional(),
  priceCop: z.number().int().min(0).nullable().optional(),
  priceLabel: z.string().max(50).nullable().optional(),
  showPrice: z.boolean().default(false),
  vehicleLimit: z.number().int().min(1).nullable().optional(),
  modules: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  highlighted: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function registerPlansRoutes(app: FastifyInstance) {
  // Público: lista de planes activos para landing
  app.get('/plans', async () => {
    const db = getDb();
    const list = await db.select().from(platformPlans).where(eq(platformPlans.isActive, true)).orderBy(asc(platformPlans.sortOrder));
    return { plans: list };
  });

  // Admin: lista todos
  app.get('/admin/plans', { preHandler: [authMiddleware, requireRole('super_admin')] }, async () => {
    const db = getDb();
    const list = await db.select().from(platformPlans).orderBy(asc(platformPlans.sortOrder));
    return { plans: list };
  });

  app.post('/admin/plans', { preHandler: [authMiddleware, requireRole('super_admin')] }, async (req) => {
    const body = planSchema.parse(req.body);
    const db = getDb();
    const exists = await db.select().from(platformPlans).where(eq(platformPlans.key, body.key)).limit(1);
    if (exists.length) throw new HttpError(409, 'Ya existe un plan con esa clave');
    const [p] = await db.insert(platformPlans).values(body).returning();
    return { plan: p };
  });

  app.put('/admin/plans/:id', { preHandler: [authMiddleware, requireRole('super_admin')] }, async (req) => {
    const { id } = req.params as { id: string };
    const body = planSchema.partial().parse(req.body);
    const db = getDb();
    const [p] = await db.update(platformPlans).set({ ...body, updatedAt: new Date() }).where(eq(platformPlans.id, id)).returning();
    if (!p) throw new HttpError(404, 'No encontrado');
    return { plan: p };
  });

  app.delete('/admin/plans/:id', { preHandler: [authMiddleware, requireRole('super_admin')] }, async (req) => {
    const { id } = req.params as { id: string };
    const db = getDb();
    await db.delete(platformPlans).where(eq(platformPlans.id, id));
    return { ok: true };
  });
}
