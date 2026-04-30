import { pgTable, uuid, varchar, timestamp, boolean, text, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users } from './users';

export const notificationChannelEnum = pgEnum('notification_channel', ['in_app', 'email']);
export const notificationTypeEnum = pgEnum('notification_type', [
  'subscription_warning',
  'subscription_blocked',
  'document_expiring',
  'document_expired',
  'maintenance_due',
  'payment_received',
  'system',
]);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    channel: notificationChannelEnum('channel').notNull().default('in_app'),
    title: varchar('title', { length: 200 }).notNull(),
    body: text('body').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    actionUrl: text('action_url'),
    readAt: timestamp('read_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('notif_user_idx').on(table.userId),
    tenantIdx: index('notif_tenant_idx').on(table.tenantId),
    unreadIdx: index('notif_unread_idx').on(table.userId, table.readAt),
  }),
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
