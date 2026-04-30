// Cron en proceso para chequear vencimientos y notificar.
// En producción se recomienda mover a BullMQ + worker dedicado.
import { getDb, subscriptions, tenants, users, notifications } from '@nexo/db';
import { and, eq, lte } from 'drizzle-orm';
import { sendEmail } from '../notifications/email.service.js';

const ONE_DAY = 24 * 60 * 60 * 1000;

export function startNotificationsCron() {
  // Ejecutar cada hora
  setInterval(checkSubscriptions, 60 * 60 * 1000);
  // Y al arrancar
  checkSubscriptions().catch(console.error);
}

async function checkSubscriptions() {
  const db = getDb();
  const now = new Date();
  const in15days = new Date(now.getTime() + 15 * ONE_DAY);

  const all = await db.select().from(subscriptions);
  for (const sub of all) {
    // 1. Si pasó blockAt → bloquear
    if (now > sub.blockAt && sub.status !== 'blocked' && sub.status !== 'cancelled') {
      await db.update(subscriptions).set({ status: 'blocked', updatedAt: now }).where(eq(subscriptions.id, sub.id));
      await notifyTenantAdmins(sub.tenantId, {
        type: 'subscription_blocked',
        title: 'Tu suscripción ha sido bloqueada',
        body: 'Por falta de pago durante más de 90 días, el acceso quedó bloqueado. Realiza un pago para reactivar.',
      });
      continue;
    }
    // 2. Si vence en menos de 15 días → warning
    if (sub.currentPeriodEnd <= in15days && sub.status === 'active') {
      await db.update(subscriptions).set({ status: 'past_due', updatedAt: now }).where(eq(subscriptions.id, sub.id));
      await notifyTenantAdmins(sub.tenantId, {
        type: 'subscription_warning',
        title: 'Tu suscripción vence pronto',
        body: `Tu plan vence el ${sub.currentPeriodEnd.toLocaleDateString('es-CO')}. Realiza el pago para evitar interrupciones.`,
      });
    }
  }
}

async function notifyTenantAdmins(
  tenantId: string,
  data: { type: 'subscription_warning' | 'subscription_blocked'; title: string; body: string },
) {
  const db = getDb();
  const adminUsers = await db
    .select()
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.role, 'tenant_admin')));
  for (const u of adminUsers) {
    await db.insert(notifications).values({
      tenantId,
      userId: u.id,
      type: data.type,
      channel: 'in_app',
      title: data.title,
      body: data.body,
    });
    try {
      await sendEmail(u.email, data.title, `<p>${data.body}</p>`);
    } catch (e) {
      console.error('Email send failed', e);
    }
  }
}
