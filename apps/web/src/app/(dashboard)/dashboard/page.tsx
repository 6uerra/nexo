import { cookies } from 'next/headers';
import Link from 'next/link';
import { Truck, Users, ShieldCheck, Building2, FileSignature, AlertTriangle, Wallet, Calendar } from 'lucide-react';
import { KpiCard } from '@/components/kpi-card';
import { formatCop } from '@/lib/utils';

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
  return (await r.json()) as { subscription: { status: string; currentPeriodEnd: string; blockAt: string } | null };
}

export default async function DashboardPage() {
  const data = await getKpis();
  const subData = await getSubscription();
  const k = data?.kpis ?? { vehicles: 0, drivers: 0, owners: 0, clients: 0, activeContracts: 0, revenueMonthCop: 0, upcomingExpirations: 0 };
  const sub = subData?.subscription;

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted">Vista general de tu operación</p>
        </div>
        {sub && sub.status !== 'active' && (
          <Link href="/settings/subscription" className="inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 cursor-pointer transition-colors">
            <AlertTriangle className="h-4 w-4" />
            Suscripción {sub.status === 'trial' ? 'en prueba' : sub.status === 'past_due' ? 'por vencer' : sub.status}
          </Link>
        )}
      </header>

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
