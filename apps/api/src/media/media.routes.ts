import type { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, media } from '@nexo/db';
import { uploadBuffer } from '../storage/s3.js';
import { authMiddleware, subscriptionGuard } from '../auth/auth.middleware.js';
import { HttpError } from '../common/error-handler.js';

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];
const ALLOWED_DOC = ['application/pdf', 'image/jpeg', 'image/png'];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;   // 10 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;  // 100 MB
const MAX_DOC_BYTES = 15 * 1024 * 1024;     // 15 MB

const uploadQuerySchema = z.object({
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid().optional(),
  kind: z.enum(['image', 'video', 'document']),
  label: z.string().max(100).optional(),
});

export async function registerMediaRoutes(app: FastifyInstance) {
  await app.register(multipart, {
    limits: { fileSize: MAX_VIDEO_BYTES },
  });

  app.post('/media/upload', { preHandler: [authMiddleware, subscriptionGuard] }, async (req) => {
    const query = uploadQuerySchema.parse(req.query);

    const part = await req.file();
    if (!part) throw new HttpError(400, 'No se envió archivo (campo: file)');

    const buffer = await part.toBuffer();
    const mimeType = part.mimetype;
    const originalName = part.filename ?? 'upload';

    let allowed: string[];
    let maxBytes: number;
    if (query.kind === 'image') { allowed = ALLOWED_IMAGE; maxBytes = MAX_IMAGE_BYTES; }
    else if (query.kind === 'video') { allowed = ALLOWED_VIDEO; maxBytes = MAX_VIDEO_BYTES; }
    else { allowed = ALLOWED_DOC; maxBytes = MAX_DOC_BYTES; }

    if (!allowed.includes(mimeType)) {
      throw new HttpError(400, `Mime no permitido para ${query.kind}: ${mimeType}`);
    }
    if (buffer.length > maxBytes) {
      throw new HttpError(413, `Archivo demasiado grande (max ${Math.round(maxBytes / 1024 / 1024)}MB)`);
    }

    const tenantId = req.session!.tenantId;
    const uploaded = await uploadBuffer(tenantId, query.entityType, originalName, mimeType, buffer);

    const db = getDb();
    const [row] = await db.insert(media).values({
      tenantId,
      entityType: query.entityType,
      entityId: query.entityId,
      kind: query.kind,
      url: uploaded.url,
      mimeType,
      sizeBytes: uploaded.size,
      originalName,
      label: query.label,
      createdBy: req.session!.userId,
    }).returning();

    return { media: row };
  });

  app.get('/media', { preHandler: [authMiddleware] }, async (req) => {
    const { entityType, entityId } = req.query as { entityType?: string; entityId?: string };
    const tenantId = req.session!.tenantId;
    const db = getDb();
    const conds = [];
    if (tenantId) conds.push(eq(media.tenantId, tenantId));
    if (entityType) conds.push(eq(media.entityType, entityType));
    if (entityId) conds.push(eq(media.entityId, entityId));
    const list = await db
      .select()
      .from(media)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(media.createdAt))
      .limit(100);
    return { media: list };
  });

  app.delete('/media/:id', { preHandler: [authMiddleware, subscriptionGuard] }, async (req) => {
    const { id } = req.params as { id: string };
    const db = getDb();
    const [m] = await db.select().from(media).where(eq(media.id, id)).limit(1);
    if (!m) throw new HttpError(404, 'No encontrado');
    if (m.tenantId !== req.session!.tenantId && req.session!.role !== 'super_admin') {
      throw new HttpError(403, 'No autorizado');
    }
    await db.delete(media).where(eq(media.id, id));
    return { ok: true };
  });
}
