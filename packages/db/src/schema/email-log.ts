import { pgTable, uuid, varchar, timestamp, text, pgEnum, index } from 'drizzle-orm/pg-core';

export const emailStatusEnum = pgEnum('email_status', ['pending', 'sent', 'failed']);

export const emailLog = pgTable(
  'email_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id'),
    toEmail: varchar('to_email', { length: 200 }).notNull(),
    subject: varchar('subject', { length: 300 }).notNull(),
    template: varchar('template', { length: 64 }).notNull(),
    status: emailStatusEnum('status').default('pending').notNull(),
    errorMessage: text('error_message'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('email_log_tenant_idx').on(t.tenantId),
    statusIdx: index('email_log_status_idx').on(t.status),
  }),
);

export type EmailLogEntry = typeof emailLog.$inferSelect;
