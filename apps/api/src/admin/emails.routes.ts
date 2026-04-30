import type { FastifyInstance } from 'fastify';
import { desc } from 'drizzle-orm';
import { getDb, emailLog } from '@nexo/db';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';

export async function registerAdminEmailsRoutes(app: FastifyInstance) {
  app.get('/admin/emails', { preHandler: [authMiddleware, requireRole('super_admin')] }, async () => {
    const db = getDb();
    const list = await db.select().from(emailLog).orderBy(desc(emailLog.createdAt)).limit(200);
    return { emails: list };
  });
}
