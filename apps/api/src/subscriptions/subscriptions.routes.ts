import type { FastifyInstance } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import {
  getDb,
  subscriptions,
  subscriptionPayments,
  platformPaymentMethods,
} from '@nexo/db';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
import { HttpError } from '../common/error-handler.js';
import { z } from 'zod';

const submitPaymentSchema = z.object({
  amountCop: z.number().int().positive(),
  method: z.enum(['qr', 'bank_transfer', 'mercado_pago', 'cash', 'other']),
  reference: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  coversFrom: z.string().datetime(),
  coversTo: z.string().datetime(),
});

export async function registerSubscriptionRoutes(app: FastifyInstance) {
  app.get('/subscriptions/me', { preHandler: [authMiddleware] }, async (req) => {
    if (!req.session?.tenantId) throw new HttpError(404, 'Sin tenant');
    const db = getDb();
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, req.session.tenantId))
      .limit(1);
    return { subscription: sub ?? null };
  });

  app.get('/payment-methods', async () => {
    const db = getDb();
    const list = await db.select().from(platformPaymentMethods).where(eq(platformPaymentMethods.isActive, true));
    return { methods: list };
  });

  app.get('/subscriptions/me/payments', { preHandler: [authMiddleware] }, async (req) => {
    if (!req.session?.tenantId) return { payments: [] };
    const db = getDb();
    const list = await db
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.tenantId, req.session.tenantId))
      .orderBy(desc(subscriptionPayments.submittedAt));
    return { payments: list };
  });

  app.post('/subscriptions/me/payments', { preHandler: [authMiddleware, requireRole('tenant_admin', 'super_admin')] }, async (req) => {
    if (!req.session?.tenantId) throw new HttpError(400, 'Sin tenant');
    const body = submitPaymentSchema.parse(req.body);
    const db = getDb();
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, req.session.tenantId)).limit(1);
    if (!sub) throw new HttpError(404, 'Sin suscripción');
    const [payment] = await db
      .insert(subscriptionPayments)
      .values({
        subscriptionId: sub.id,
        tenantId: req.session.tenantId,
        amountCop: body.amountCop,
        method: body.method,
        reference: body.reference,
        receiptUrl: body.receiptUrl,
        coversFrom: new Date(body.coversFrom),
        coversTo: new Date(body.coversTo),
        status: 'submitted',
      })
      .returning();
    return { payment };
  });

  // Super admin verifica un pago
  app.post(
    '/subscriptions/payments/:paymentId/verify',
    { preHandler: [authMiddleware, requireRole('super_admin')] },
    async (req) => {
      const { paymentId } = req.params as { paymentId: string };
      const db = getDb();
      const [pay] = await db.select().from(subscriptionPayments).where(eq(subscriptionPayments.id, paymentId)).limit(1);
      if (!pay) throw new HttpError(404, 'Pago no encontrado');
      await db
        .update(subscriptionPayments)
        .set({ status: 'verified', verifiedAt: new Date(), verifiedBy: req.session!.userId })
        .where(eq(subscriptionPayments.id, paymentId));

      // Extender suscripción
      const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, pay.subscriptionId)).limit(1);
      if (sub) {
        const newPeriodEnd = new Date(pay.coversTo);
        const newBlockAt = new Date(newPeriodEnd.getTime() + 90 * 24 * 60 * 60 * 1000);
        await db
          .update(subscriptions)
          .set({
            status: 'active',
            currentPeriodEnd: newPeriodEnd,
            blockAt: newBlockAt,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, sub.id));
      }
      return { ok: true };
    },
  );

  app.post(
    '/subscriptions/payments/:paymentId/reject',
    { preHandler: [authMiddleware, requireRole('super_admin')] },
    async (req) => {
      const { paymentId } = req.params as { paymentId: string };
      const { reason } = (req.body ?? {}) as { reason?: string };
      const db = getDb();
      await db
        .update(subscriptionPayments)
        .set({ status: 'rejected', rejectionReason: reason })
        .where(eq(subscriptionPayments.id, paymentId));
      return { ok: true };
    },
  );
}
