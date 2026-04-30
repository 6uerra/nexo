import 'dotenv/config';

const BASE = process.env.TEST_API_URL ?? 'http://localhost:3001';

export interface ApiResponse<T = any> {
  status: number;
  data: T;
  cookies: string[];
}

export async function http<T = any>(
  path: string,
  opts: { method?: string; json?: unknown; cookie?: string; headers?: Record<string, string> } = {},
): Promise<ApiResponse<T>> {
  const baseHeaders: Record<string, string> = {};
  if (opts.json !== undefined) baseHeaders['Content-Type'] = 'application/json';
  if (opts.cookie) baseHeaders['cookie'] = opts.cookie;
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method: opts.method ?? 'GET',
    headers: { ...baseHeaders, ...(opts.headers ?? {}) },
    body: opts.json !== undefined ? JSON.stringify(opts.json) : undefined,
  });
  const cookies: string[] = [];
  res.headers.getSetCookie?.().forEach((c) => cookies.push(c));
  let data: any = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data, cookies };
}

export function extractCookie(setCookies: string[], name: string): string | null {
  for (const c of setCookies) {
    const match = c.match(new RegExp(`^${name}=([^;]+)`));
    if (match) return `${name}=${match[1]}`;
  }
  return null;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await http('/auth/login', { method: 'POST', json: { email, password } });
  if (res.status !== 200) throw new Error(`Login failed (${res.status}): ${JSON.stringify(res.data)}`);
  const cookie = extractCookie(res.cookies, process.env.SESSION_COOKIE_NAME ?? 'nexo_session');
  if (!cookie) throw new Error('No session cookie returned');
  return cookie;
}

export async function waitForApi(maxSeconds = 30): Promise<void> {
  for (let i = 0; i < maxSeconds; i++) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`API no respondió en ${maxSeconds}s en ${BASE}/health`);
}
