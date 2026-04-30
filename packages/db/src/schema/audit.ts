import { pgTable, uuid, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id'),
    userId: uuid('user_id'),
    action: varchar('action', { length: 100 }).notNull(),
    entity: varchar('entity', { length: 100 }).notNull(),
    entityId: varchar('entity_id', { length: 100 }),
    diff: jsonb('diff').$type<Record<string, unknown>>(),
    ip: varchar('ip', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('audit_tenant_idx').on(table.tenantId),
    entityIdx: index('audit_entity_idx').on(table.entity, table.entityId),
    createdIdx: index('audit_created_idx').on(table.createdAt),
  }),
);

export type AuditEntry = typeof auditLog.$inferSelect;
