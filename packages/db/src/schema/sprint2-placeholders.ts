// Placeholders para sprints 2-4. Tablas mínimas que ya quedan listas para extender.
import { pgTable, uuid, varchar, timestamp, text, integer, date, jsonb, index, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

// ============ SPRINT 2 ============

export const vehicleStatusEnum = pgEnum('vehicle_status', ['active', 'inactive', 'maintenance', 'sold']);
export const vehicleTypeEnum = pgEnum('vehicle_type', ['car_4x4', 'sedan', 'minivan', 'bus', 'truck', 'pickup', 'other']);

export const owners = pgTable(
  'owners',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    fullName: varchar('full_name', { length: 200 }).notNull(),
    document: varchar('document', { length: 32 }).notNull(),
    documentType: varchar('document_type', { length: 16 }).default('CC').notNull(),
    email: varchar('email', { length: 200 }),
    phone: varchar('phone', { length: 32 }),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    bankInfo: jsonb('bank_info').$type<{ bank?: string; account?: string; accountType?: string }>(),
    notes: text('notes'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ tenantIdx: index('owners_tenant_idx').on(t.tenantId) }),
);

export const drivers = pgTable(
  'drivers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    fullName: varchar('full_name', { length: 200 }).notNull(),
    document: varchar('document', { length: 32 }).notNull(),
    documentType: varchar('document_type', { length: 16 }).default('CC').notNull(),
    licenseNumber: varchar('license_number', { length: 32 }),
    licenseCategory: varchar('license_category', { length: 8 }),
    licenseExpiresAt: date('license_expires_at'),
    eps: varchar('eps', { length: 100 }),
    arl: varchar('arl', { length: 100 }),
    pension: varchar('pension', { length: 100 }),
    medicalExamAt: date('medical_exam_at'),
    medicalExamExpiresAt: date('medical_exam_expires_at'),
    phone: varchar('phone', { length: 32 }),
    email: varchar('email', { length: 200 }),
    photoUrl: text('photo_url'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ tenantIdx: index('drivers_tenant_idx').on(t.tenantId) }),
);

export const vehicles = pgTable(
  'vehicles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    ownerId: uuid('owner_id').references(() => owners.id, { onDelete: 'set null' }),
    plate: varchar('plate', { length: 16 }).notNull(),
    type: vehicleTypeEnum('type').notNull(),
    brand: varchar('brand', { length: 100 }),
    model: varchar('model', { length: 100 }),
    year: integer('year'),
    color: varchar('color', { length: 50 }),
    chassis: varchar('chassis', { length: 64 }),
    engine: varchar('engine', { length: 64 }),
    capacity: integer('capacity'),
    soatExpiresAt: date('soat_expires_at'),
    rtmExpiresAt: date('rtm_expires_at'),
    insuranceExpiresAt: date('insurance_expires_at'),
    photoUrl: text('photo_url'),
    documents: jsonb('documents').$type<Array<{ kind: string; url: string; expiresAt?: string }>>(),
    status: vehicleStatusEnum('status').default('active').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('vehicles_tenant_idx').on(t.tenantId),
    plateIdx: index('vehicles_plate_idx').on(t.plate),
  }),
);

// ============ SPRINT 3 ============

export const clients = pgTable(
  'clients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    legalName: varchar('legal_name', { length: 200 }).notNull(),
    nit: varchar('nit', { length: 32 }).notNull(),
    contactName: varchar('contact_name', { length: 200 }),
    email: varchar('email', { length: 200 }),
    phone: varchar('phone', { length: 32 }),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    notes: text('notes'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ tenantIdx: index('clients_tenant_idx').on(t.tenantId) }),
);

export const contractTypeEnum = pgEnum('contract_type', ['indefinite', 'fixed_term']);
export const contractStatusEnum = pgEnum('contract_status', ['draft', 'active', 'suspended', 'finished', 'cancelled']);

export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 32 }).notNull(),
    clientId: uuid('client_id').notNull().references(() => clients.id),
    vehicleId: uuid('vehicle_id').references(() => vehicles.id),
    driverId: uuid('driver_id').references(() => drivers.id),
    type: contractTypeEnum('type').notNull(),
    status: contractStatusEnum('status').default('draft').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    monthlyAmountCop: integer('monthly_amount_cop'),
    routeText: text('route_text'),
    pdfUrl: text('pdf_url'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ tenantIdx: index('contracts_tenant_idx').on(t.tenantId) }),
);

// ============ SPRINT 4 ============

export const maintenanceTypeEnum = pgEnum('maintenance_type', [
  'oil_change', 'tires', 'alignment', 'engine_wash', 'brakes', 'extinguisher', 'general', 'other',
]);

export const maintenances = pgTable(
  'maintenances',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    vehicleId: uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
    type: maintenanceTypeEnum('type').notNull(),
    performedAt: date('performed_at').notNull(),
    nextDueAt: date('next_due_at'),
    nextDueKm: integer('next_due_km'),
    odometerKm: integer('odometer_km'),
    workshop: varchar('workshop', { length: 200 }),
    costCop: integer('cost_cop').default(0).notNull(),
    invoiceUrl: text('invoice_url'),
    notes: text('notes'),
    deductFromOwner: boolean('deduct_from_owner').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('maint_tenant_idx').on(t.tenantId),
    vehicleIdx: index('maint_vehicle_idx').on(t.vehicleId),
  }),
);

export const invoiceDirectionEnum = pgEnum('invoice_direction', ['client_charge', 'owner_payout']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'issued', 'paid', 'overdue', 'cancelled']);

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    direction: invoiceDirectionEnum('direction').notNull(),
    code: varchar('code', { length: 32 }).notNull(),
    counterpartyClientId: uuid('counterparty_client_id').references(() => clients.id),
    counterpartyOwnerId: uuid('counterparty_owner_id').references(() => owners.id),
    contractId: uuid('contract_id').references(() => contracts.id),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    grossAmountCop: integer('gross_amount_cop').notNull(),
    deductionsCop: integer('deductions_cop').default(0).notNull(),
    netAmountCop: integer('net_amount_cop').notNull(),
    status: invoiceStatusEnum('status').default('draft').notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ tenantIdx: index('invoices_tenant_idx').on(t.tenantId) }),
);
