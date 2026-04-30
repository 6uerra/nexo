import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NavSidebar } from '@/components/nav-sidebar';
import { NavMobile } from '@/components/nav-mobile';
import { Topbar } from '@/components/topbar';
import { SubscriptionStatusBanner } from '@/components/subscription-status-banner';
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

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const data = await getServerSession();
  if (!data) redirect('/login');
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value ?? '';

  const isAdmin = data.session.role === 'super_admin';

  // El Admin tiene control total: nada bloqueado, todos los módulos visibles.
  const enabledModules = isAdmin ? [...MODULE_KEYS] : await getEnabledModules(token);

  // Banner persistente con estado de suscripción (sólo para clientes)
  const subscription = isAdmin ? null : await getSubscription(token);

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
