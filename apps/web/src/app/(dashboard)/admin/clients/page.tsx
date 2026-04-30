import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase, Plus, Building2, Mail, CheckCircle2, ArrowRight, Sparkles,
  Star, ShieldAlert, Clock, Users as UsersIcon, Layers,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

async function loadClients() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const r = await fetch(`${apiUrl}/api/v1/admin/clients`, {
    headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
    cache: 'no-store',
  });
  if (r.status === 403) return null;
  if (!r.ok) return { clients: [] };
  return r.json();
}

const STATUS: Record<string, { label: string; color: string; dot: string }> = {
  trial:     { label: 'En prueba', color: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-500' },
  active:    { label: 'Activa',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  past_due:  { label: 'Vencida',   color: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
  blocked:   { label: 'Bloqueada', color: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500' },
  cancelled: { label: 'Cancelada', color: 'bg-slate-100 text-slate-700 border-slate-200',     dot: 'bg-slate-400' },
};

const PLAN_COLOR: Record<string, string> = {
  free_trial: 'bg-blue-50 text-blue-700 border-blue-200',
  standard:   'bg-slate-50 text-slate-700 border-slate-200',
  pro:        'bg-primary/10 text-primary border-primary/20',
  enterprise: 'bg-purple-50 text-purple-700 border-purple-200',
};

const PLAN_LABEL: Record<string, string> = {
  free_trial: 'Trial', standard: 'Standard', pro: 'Pro', enterprise: 'Enterprise',
};

function daysLeft(endStr?: string | null): number {
  if (!endStr) return 0;
  return Math.ceil((new Date(endStr).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export default async function AdminClientsPage() {
  const data = await loadClients();
  if (data === null) redirect('/dashboard');
  const clients = data.clients as Array<any>;

  // KPIs
  const total = clients.length;
  const active = clients.filter((c) => c.subscription?.status === 'active').length;
  const blocked = clients.filter((c) => c.subscription?.status === 'blocked').length;
  const trial = clients.filter((c) => c.subscription?.status === 'trial').length;

  return (
    <div className="max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Clientes
          </h1>
          <p className="text-sm text-muted">Empresas que están usando Nexo. Verifica pagos y gestiona planes.</p>
        </div>
        <Link href="/admin/clients/new" className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> Nuevo cliente
        </Link>
      </header>

      {/* KPI cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Total clientes"     value={total}   icon={Building2}  tone="primary" />
        <KpiTile label="Activos"            value={active}  icon={CheckCircle2} tone="success" />
        <KpiTile label="En trial"           value={trial}   icon={Sparkles}   tone="info" />
        <KpiTile label="Bloqueados"         value={blocked} icon={ShieldAlert} tone={blocked > 0 ? 'danger' : 'muted'} />
      </section>

      {clients.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="h-7 w-7" />
          </div>
          <p className="mt-4 font-semibold text-lg">Aún no tienes clientes</p>
          <p className="mt-1 text-sm text-muted max-w-sm mx-auto">
            Crea tu primer cliente para que pueda activar su cuenta y empezar a usar Nexo.
          </p>
          <Link href="/admin/clients/new" className="btn-primary mt-6 text-sm">
            <Plus className="h-4 w-4" /> Crear primer cliente
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop: tabla con acción explícita */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Vence</th>
                  <th className="px-4 py-3 text-center">Módulos</th>
                  <th className="px-4 py-3 text-center">Usuarios</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((c) => {
                  const sub = c.subscription;
                  const status = STATUS[sub?.status ?? 'trial'] ?? STATUS.trial;
                  const days = daysLeft(sub?.currentPeriodEnd);
                  return (
                    <tr key={c.id} className="group transition-colors hover:bg-primary/5">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{c.name}</p>
                        <p className="text-xs text-muted">{c.legalName ?? c.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        {sub?.plan && (
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold ${PLAN_COLOR[sub.plan] ?? 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                            <Star className="h-3 w-3" />
                            {PLAN_LABEL[sub.plan] ?? sub.plan}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {sub ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium tabular-nums text-ink">{formatDate(sub.currentPeriodEnd)}</span>
                            <span className={`text-[10px] tabular-nums ${days < 0 ? 'text-red-600' : days < 7 ? 'text-amber-700' : 'text-muted'}`}>
                              {days >= 0 ? `${days} días restantes` : `vencido hace ${Math.abs(days)} días`}
                            </span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1 text-xs">
                          <Layers className="h-3.5 w-3.5 text-muted" />
                          <span className="font-semibold tabular-nums text-ink">{c.modulesActive}</span>
                          <span className="text-muted">/{c.modulesTotal}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1 text-xs">
                          <UsersIcon className="h-3.5 w-3.5 text-muted" />
                          <span className="tabular-nums text-ink font-medium">{c.usersCount}</span>
                          {c.usersCount > 0 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Mail className="h-3.5 w-3.5 text-amber-600" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/clients/${c.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-primary hover:text-white hover:border-primary cursor-pointer transition-colors"
                        >
                          Ver detalle
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {clients.map((c) => {
              const sub = c.subscription;
              const status = STATUS[sub?.status ?? 'trial'] ?? STATUS.trial;
              const days = daysLeft(sub?.currentPeriodEnd);
              return (
                <Link
                  key={c.id}
                  href={`/admin/clients/${c.id}`}
                  className="card p-4 block hover:shadow-card transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{c.name}</p>
                      <p className="text-xs text-muted truncate">{c.legalName ?? c.slug}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted shrink-0" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {sub?.plan && (
                      <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${PLAN_COLOR[sub.plan]}`}>
                        <Star className="h-3 w-3" />
                        {PLAN_LABEL[sub.plan] ?? sub.plan}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <Stat label="Vence" value={sub ? formatDate(sub.currentPeriodEnd) : '—'} />
                    <Stat label="Módulos" value={`${c.modulesActive}/${c.modulesTotal}`} />
                    <Stat label="Usuarios" value={String(c.usersCount)} />
                  </div>
                  {sub && (
                    <p className={`mt-2 text-[11px] font-semibold ${days < 0 ? 'text-red-600' : days < 7 ? 'text-amber-700' : 'text-muted'} flex items-center gap-1`}>
                      <Clock className="h-3 w-3" />
                      {days >= 0 ? `${days} días restantes` : `vencido hace ${Math.abs(days)} días`}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function KpiTile({
  label, value, icon: Icon, tone,
}: { label: string; value: number; icon: any; tone: 'primary' | 'success' | 'info' | 'danger' | 'muted' }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-100 text-emerald-700',
    info: 'bg-blue-100 text-blue-700',
    danger: 'bg-red-100 text-red-700',
    muted: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">{label}</p>
          <p className="mt-2 text-3xl font-bold text-ink tabular-nums">{value}</p>
        </div>
        <div className={`rounded-lg p-2 shrink-0 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</p>
      <p className="text-xs font-semibold text-ink tabular-nums">{value}</p>
    </div>
  );
}
