import { describe, it, expect, beforeAll } from 'vitest';
import { http, login, waitForApi } from './setup.js';

describe('subscriptions', () => {
  beforeAll(async () => {
    await waitForApi();
  });

  it('admin demo tiene una suscripción en trial', async () => {
    const cookie = await login('admin@demo.local', 'Demo2026!');
    const r = await http('/subscriptions/me', { cookie });
    expect(r.status).toBe(200);
    expect(r.data.subscription).not.toBeNull();
    expect(['trial', 'active', 'past_due']).toContain(r.data.subscription.status);
  });

  it('payment-methods es público', async () => {
    const r = await http('/payment-methods');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.data.methods)).toBe(true);
  });

  it('tenant_admin puede registrar un pago', async () => {
    const cookie = await login('admin@demo.local', 'Demo2026!');
    const now = new Date();
    const next = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const r = await http('/subscriptions/me/payments', {
      method: 'POST',
      cookie,
      json: {
        amountCop: 50000,
        method: 'bank_transfer',
        reference: 'TEST-REF-' + Date.now(),
        coversFrom: now.toISOString(),
        coversTo: next.toISOString(),
      },
    });
    expect(r.status).toBe(200);
    expect(r.data.payment.status).toBe('submitted');
  });

});
