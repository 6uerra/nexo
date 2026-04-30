import type { FastifyInstance } from 'fastify';
import { and, eq, desc, isNull } from 'drizzle-orm';
import { getDb, notifications } from '@nexo/db';
import { authMiddleware } from '../auth/auth.middleware.js';
import { HttpError } from '../common/error-handler.js';

export async function registerNotificationRoutes(app: FastifyInstance) {
  app.get('/notifications', { preHandler: [authMiddleware] }, async (req) => {
    const db = getDb();
    const list = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, req.session!.userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    return { notifications: list };
  });

  app.get('/notifications/unread-count', { preHandler: [authMiddleware] }, async (req) => {
    const db = getDb();
    const list = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, req.session!.userId), isNull(notifications.readAt)));
    return { count: list.length };
  });

  app.post('/notifications/:id/read', { preHandler: [authMiddleware] }, async (req) => {
    const { id } = req.params as { id: string };
    const db = getDb();
    await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, id));
    return { ok: true };
  });

  app.post('/notifications/read-all', { preHandler: [authMiddleware] }, async (req) => {
    const db = getDb();
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, req.session!.userId), isNull(notifications.readAt)));
    return { ok: true };
  });
}
