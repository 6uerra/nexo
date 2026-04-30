import { cookies } from 'next/headers';
import { Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { expiryDot, expiryStatus } from '@/lib/expiry';
import { DriverCreateButton, DriverActions } from '@/components/driver-form';

async function load() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const r = await fetch(`${apiUrl}/api/v1/drivers`, {
    headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
    cache: 'no-store',
  });
  if (!r.ok) return { drivers: [] };
  return r.json();
}

export default async function DriversPage() {
  const { drivers } = await load();
  return (
    <div className="max-w-6xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Conductores
            <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">{drivers.length}</span>
          </h1>
          <p className="text-sm text-muted">Datos de licencia, EPS, ARL y exámenes médicos.</p>
        </div>
        <DriverCreateButton />
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {drivers.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 card p-12 text-center text-muted">Sin conductores aún</div>
        )}
        {drivers.map((d: any) => {
          const lic = expiryDot(d.licenseExpiresAt);
          const med = expiryDot(d.medicalExamExpiresAt);
          const lance = expiryStatus(d.licenseExpiresAt);
          return (
            <div key={d.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{d.fullName}</p>
                  <p className="text-xs text-muted truncate">{d.documentType} {d.document}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${d.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {d.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                  <DriverActions driver={d} />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {d.licenseCategory && (
                  <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 font-bold text-primary text-xs">
                    Lic {d.licenseCategory}
                  </span>
                )}
                {d.licenseNumber && <span className="font-mono text-[11px] text-muted truncate">{d.licenseNumber}</span>}
              </div>

              {d.licenseExpiresAt && (
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  <span className={`h-2 w-2 rounded-full ${lic.color}`} />
                  <span className="text-muted">Vence licencia:</span>
                  <span className="tabular-nums font-medium">{formatDate(d.licenseExpiresAt)}</span>
                  {lance === 'warning' && <span className="text-amber-700">· por vencer</span>}
                  {lance === 'expired' && <span className="text-red-700 font-bold">· vencida</span>}
                </div>
              )}

              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-md bg-background p-1.5">
                  <p className="text-muted uppercase tracking-wider font-semibold text-[9px]">EPS</p>
                  <p className="font-medium truncate">{d.eps ?? '—'}</p>
                </div>
                <div className="rounded-md bg-background p-1.5">
                  <p className="text-muted uppercase tracking-wider font-semibold text-[9px]">ARL</p>
                  <p className="font-medium truncate">{d.arl ?? '—'}</p>
                </div>
                <div className="rounded-md bg-background p-1.5">
                  <p className="text-muted uppercase tracking-wider font-semibold text-[9px]">Pensión</p>
                  <p className="font-medium truncate">{d.pension ?? '—'}</p>
                </div>
              </div>

              {d.medicalExamExpiresAt && (
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  <span className={`h-2 w-2 rounded-full ${med.color}`} />
                  <span className="text-muted">Examen méd.:</span>
                  <span className="tabular-nums font-medium">{formatDate(d.medicalExamExpiresAt)}</span>
                </div>
              )}

              {(d.phone || d.email) && (
                <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted space-y-0.5">
                  {d.phone && <p>📞 {d.phone}</p>}
                  {d.email && <p>📧 {d.email}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
