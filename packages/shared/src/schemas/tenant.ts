import { z } from 'zod';

export const tenantOnboardingSchema = z.object({
  legalName: z.string().min(2),
  nit: z.string().min(5),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(5),
  city: z.string().min(2),
});

export type TenantOnboardingInput = z.infer<typeof tenantOnboardingSchema>;
