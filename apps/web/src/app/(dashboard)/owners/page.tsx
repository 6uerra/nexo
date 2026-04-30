import { cookies } from 'next/headers';
import { ShieldCheck, Truck } from 'lucide-react';
import { OwnerCreateButton, OwnerActions } from '@/components/owner-form';

async function load() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const r = await fetch(`${apiUrl}/api/v1/owners`, {
    headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
    cache: 'no-store',
  });
  if (!r.ok) return { owners: [] };
  return r.json();
}

export default async function OwnersPage() {
  const { owners } = await load();
  return (
    <div className="max-w-5xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Propietarios
            <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">{owners.length}</span>
          </h1>
          <p className="text-sm text-muted">Dueños de los vehículos con sus datos bancarios para pagos.</p>
        </div>
        <OwnerCreateButton />
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {owners.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 card p-12 text-center text-muted">Sin propietarios aún</div>
        )}
        {owners.map((o: any) => (
          <div key={o.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold">{o.fullName}</p>
                <p className="text-xs text-muted">{o.documentType} {o.document}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${o.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {o.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <OwnerActions owner={o} />
              </div>
            </div>
            <div className="mt-3 text-xs space-y-1 text-muted">
              <p>📞 {o.phone ?? '—'}</p>
              <p>📧 {o.email ?? '—'}</p>
              <p>📍 {o.city ?? '—'}{o.address ? ` · ${o.address}` : ''}</p>
            </div>
            {o.bankInfo && (
              <div className="mt-3 rounded-lg bg-background p-2.5 text-xs">
                <p className="font-semibold text-ink">{o.bankInfo.bank}</p>
                <p className="text-muted">{o.bankInfo.accountType} · <span className="font-mono">{o.bankInfo.account}</span></p>
              </div>
            )}
            {o.vehicles && o.vehicles.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                  <Truck className="h-3 w-3" />
                  {o.vehiclesCount} {o.vehiclesCount === 1 ? 'vehículo' : 'vehículos'}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {o.vehicles.map((v: any) => (
                    <span key={v.id} className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary">{v.plate}</span>
                  ))}
                </div>
              </div>
            )}
            {(!o.vehicles || o.vehicles.length === 0) && (
              <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted italic">
                Sin vehículos asignados
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
