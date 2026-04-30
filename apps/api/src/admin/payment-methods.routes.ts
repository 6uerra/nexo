import type { FastifyInstance } from 'fastify';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, platformPaymentMethods } from '@nexo/db';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
import { HttpError } from '../common/error-handler.js';

const upsertSchema = z.object({
  label: z.string().min(1).max(100),
  kind: z.enum(['qr', 'bank', 'mercado_pago']),
  qrImageUrl: z.string().url().nullish().or(z.literal('')),
  bankName: z.string().max(100).nullish().or(z.literal('')),
  bankAccount: z.string().max(100).nullish().or(z.literal('')),
  bankAccountType: z.string().max(32).nullish().or(z.literal('')),
  holderName: z.string().max(200).nullish().or(z.literal('')),
  holderDocument: z.string().max(32).nullish().or(z.literal('')),
  link: z.string().url().nullish().or(z.literal('')),
  instructions: z.string().nullish().or(z.literal('')),
  isActive: z.boolean().default(true),
  sortOrder: z.string().max(10).default('0'),
});

export async function registerAdminPaymentMethodRoutes(app: FastifyInstance) {
  // Super-admin: lista (incluye inactivos)
  app.get(
    '/admin/payment-methods',
    { preHandler: [authMiddleware, requireRole('super_admin')] },
    async () => {
      const db = getDb();
      const list = await db.select().from(platformPaymentMethods).orderBy(asc(platformPaymentMethods.sortOrder));
      return { methods: list };
    },
  );

  app.post(
    '/admin/payment-methods',
    { preHandler: [authMiddleware, requireRole('super_admin')] },
    async (req) => {
      const body = upsertSchema.parse(req.body);
      const db = getDb();
      const [m] = await db.insert(platformPaymentMethods).values({
        ...body,
        qrImageUrl: emptyToNull(body.qrImageUrl),
        bankName: emptyToNull(body.bankName),
        bankAccount: emptyToNull(body.bankAccount),
        bankAccountType: emptyToNull(body.bankAccountType),
        holderName: emptyToNull(body.holderName),
        holderDocument: emptyToNull(body.holderDocument),
        link: emptyToNull(body.link),
        instructions: emptyToNull(body.instructions),
      }).returning();
      return { method: m };
    },
  );

  app.put(
    '/admin/payment-methods/:id',
    { preHandler: [authMiddleware, requireRole('super_admin')] },
    async (req) => {
      const { id } = req.params as { id: string };
      const body = upsertSchema.partial().parse(req.body);
      const db = getDb();
      const [m] = await db
        .update(platformPaymentMethods)
        .set({
          ...body,
          qrImageUrl: 'qrImageUrl' in body ? emptyToNull(body.qrImageUrl) : undefined,
          bankName: 'bankName' in body ? emptyToNull(body.bankName) : undefined,
          bankAccount: 'bankAccount' in body ? emptyToNull(body.bankAccount) : undefined,
          bankAccountType: 'bankAccountType' in body ? emptyToNull(body.bankAccountType) : undefined,
          holderName: 'holderName' in body ? emptyToNull(body.holderName) : undefined,
          holderDocument: 'holderDocument' in body ? emptyToNull(body.holderDocument) : undefined,
          link: 'link' in body ? emptyToNull(body.link) : undefined,
          instructions: 'instructions' in body ? emptyToNull(body.instructions) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(platformPaymentMethods.id, id))
        .returning();
      if (!m) throw new HttpError(404, 'Método no encontrado');
      return { method: m };
    },
  );

  app.delete(
    '/admin/payment-methods/:id',
    { preHandler: [authMiddleware, requireRole('super_admin')] },
    async (req) => {
      const { id } = req.params as { id: string };
      const db = getDb();
      await db.delete(platformPaymentMethods).where(eq(platformPaymentMethods.id, id));
      return { ok: true };
    },
  );
}

function emptyToNull(v: string | null | undefined): string | null {
  if (v === undefined) return null;
  if (v === null || v === '') return null;
  return v;
}
