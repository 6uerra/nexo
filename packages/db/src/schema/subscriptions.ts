import { pgTable, uuid, timestamp, varchar, integer, pgEnum, index, decimal, text, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trial',     // Periodo de prueba activo
  'active',    // Pago al día
  'past_due',  // Vencido pero en periodo de gracia
  'blocked',   // Bloqueado totalmente (3 meses sin pago)
  'cancelled', // Cancelado por el super-admin
]);

export const planEnum = pgEnum('plan', ['free_trial', 'standard', 'pro', 'enterprise']);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    plan: planEnum('plan').notNull().default('free_trial'),
    status: subscriptionStatusEnum('status').notNull().default('trial'),
    monthlyPriceCop: integer('monthly_price_cop').default(0).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).defaultNow().notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
    blockAt: timestamp('block_at', { withTimezone: true }).notNull(), // 3 meses sin pago
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('subscriptions_tenant_idx').on(table.tenantId),
    statusIdx: index('subscriptions_status_idx').on(table.status),
  }),
);

export const subscriptionPaymentEnum = pgEnum('sub_payment_method', ['qr', 'bank_transfer', 'mercado_pago', 'cash', 'other']);
export const subscriptionPaymentStatusEnum = pgEnum('sub_payment_status', ['pending', 'submitted', 'verified', 'rejected']);

export const subscriptionPayments = pgTable(
  'subscription_payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subscriptionId: uuid('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    amountCop: integer('amount_cop').notNull(),
    method: subscriptionPaymentEnum('method').notNull(),
    status: subscriptionPaymentStatusEnum('status').default('submitted').notNull(),
    reference: varchar('reference', { length: 200 }),
    receiptUrl: text('receipt_url'),
    coversFrom: timestamp('covers_from', { withTimezone: true }).notNull(),
    coversTo: timestamp('covers_to', { withTimezone: true }).notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verifiedBy: uuid('verified_by'),
    rejectionReason: text('rejection_reason'),
  },
  (table) => ({
    tenantIdx: index('sub_payments_tenant_idx').on(table.tenantId),
    statusIdx: index('sub_payments_status_idx').on(table.status),
  }),
);

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect;
