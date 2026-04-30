import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifySession } from './jwt.js';
import { config } from '../config.js';
import { HttpError } from '../common/error-handler.js';
import { getDb, subscriptions, tenants } from '@nexo/db';
import { and, eq } from 'drizzle-orm';
import type { AuthSession } from '@nexo/shared';

declare module 'fastify' {
  interface FastifyRequest {
    session?: AuthSession;
    isBlocked?: boolean;
  }
}

export async function authMiddleware(req: FastifyRequest, _reply: FastifyReply) {
  const cookieToken = req.cookies?.[config.cookieName];
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const token = cookieToken ?? headerToken;
  if (!token) throw new HttpError(401, 'No autenticado');
  const session = verifySession(token);
  if (!session) throw new HttpError(401, 'Sesión inválida');
  req.session = session;
}

export function requireRole(...roles: AuthSession['role'][]) {
  return async (req: FastifyRequest) => {
    if (!req.session) throw new HttpError(401, 'No autenticado');
    if (!roles.includes(req.session.role)) throw new HttpError(403, 'No autorizado');
  };
}

/**
 * Verifica si el tenant está bloqueado por suscripción.
 * Super-admin ignora el bloqueo (puede entrar siempre a admin).
 */
export async function subscriptionGuard(req: FastifyRequest) {
  if (!req.session) throw new HttpError(401, 'No autenticado');
  if (req.session.role === 'super_admin') return;
  if (!req.session.tenantId) return;

  const db = getDb();
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, req.session.tenantId)).limit(1);
  if (!tenant) throw new HttpError(404, 'Tenant no encontrado');
  if (!tenant.isActive) {
    throw new HttpError(403, 'Tenant inactivo');
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, req.session.tenantId))
    .limit(1);
  if (!sub) return; // sin suscripción: open mode (puede ser tenant nuevo en onboarding)

  const now = new Date();
  if (sub.status === 'blocked' || sub.status === 'cancelled') {
    throw new HttpError(402, 'Suscripción bloqueada. Contacta al administrador.');
  }
  if (now > sub.blockAt) {
    // Auto-mark blocked
    await db
      .update(subscriptions)
      .set({ status: 'blocked', updatedAt: new Date() })
      .where(eq(subscriptions.id, sub.id));
    throw new HttpError(402, 'Suscripción bloqueada por falta de pago.');
  }
}
