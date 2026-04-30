import { cookies } from 'next/headers';
import Link from 'next/link';
import { Building2, Users, Settings as SettingsIcon } from 'lucide-react';
import { KpiCard } from '@/components/kpi-card';
import { redirect } from 'next/navigation';

async function getMe() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const r = await fetch(`${apiUrl}/api/v1/auth/me`, {
    headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
    cache: 'no-store',
  });
  if (!r.ok) return null;
  return (await r.json()) as { session: { role: string } };
}

async function getTenants() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const r = await fetch(`${apiUrl}/api/v1/tenants`, {
    headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
    cache: 'no-store',
  });
  if (!r.ok) return { tenants: [] };
  return r.json();
}

export default async function AdminPage() {
  const me = await getMe();
  if (!me || me.session.role !== 'super_admin') redirect('/dashboard');
  const { tenants } = await getTenants();

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Panel del Super Admin</h1>
        <p className="text-sm text-muted">Gestión de tenants (intermediarios) y plataforma.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Tenants" value={tenants.length} icon={Building2} />
        <KpiCard label="Tenants activos" value={tenants.filter((t: any) => t.isActive).length} icon={Users} />
        <KpiCard label="Onboarding completo" value={tenants.filter((t: any) => t.onboardingCompleted).length} icon={SettingsIcon} accent />
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Tenants registrados</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-background text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-2.5">Nombre</th>
              <th className="px-4 py-2.5">Slug</th>
              <th className="px-4 py-2.5">NIT</th>
              <th className="px-4 py-2.5">Activo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tenants.map((t: any) => (
              <tr key={t.id}>
                <td className="px-4 py-2.5 font-medium">{t.name}</td>
                <td className="px-4 py-2.5 text-muted">{t.slug}</td>
                <td className="px-4 py-2.5 tabular-nums">{t.nit ?? '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {t.isActive ? 'Sí' : 'No'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
