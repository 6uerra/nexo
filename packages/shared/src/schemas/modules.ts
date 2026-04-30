import { z } from 'zod';

export const moduleToggleSchema = z.object({
  moduleKey: z.string().min(1),
  enabled: z.boolean(),
});

export type ModuleToggleInput = z.infer<typeof moduleToggleSchema>;
