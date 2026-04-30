import { pgTable, uuid, varchar, integer, boolean, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

/**
 * Planes editables por el super-admin.
 * El super-admin define precios, límite de vehículos y módulos por plan.
 * Si `showPrice = false` se muestra `priceLabel` en su lugar (ej. "Consultar").
 */
export const platformPlans = pgTable('platform_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  tagline: varchar('tagline', { length: 200 }),
  description: text('description'),
  priceCop: integer('price_cop'),                       // null si no aplica
  priceLabel: varchar('price_label', { length: 50 }),   // "Gratis", "Cotización", "Consultar"
  showPrice: boolean('show_price').default(false).notNull(),
  vehicleLimit: integer('vehicle_limit'),               // null = ilimitado
  modules: jsonb('modules').$type<string[]>().default([]).notNull(),
  highlights: jsonb('highlights').$type<string[]>().default([]).notNull(),
  highlighted: boolean('highlighted').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PlatformPlan = typeof platformPlans.$inferSelect;
export type NewPlatformPlan = typeof platformPlans.$inferInsert;
