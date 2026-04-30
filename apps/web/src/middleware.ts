import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE = process.env.SESSION_COOKIE_NAME ?? 'nexo_session';
const API_URL = process.env.API_URL ?? 'http://localhost:3001';

// Cuando el cliente está bloqueado, sólo estos paths funcionan.
// Estricto: SOLO /settings/subscription (para pagar), /blocked (la pantalla),
// el logout vía /api/v1/auth/logout, y assets/recursos públicos.
const BLOCKED_ALLOWED = [
  '/blocked',
  '/settings/subscription',
  '/api/v1/auth/logout',
  '/api/v1/auth/me',
  '/api/v1/subscriptions',  // ver/registrar pago
  '/api/v1/payment-methods',
  '/api/v1/media/upload',   // subir comprobante
  '/_next',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/activate',
  '/roadmap',
  '/register',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (BLOCKED_ALLOWED.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname === '/' || pathname.startsWith('/admin')) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.next();

  try {
    const meR = await fetch(`${API_URL}/api/v1/auth/me`, { headers: { cookie: `${COOKIE}=${token}` } });
    if (!meR.ok) return NextResponse.next();
    const me = await meR.json();
    if (me?.session?.role === 'super_admin') return NextResponse.next();

    const subR = await fetch(`${API_URL}/api/v1/subscriptions/me`, { headers: { cookie: `${COOKIE}=${token}` } });
    if (!subR.ok) return NextResponse.next();
    const subData = await subR.json();
    const sub = subData?.subscription;
    if (!sub) return NextResponse.next();

    const blocked =
      sub.status === 'blocked' ||
      sub.status === 'cancelled' ||
      new Date(sub.blockAt) < new Date();

    if (blocked) {
      const url = req.nextUrl.clone();
      url.pathname = '/blocked';
      return NextResponse.redirect(url);
    }
  } catch {
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg|favicon.ico).*)'],
};
