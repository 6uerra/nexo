import { pgTable, uuid, varchar, timestamp, boolean, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',   // Dueño de la plataforma (tú)
  'tenant_admin',  // Admin del intermediario (tu cliente)
  'tenant_viewer', // Solo lectura dentro del tenant
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 200 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    phone: varchar('phone', { length: 32 }),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    role: userRoleEnum('role').notNull().default('tenant_viewer'),
    isActive: boolean('is_active').default(true).notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('users_tenant_idx').on(table.tenantId),
    emailIdx: index('users_email_idx').on(table.email),
  }),
);

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
