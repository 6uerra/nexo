import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { NavSidebar } from '@/components/nav-sidebar';
import { NavMobile } from '@/components/nav-mobile';
import { Topbar } from '@/components/topbar';
import { SubscriptionStatusBanner } from '@/components/subscription-status-banner';
import { Logo } from '@/components/logo';
import { MODULE_KEYS } from '@nexo/shared';

async function getServerSession() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  if (!token) return null;
  try {
    const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
    const r = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
      cache: 'no-store',
    });
    if (!r.ok) return null;
    return (await r.json()) as { session: import('@nexo/shared').AuthSession };
  } catch {
    return null;
  }
}

async function getEnabledModules(token: string): Promise<string[]> {
  try {
    const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
    const r = await fetch(`${apiUrl}/api/v1/modules`, {
      headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
      cache: 'no-store',
    });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.modules as Array<{ moduleKey: string; enabled: boolean }>).filter((m) => m.enabled).map((m) => m.moduleKey);
  } catch {
    return [];
  }
}

async function getSubscription(token: string) {
  try {
    const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
    const r = await fetch(`${apiUrl}/api/v1/subscriptions/me`, {
      headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
      cache: 'no-store',
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.subscription ?? null;
  } catch {
    return null;
  }
}

function isBlocked(sub: any): boolean {
  if (!sub) return false;
  if (sub.status === 'blocked' || sub.status === 'cancelled') return true;
  if (sub.blockAt && new Date(sub.blockAt) < new Date()) return true;
  return false;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const data = await getServerSession();
  if (!data) redirect('/login');
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value ?? '';
  const isAdmin = data.session.role === 'super_admin';

  const enabledModules = isAdmin ? [...MODULE_KEYS] : await getEnabledModules(token);
  const subscription = isAdmin ? null : await getSubscription(token);
  const blocked = !isAdmin && isBlocked(subscription);

  // Cuando el cliente está bloqueado: layout minimalista (solo header con logo + logout).
  // Sin sidebar de operación. Ya el middleware bloqueó las rutas, pero por si acaso.
  if (blocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 lg:px-6">
            <Logo />
            <form action="/api/v1/auth/logout" method="post">
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink hover:bg-background cursor-pointer">
                <LogOut className="h-3.5 w-3.5" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </header>
        <SubscriptionStatusBanner subscription={subscription} />
        <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 lg:px-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <NavSidebar session={data.session} enabledModules={enabledModules} />
      <div className="flex-1 flex flex-col min-w-0">
        {!isAdmin && <SubscriptionStatusBanner subscription={subscription} />}
        <Topbar session={data.session} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 pb-24 lg:pb-8">{children}</main>
      </div>
      <NavMobile session={data.session} />
    </div>
  );
}
