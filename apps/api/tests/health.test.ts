import { describe, it, expect, beforeAll } from 'vitest';
import { waitForApi } from './setup.js';

describe('health', () => {
  beforeAll(async () => {
    await waitForApi();
  });

  it('GET /health responde ok', async () => {
    const r = await fetch(`${process.env.TEST_API_URL ?? 'http://localhost:3001'}/health`);
    expect(r.ok).toBe(true);
    const data = await r.json();
    expect(data.ok).toBe(true);
  });
});
