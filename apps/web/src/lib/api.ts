type FetchOpts = RequestInit & { json?: unknown };

const BASE = '/api/v1';

export async function api<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const headers: HeadersInit = { ...(opts.headers as Record<string, string>) };
  let body: BodyInit | undefined = opts.body as BodyInit | undefined;
  if (opts.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.json);
  }
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers,
    body,
    credentials: 'include',
  });
  if (!res.ok) {
    let detail: any = undefined;
    try { detail = await res.json(); } catch {}
    const err = new Error(detail?.message ?? `HTTP ${res.status}`) as Error & { status?: number; detail?: unknown };
    err.status = res.status;
    err.detail = detail;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function fetchSession() {
  try {
    return await api<{ session: import('@nexo/shared').AuthSession }>('/auth/me');
  } catch {
    return null;
  }
}
