import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarPlus, Mail, RotateCcw } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ClientDetailActions } from './actions';

async function load(id: string) {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const r = await fetch(`${apiUrl}/api/v1/admin/clients/${id}`, {
    headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
    cache: 'no-store',
  });
  if (r.status === 403) return 'forbidden' as const;
  if (r.status === 404) return null;
  if (!r.ok) return null;
  return r.json();
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await load(id);
  if (data === 'forbidden') redirect('/dashboard');
  if (!data) notFound();

  const t = data.tenant;
  const sub = data.subscription;
  const users = data.users as any[];
  const modules = data.modules as any[];
  const enabledCount = modules.filter((m) => m.enabled).length;

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <Link href="/admin/clients" className="text-sm text-muted hover:text-ink inline-flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a clientes
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{t.name}</h1>
        <p className="text-sm text-muted">{t.legalName ?? t.slug} · {t.city ?? '—'}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">Plan</p>
          <p className="mt-2 text-2xl font-bold capitalize">{sub?.plan?.replace('_', ' ') ?? '—'}</p>
          <p className="mt-1 text-xs text-muted">Estado: <strong>{sub?.status ?? '—'}</strong></p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">Vence</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{sub ? formatDate(sub.currentPeriodEnd) : '—'}</p>
          <p className="mt-1 text-xs text-muted">Bloqueo: {sub ? formatDate(sub.blockAt) : '—'}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">Módulos</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{enabledCount}<span className="text-base text-muted">/{modules.length}</span></p>
          <p className="mt-1 text-xs text-muted">activos</p>
        </div>
      </div>

      <ClientDetailActions clientId={id} />

      <section className="card overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Usuarios</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-background text-left text-xs uppercase tracking-wider text-muted">
            <tr><th className="px-4 py-2.5">Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2.5 font-medium">{u.name}</td>
                <td className="px-4 py-2.5 text-muted">{u.email}</td>
                <td className="px-4 py-2.5"><span className="rounded-full bg-background px-2 py-0.5 text-xs">{u.role}</span></td>
                <td className="px-4 py-2.5">
                  {u.emailVerified
                    ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600"/>Activo</span>
                    : <span className="inline-flex items-center gap-1 text-xs text-amber-700"><Mail className="h-3 w-3" />Pendiente activar</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-semibold">Módulos activos</h2>
          <span className="text-xs text-muted">{enabledCount} de {modules.length}</span>
        </div>
        <div className="divide-y divide-border">
          {modules.map((m) => (
            <ModuleToggle key={m.moduleKey} clientId={id} module={m} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ModuleToggle({ clientId, module }: { clientId: string; module: any }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="font-medium text-sm capitalize">{module.moduleKey}</p>
      </div>
      <ClientDetailActions clientId={clientId} inlineToggle={module} />
    </div>
  );
}
