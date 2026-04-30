import type { FastifyInstance } from 'fastify';
import { eq, and, count, sql } from 'drizzle-orm';
import { getDb, vehicles, drivers, owners, clients, contracts } from '@nexo/db';
import { authMiddleware, subscriptionGuard } from '../auth/auth.middleware.js';

export async function registerDashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard/kpis', { preHandler: [authMiddleware, subscriptionGuard] }, async (req) => {
    const db = getDb();
    const tenantId = req.session!.tenantId;
    if (!tenantId) {
      return {
        kpis: emptyKpis(),
      };
    }
    const [v] = await db.select({ c: count() }).from(vehicles).where(eq(vehicles.tenantId, tenantId));
    const [d] = await db.select({ c: count() }).from(drivers).where(eq(drivers.tenantId, tenantId));
    const [o] = await db.select({ c: count() }).from(owners).where(eq(owners.tenantId, tenantId));
    const [c] = await db.select({ c: count() }).from(clients).where(eq(clients.tenantId, tenantId));
    const [k] = await db
      .select({ c: count() })
      .from(contracts)
      .where(and(eq(contracts.tenantId, tenantId), eq(contracts.status, 'active')));
    return {
      kpis: {
        vehicles: v?.c ?? 0,
        drivers: d?.c ?? 0,
        owners: o?.c ?? 0,
        clients: c?.c ?? 0,
        activeContracts: k?.c ?? 0,
        revenueMonthCop: 0,   // placeholder Sprint 4
        upcomingExpirations: 0, // placeholder Sprint 4
      },
    };
  });
}

function emptyKpis() {
  return {
    vehicles: 0,
    drivers: 0,
    owners: 0,
    clients: 0,
    activeContracts: 0,
    revenueMonthCop: 0,
    upcomingExpirations: 0,
  };
}
