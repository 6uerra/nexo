import { pgTable, uuid, varchar, boolean, timestamp, primaryKey, text } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const MODULE_KEYS = [
  'vehicles',
  'drivers',
  'owners',
  'clients',
  'contracts',
  'maintenance',
  'billing',
  'notifications',
  'reports',
  'prospects',
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export const tenantModules = pgTable(
  'tenant_modules',
  {
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    moduleKey: varchar('module_key', { length: 64 }).notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    label: varchar('label', { length: 100 }),
    description: text('description'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedBy: uuid('updated_by'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.tenantId, table.moduleKey] }),
  }),
);

export type TenantModule = typeof tenantModules.$inferSelect;
export type NewTenantModule = typeof tenantModules.$inferInsert;
