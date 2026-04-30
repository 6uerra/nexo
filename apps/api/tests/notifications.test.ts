import { describe, it, expect, beforeAll } from 'vitest';
import { http, login, waitForApi } from './setup.js';

describe('notifications', () => {
  beforeAll(async () => {
    await waitForApi();
  });

  it('admin recibe lista de notificaciones (puede estar vacía)', async () => {
    const cookie = await login('admin@demo.local', 'Demo2026!');
    const r = await http('/notifications', { cookie });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.data.notifications)).toBe(true);
  });

  it('unread-count devuelve número', async () => {
    const cookie = await login('admin@demo.local', 'Demo2026!');
    const r = await http('/notifications/unread-count', { cookie });
    expect(r.status).toBe(200);
    expect(typeof r.data.count).toBe('number');
  });
});
