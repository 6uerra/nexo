import { z } from 'zod';

export const ownerCreateSchema = z.object({
  fullName: z.string().min(2, 'Mínimo 2 caracteres').max(200),
  document: z.string().min(5, 'Mínimo 5 caracteres').max(32),
  documentType: z.enum(['CC', 'CE', 'NIT', 'PA']).default('CC'),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  phone: z.string().max(32).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  bankInfo: z.object({
    bank: z.string().optional(),
    account: z.string().optional(),
    accountType: z.string().optional(),
  }).optional(),
  isActive: z.boolean().default(true),
});

export const driverCreateSchema = z.object({
  fullName: z.string().min(2).max(200),
  document: z.string().min(5).max(32),
  documentType: z.enum(['CC', 'CE', 'PA']).default('CC'),
  licenseNumber: z.string().max(32).optional().or(z.literal('')),
  licenseCategory: z.enum(['B1', 'B2', 'B3', 'C1', 'C2', 'C3']).optional(),
  licenseExpiresAt: z.string().optional().or(z.literal('')),
  eps: z.string().max(100).optional().or(z.literal('')),
  arl: z.string().max(100).optional().or(z.literal('')),
  pension: z.string().max(100).optional().or(z.literal('')),
  medicalExamAt: z.string().optional().or(z.literal('')),
  medicalExamExpiresAt: z.string().optional().or(z.literal('')),
  phone: z.string().max(32).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const vehicleCreateSchema = z.object({
  ownerId: z.string().uuid().optional(),
  plate: z.string().min(3, 'Placa requerida').max(16).regex(/^[A-Z0-9-]+$/i, 'Solo letras, números y guion'),
  type: z.enum(['car_4x4', 'sedan', 'minivan', 'bus', 'truck', 'pickup', 'other']),
  brand: z.string().max(100).optional().or(z.literal('')),
  model: z.string().max(100).optional().or(z.literal('')),
  year: z.number().int().min(1950).max(2100).optional(),
  color: z.string().max(50).optional().or(z.literal('')),
  capacity: z.number().int().min(1).max(100).optional(),
  soatExpiresAt: z.string().optional().or(z.literal('')),
  rtmExpiresAt: z.string().optional().or(z.literal('')),
  insuranceExpiresAt: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'maintenance', 'sold']).default('active'),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type OwnerInput = z.infer<typeof ownerCreateSchema>;
export type DriverInput = z.infer<typeof driverCreateSchema>;
export type VehicleInput = z.infer<typeof vehicleCreateSchema>;
