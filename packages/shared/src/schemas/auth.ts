import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export const registerSchema = z.object({
  tenantName: z.string().min(2, 'Nombre del intermediario'),
  tenantSlug: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(64, 'Máximo 64')
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  adminName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar los términos' }) }),
  acceptHabeasData: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar Habeas Data' }) }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
