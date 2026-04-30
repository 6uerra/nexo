import type { FastifyInstance } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, subscriptionPayments, tenants, subscriptions } from '@nexo/db';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
import { HttpError } from '../common/error-handler.js';
import { sendTemplatedEmail } from '../notifications/email.service.js';
import { config } from '../config.js';
import { users } from '@nexo/db';
import { and } from 'drizzle-orm';

export async function registerAdminSubscriptionPaymentsRoutes(app: FastifyInstance) {
  // Lista de TODOS los pagos de suscripción de TODOS los tenants
  app.get('/admin/subscription-payments', { preHandler: [authMiddleware, requireRole('super_admin')] }, async () => {
    const db = getDb();
    const list = await db
      .select({
        p: subscriptionPayments,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
      })
      .from(subscriptionPayments)
      .leftJoin(tenants, eq(subscriptionPayments.tenantId, tenants.id))
      .orderBy(desc(subscriptionPayments.submittedAt))
      .limit(500);
    return {
      payments: list.map((r) => ({ ...r.p, tenantName: r.tenantName, tenantSlug: r.tenantSlug })),
    };
  });

  // Verificar pago: extiende suscripción + manda email al cliente
  app.post('/admin/subscription-payments/:id/verify', { preHandler: [authMiddleware, requireRole('super_admin')] }, async (req) => {
    const { id } = req.params as { id: string };
    const db = getDb();
    const [pay] = await db.select().from(subscriptionPayments).where(eq(subscriptionPayments.id, id)).limit(1);
    if (!pay) throw new HttpError(404, 'Pago no encontrado');
    await db.update(subscriptionPayments)
      .set({ status: 'verified', verifiedAt: new Date(), verifiedBy: req.session!.userId })
      .where(eq(subscriptionPayments.id, id));

    // Extender suscripción
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, pay.subscriptionId)).limit(1);
    if (sub) {
      const newEnd = new Date(pay.coversTo);
      const newBlock = new Date(newEnd.getTime() + 90 * 24 * 60 * 60 * 1000);
      await db.update(subscriptions)
        .set({ status: 'active', currentPeriodEnd: newEnd, blockAt: newBlock, updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id));
    }

    // Notificar al admin del cliente
    const adminUsers = await db.select().from(users).where(and(eq(users.tenantId, pay.tenantId), eq(users.role, 'tenant_admin')));
    for (const u of adminUsers) {
      sendTemplatedEmail({
        to: u.email,
        template: 'paymentVerified',
        tenantId: pay.tenantId,
        vars: {
          name: u.name,
          amount: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(pay.amountCop),
          coversTo: new Date(pay.coversTo).toLocaleDateString('es-CO'),
        },
      });
    }
    return { ok: true };
  });

  // Rechazar pago
  app.post('/admin/subscription-payments/:id/reject', { preHandler: [authMiddleware, requireRole('super_admin')] }, async (req) => {
    const { id } = req.params as { id: string };
    const body = z.object({ reason: z.string().min(1).max(500) }).parse(req.body);
    const db = getDb();
    const [pay] = await db.select().from(subscriptionPayments).where(eq(subscriptionPayments.id, id)).limit(1);
    if (!pay) throw new HttpError(404, 'Pago no encontrado');
    await db.update(subscriptionPayments)
      .set({ status: 'rejected', rejectionReason: body.reason })
      .where(eq(subscriptionPayments.id, id));

    const adminUsers = await db.select().from(users).where(and(eq(users.tenantId, pay.tenantId), eq(users.role, 'tenant_admin')));
    for (const u of adminUsers) {
      sendTemplatedEmail({
        to: u.email,
        template: 'paymentRejected',
        tenantId: pay.tenantId,
        vars: { name: u.name, reason: body.reason },
      });
    }
    return { ok: true };
  });
}
