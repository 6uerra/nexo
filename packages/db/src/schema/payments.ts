// Información de cobro del super-admin (datos para que los tenants paguen su suscripción).
import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const platformPaymentMethods = pgTable('platform_payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  label: varchar('label', { length: 100 }).notNull(),  // "QR Bancolombia", "Cuenta Davivienda", "Mercado Pago"
  kind: varchar('kind', { length: 32 }).notNull(),     // qr | bank | mercado_pago
  qrImageUrl: text('qr_image_url'),
  bankName: varchar('bank_name', { length: 100 }),
  bankAccount: varchar('bank_account', { length: 100 }),
  bankAccountType: varchar('bank_account_type', { length: 32 }),
  holderName: varchar('holder_name', { length: 200 }),
  holderDocument: varchar('holder_document', { length: 32 }),
  link: text('link'),
  instructions: text('instructions'),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: varchar('sort_order', { length: 10 }).default('0').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PlatformPaymentMethod = typeof platformPaymentMethods.$inferSelect;
