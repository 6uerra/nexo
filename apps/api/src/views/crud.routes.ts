import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { getDb, owners, drivers, vehicles } from '@nexo/db';
import { ownerCreateSchema, driverCreateSchema, vehicleCreateSchema } from '@nexo/shared';
import { authMiddleware, subscriptionGuard, requireRole } from '../auth/auth.middleware.js';
import { HttpError } from '../common/error-handler.js';

const empty2null = (v: any) => (v === '' || v === undefined ? null : v);
const dateOrNull = (v: any) => (v === '' || v === undefined || v === null ? null : v);

function tenantScopedOnly<T extends { tenantId: string | null }>(req: any, row: T | undefined, label: string): asserts row {
  if (!row) throw new HttpError(404, `${label} no encontrado`);
  if (row.tenantId !== req.session.tenantId) throw new HttpError(403, 'No autorizado');
}

const writerGuards = [authMiddleware, subscriptionGuard, requireRole('tenant_admin', 'super_admin')];

export async function registerCrudRoutes(app: FastifyInstance) {
  // ============ OWNERS ============
  app.post('/owners', { preHandler: writerGuards }, async (req) => {
    const body = ownerCreateSchema.parse(req.body);
    if (!req.session?.tenantId) throw new HttpError(400, 'Sin tenant');
    const db = getDb();
    const [row] = await db.insert(owners).values({
      tenantId: req.session.tenantId,
      fullName: body.fullName,
      document: body.document,
      documentType: body.documentType,
      email: empty2null(body.email),
      phone: empty2null(body.phone),
      city: empty2null(body.city),
      address: empty2null(body.address),
      bankInfo: body.bankInfo as any,
      isActive: body.isActive,
    }).returning();
    return { owner: row };
  });

  app.put('/owners/:id', { preHandler: writerGuards }, async (req) => {
    const { id } = req.params as { id: string };
    const body = ownerCreateSchema.partial().parse(req.body);
    const db = getDb();
    const [existing] = await db.select().from(owners).where(eq(owners.id, id)).limit(1);
    tenantScopedOnly(req, existing, 'Propietario');
    const update: any = { updatedAt: new Date() };
    for (const k of ['fullName','document','documentType','isActive'] as const) if (k in body) update[k] = body[k];
    for (const k of ['email','phone','city','address'] as const) if (k in body) update[k] = empty2null(body[k]);
    if ('bankInfo' in body) update.bankInfo = body.bankInfo;
    const [row] = await db.update(owners).set(update).where(eq(owners.id, id)).returning();
    return { owner: row };
  });

  app.delete('/owners/:id', { preHandler: writerGuards }, async (req) => {
    const { id } = req.params as { id: string };
    const db = getDb();
    const [existing] = await db.select().from(owners).where(eq(owners.id, id)).limit(1);
    tenantScopedOnly(req, existing, 'Propietario');
    await db.delete(owners).where(eq(owners.id, id));
    return { ok: true };
  });

  // ============ DRIVERS ============
  app.post('/drivers', { preHandler: writerGuards }, async (req) => {
    const body = driverCreateSchema.parse(req.body);
    if (!req.session?.tenantId) throw new HttpError(400, 'Sin tenant');
    const db = getDb();
    const [row] = await db.insert(drivers).values({
      tenantId: req.session.tenantId,
      fullName: body.fullName,
      document: body.document,
      documentType: body.documentType,
      licenseNumber: empty2null(body.licenseNumber),
      licenseCategory: empty2null(body.licenseCategory),
      licenseExpiresAt: dateOrNull(body.licenseExpiresAt),
      eps: empty2null(body.eps),
      arl: empty2null(body.arl),
      pension: empty2null(body.pension),
      medicalExamAt: dateOrNull(body.medicalExamAt),
      medicalExamExpiresAt: dateOrNull(body.medicalExamExpiresAt),
      phone: empty2null(body.phone),
      email: empty2null(body.email),
      isActive: body.isActive,
    }).returning();
    return { driver: row };
  });

  app.put('/drivers/:id', { preHandler: writerGuards }, async (req) => {
    const { id } = req.params as { id: string };
    const body = driverCreateSchema.partial().parse(req.body);
    const db = getDb();
    const [existing] = await db.select().from(drivers).where(eq(drivers.id, id)).limit(1);
    tenantScopedOnly(req, existing, 'Conductor');
    const update: any = { updatedAt: new Date() };
    for (const k of ['fullName','document','documentType','isActive'] as const) if (k in body) update[k] = body[k];
    for (const k of ['licenseNumber','licenseCategory','eps','arl','pension','phone','email'] as const) if (k in body) update[k] = empty2null(body[k]);
    for (const k of ['licenseExpiresAt','medicalExamAt','medicalExamExpiresAt'] as const) if (k in body) update[k] = dateOrNull(body[k]);
    const [row] = await db.update(drivers).set(update).where(eq(drivers.id, id)).returning();
    return { driver: row };
  });

  app.delete('/drivers/:id', { preHandler: writerGuards }, async (req) => {
    const { id } = req.params as { id: string };
    const db = getDb();
    const [existing] = await db.select().from(drivers).where(eq(drivers.id, id)).limit(1);
    tenantScopedOnly(req, existing, 'Conductor');
    await db.delete(drivers).where(eq(drivers.id, id));
    return { ok: true };
  });

  // ============ VEHICLES ============
  app.post('/vehicles', { preHandler: writerGuards }, async (req) => {
    const body = vehicleCreateSchema.parse(req.body);
    if (!req.session?.tenantId) throw new HttpError(400, 'Sin tenant');
    const db = getDb();
    const [row] = await db.insert(vehicles).values({
      tenantId: req.session.tenantId,
      ownerId: empty2null(body.ownerId),
      plate: body.plate.toUpperCase(),
      type: body.type,
      brand: empty2null(body.brand),
      model: empty2null(body.model),
      year: body.year ?? null,
      color: empty2null(body.color),
      capacity: body.capacity ?? null,
      soatExpiresAt: dateOrNull(body.soatExpiresAt),
      rtmExpiresAt: dateOrNull(body.rtmExpiresAt),
      insuranceExpiresAt: dateOrNull(body.insuranceExpiresAt),
      status: body.status,
      notes: empty2null(body.notes),
    }).returning();
    return { vehicle: row };
  });

  app.put('/vehicles/:id', { preHandler: writerGuards }, async (req) => {
    const { id } = req.params as { id: string };
    const body = vehicleCreateSchema.partial().parse(req.body);
    const db = getDb();
    const [existing] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
    tenantScopedOnly(req, existing, 'Vehículo');
    const update: any = { updatedAt: new Date() };
    if ('plate' in body && body.plate) update.plate = body.plate.toUpperCase();
    for (const k of ['type','status'] as const) if (k in body) update[k] = body[k];
    for (const k of ['brand','model','color','notes'] as const) if (k in body) update[k] = empty2null(body[k]);
    if ('ownerId' in body) update.ownerId = empty2null(body.ownerId);
    if ('year' in body) update.year = body.year ?? null;
    if ('capacity' in body) update.capacity = body.capacity ?? null;
    for (const k of ['soatExpiresAt','rtmExpiresAt','insuranceExpiresAt'] as const) if (k in body) update[k] = dateOrNull(body[k]);
    const [row] = await db.update(vehicles).set(update).where(eq(vehicles.id, id)).returning();
    return { vehicle: row };
  });

  app.delete('/vehicles/:id', { preHandler: writerGuards }, async (req) => {
    const { id } = req.params as { id: string };
    const db = getDb();
    const [existing] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
    tenantScopedOnly(req, existing, 'Vehículo');
    await db.delete(vehicles).where(eq(vehicles.id, id));
    return { ok: true };
  });
}
