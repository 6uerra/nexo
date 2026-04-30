import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Truck, Users, ShieldCheck, Building2, FileSignature, AlertTriangle, Wallet, Calendar } from 'lucide-react';
import { KpiCard } from '@/components/kpi-card';
import { PlanBanner } from '@/components/plan-banner';
import { formatCop } from '@/lib/utils';

async function getMe() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const r = await fetch(`${apiUrl}/api/v1/auth/me`, {
    headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
    cache: 'no-store',
  });
  if (!r.ok) return null;
  return r.json();
}

async function getKpis() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const r = await fetch(`${apiUrl}/api/v1/dashboard/kpis`, {
    headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
    cache: 'no-store',
  });
  if (!r.ok) return null;
  return (await r.json()) as { kpis: Record<string, number> };
}

async function getSubscription() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const r = await fetch(`${apiUrl}/api/v1/subscriptions/me`, {
    headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
    cache: 'no-store',
  });
  if (!r.ok) return null;
  return (await r.json()) as { subscription: { status: string; plan: string; currentPeriodEnd: string; blockAt: string } | null };
}

async function getModulesCount() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const r = await fetch(`${apiUrl}/api/v1/modules`, {
    headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
    cache: 'no-store',
  });
  if (!r.ok) return { active: 0, total: 10 };
  const data = await r.json();
  const list = data.modules as Array<{ enabled: boolean }>;
  return { active: list.filter((m) => m.enabled).length, total: list.length || 10 };
}

export default async function DashboardPage() {
  // Admin: el dashboard tenant-scoped no aplica; redirigir a su panel
  const me = await getMe();
  if (me?.session?.role === 'super_admin') redirect('/admin/clients');

  const data = await getKpis();
  const subData = await getSubscription();
  const mods = await getModulesCount();
  const k = data?.kpis ?? { vehicles: 0, drivers: 0, owners: 0, clients: 0, activeContracts: 0, revenueMonthCop: 0, upcomingExpirations: 0 };
  const sub = subData?.subscription;
  const daysLeft = sub ? Math.max(0, Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted">Vista general de tu operación</p>
      </header>

      {sub && (
        <PlanBanner
          plan={sub.plan}
          status={sub.status}
          daysLeft={daysLeft}
          modulesActive={mods.active}
          modulesTotal={mods.total}
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Vehículos" value={k.vehicles ?? 0} icon={Truck} />
        <KpiCard label="Conductores" value={k.drivers ?? 0} icon={Users} />
        <KpiCard label="Propietarios" value={k.owners ?? 0} icon={ShieldCheck} />
        <KpiCard label="Empresas cliente" value={k.clients ?? 0} icon={Building2} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Contratos activos" value={k.activeContracts ?? 0} icon={FileSignature} />
        <KpiCard label="Ingresos del mes" value={formatCop(k.revenueMonthCop ?? 0)} icon={Wallet} accent />
        <KpiCard label="Vencimientos próximos" value={k.upcomingExpirations ?? 0} hint="Próximos 30 días" icon={Calendar} accent />
      </section>

      <section className="card p-6">
        <h2 className="font-semibold">Próximos pasos</h2>
        <p className="mt-1 text-sm text-muted">Empieza por dar de alta tu primer activo:</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link href="/owners" className="rounded-lg border border-border p-4 hover:bg-background hover:border-primary/40 cursor-pointer transition-colors">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p className="mt-2 font-semibold">1. Crear propietario</p>
            <p className="text-xs text-muted">Registra al dueño del vehículo y datos bancarios</p>
          </Link>
          <Link href="/vehicles" className="rounded-lg border border-border p-4 hover:bg-background hover:border-primary/40 cursor-pointer transition-colors">
            <Truck className="h-5 w-5 text-primary" />
            <p className="mt-2 font-semibold">2. Registrar vehículo</p>
            <p className="text-xs text-muted">Placa, tipo, fotos y documentos legales</p>
          </Link>
          <Link href="/drivers" className="rounded-lg border border-border p-4 hover:bg-background hover:border-primary/40 cursor-pointer transition-colors">
            <Users className="h-5 w-5 text-primary" />
            <p className="mt-2 font-semibold">3. Sumar conductor</p>
            <p className="text-xs text-muted">Licencia, EPS, ARL y exámenes médicos</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
