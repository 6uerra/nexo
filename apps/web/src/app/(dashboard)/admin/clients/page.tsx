import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Plus, Building2, Mail, CheckCircle2 } from 'lucide-react';
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

const STATUS_COLOR: Record<string, string> = {
  trial: 'bg-blue-50 text-blue-700',
  active: 'bg-emerald-50 text-emerald-700',
  past_due: 'bg-amber-50 text-amber-700',
  blocked: 'bg-red-50 text-red-700',
  cancelled: 'bg-slate-100 text-slate-700',
};

export default async function AdminClientsPage() {
  const data = await loadClients();
  if (data === null) redirect('/dashboard');
  const clients = data.clients as Array<any>;

  return (
    <div className="max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Clientes
          </h1>
          <p className="text-sm text-muted">Empresas que están usando Nexo.</p>
        </div>
        <Link href="/admin/clients/new" className="btn-primary text-sm">
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Link>
      </header>

      {clients.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 font-medium">Aún no tienes clientes</p>
          <p className="text-sm text-muted">Crea el primero para empezar.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Plan / Estado</th>
                  <th className="px-4 py-3">Vence</th>
                  <th className="px-4 py-3">Módulos</th>
                  <th className="px-4 py-3">Usuarios</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((c) => {
                  const sub = c.subscription;
                  const verified = c.usersCount > 0;
                  return (
                    <tr key={c.id} className="hover:bg-background/60">
                      <td className="px-4 py-3">
                        <Link href={`/admin/clients/${c.id}`} className="font-semibold text-ink hover:text-primary cursor-pointer">
                          {c.name}
                        </Link>
                        <p className="text-xs text-muted">{c.legalName ?? c.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-ink">{sub?.plan ?? '—'}</span>
                          {sub?.status && (
                            <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[sub.status] ?? 'bg-slate-100 text-slate-700'}`}>
                              {sub.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums">
                        {sub ? formatDate(sub.currentPeriodEnd) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="font-semibold tabular-nums text-ink">{c.modulesActive}</span>
                        <span className="text-muted">/{c.modulesTotal}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="tabular-nums text-ink font-medium">{c.usersCount}</span>
                          {verified ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Mail className="h-3.5 w-3.5 text-amber-600" />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
