import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from './auth';

describe('loginSchema', () => {
  it('acepta email y password válidos', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: '12345678' });
    expect(r.success).toBe(true);
  });
  it('rechaza email inválido', () => {
    const r = loginSchema.safeParse({ email: 'no-es-email', password: '12345678' });
    expect(r.success).toBe(false);
  });
  it('rechaza password corto', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: '1234' });
    expect(r.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('acepta payload válido', () => {
    const r = registerSchema.safeParse({
      tenantName: 'Flotas',
      tenantSlug: 'flotas',
      adminName: 'Juan',
      email: 'a@b.com',
      password: '12345678',
      acceptTerms: true,
      acceptHabeasData: true,
    });
    expect(r.success).toBe(true);
  });
  it('rechaza slug con mayúsculas', () => {
    const r = registerSchema.safeParse({
      tenantName: 'Flotas',
      tenantSlug: 'FLOTAS',
      adminName: 'Juan',
      email: 'a@b.com',
      password: '12345678',
      acceptTerms: true,
      acceptHabeasData: true,
    });
    expect(r.success).toBe(false);
  });
  it('exige aceptar términos y habeas data', () => {
    const r = registerSchema.safeParse({
      tenantName: 'F',
      tenantSlug: 'f',
      adminName: 'J',
      email: 'a@b.com',
      password: '12345678',
      acceptTerms: false,
      acceptHabeasData: true,
    });
    expect(r.success).toBe(false);
  });
});
