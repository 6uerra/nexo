import type { FastifyInstance } from 'fastify';
import { eq, desc, asc } from 'drizzle-orm';
import {
  getDb, owners, drivers, vehicles, clients, contracts, maintenances, invoices,
} from '@nexo/db';
import { authMiddleware, subscriptionGuard } from '../auth/auth.middleware.js';
import { HttpError } from '../common/error-handler.js';

/**
 * Read-only listings scoped al tenant del usuario. CRUD completo llega en
 * sprints 2-4. Por ahora estos endpoints sirven la data dummy del seed.
 */
export async function registerViewRoutes(app: FastifyInstance) {
  app.get('/owners', { preHandler: [authMiddleware, subscriptionGuard] }, async (req) => {
    const tid = req.session?.tenantId;
    if (!tid) return { owners: [] };
    const db = getDb();
    const list = await db.select().from(owners).where(eq(owners.tenantId, tid)).orderBy(asc(owners.fullName));
    return { owners: list };
  });

  app.get('/drivers', { preHandler: [authMiddleware, subscriptionGuard] }, async (req) => {
    const tid = req.session?.tenantId;
    if (!tid) return { drivers: [] };
    const db = getDb();
    const list = await db.select().from(drivers).where(eq(drivers.tenantId, tid)).orderBy(asc(drivers.fullName));
    return { drivers: list };
  });

  app.get('/vehicles', { preHandler: [authMiddleware, subscriptionGuard] }, async (req) => {
    const tid = req.session?.tenantId;
    if (!tid) return { vehicles: [] };
    const db = getDb();
    const list = await db.select({
      v: vehicles,
      ownerName: owners.fullName,
    }).from(vehicles)
      .leftJoin(owners, eq(vehicles.ownerId, owners.id))
      .where(eq(vehicles.tenantId, tid))
      .orderBy(asc(vehicles.plate));
    return { vehicles: list.map((r) => ({ ...r.v, ownerName: r.ownerName })) };
  });

  app.get('/clients', { preHandler: [authMiddleware, subscriptionGuard] }, async (req) => {
    const tid = req.session?.tenantId;
    if (!tid) return { clients: [] };
    const db = getDb();
    const list = await db.select().from(clients).where(eq(clients.tenantId, tid)).orderBy(asc(clients.legalName));
    return { clients: list };
  });

  app.get('/contracts', { preHandler: [authMiddleware, subscriptionGuard] }, async (req) => {
    const tid = req.session?.tenantId;
    if (!tid) return { contracts: [] };
    const db = getDb();
    const list = await db.select({
      c: contracts,
      clientName: clients.legalName,
      vehiclePlate: vehicles.plate,
      driverName: drivers.fullName,
    }).from(contracts)
      .leftJoin(clients, eq(contracts.clientId, clients.id))
      .leftJoin(vehicles, eq(contracts.vehicleId, vehicles.id))
      .leftJoin(drivers, eq(contracts.driverId, drivers.id))
      .where(eq(contracts.tenantId, tid))
      .orderBy(desc(contracts.createdAt));
    return {
      contracts: list.map((r) => ({
        ...r.c, clientName: r.clientName, vehiclePlate: r.vehiclePlate, driverName: r.driverName,
      })),
    };
  });

  app.get('/maintenance', { preHandler: [authMiddleware, subscriptionGuard] }, async (req) => {
    const tid = req.session?.tenantId;
    if (!tid) return { maintenances: [] };
    const db = getDb();
    const list = await db.select({
      m: maintenances,
      vehiclePlate: vehicles.plate,
    }).from(maintenances)
      .leftJoin(vehicles, eq(maintenances.vehicleId, vehicles.id))
      .where(eq(maintenances.tenantId, tid))
      .orderBy(desc(maintenances.performedAt));
    return { maintenances: list.map((r) => ({ ...r.m, vehiclePlate: r.vehiclePlate })) };
  });

  app.get('/invoices', { preHandler: [authMiddleware, subscriptionGuard] }, async (req) => {
    const tid = req.session?.tenantId;
    if (!tid) return { invoices: [] };
    const db = getDb();
    const list = await db.select({
      i: invoices,
      clientName: clients.legalName,
      ownerName: owners.fullName,
    }).from(invoices)
      .leftJoin(clients, eq(invoices.counterpartyClientId, clients.id))
      .leftJoin(owners, eq(invoices.counterpartyOwnerId, owners.id))
      .where(eq(invoices.tenantId, tid))
      .orderBy(desc(invoices.createdAt));
    return {
      invoices: list.map((r) => ({
        ...r.i,
        counterpartyName: r.clientName ?? r.ownerName ?? '—',
      })),
    };
  });
}
