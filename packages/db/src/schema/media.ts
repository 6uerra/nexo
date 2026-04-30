import { pgTable, uuid, varchar, timestamp, integer, text, pgEnum, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users } from './users';

export const mediaKindEnum = pgEnum('media_kind', ['image', 'video', 'document']);

/**
 * Media polimórfico. Se asocia a cualquier entidad por (entityType, entityId).
 * Ej. (entityType='vehicle', entityId='<uuid>') o (entityType='invoice', entityId='<uuid>')
 */
export const media = pgTable(
  'media',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id'),
    kind: mediaKindEnum('kind').notNull(),
    url: text('url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    mimeType: varchar('mime_type', { length: 100 }),
    sizeBytes: integer('size_bytes'),
    originalName: varchar('original_name', { length: 255 }),
    label: varchar('label', { length: 100 }),
    durationSec: integer('duration_sec'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('media_tenant_idx').on(t.tenantId),
    entityIdx: index('media_entity_idx').on(t.entityType, t.entityId),
  }),
);

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
