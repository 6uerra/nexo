import { cookies } from 'next/headers';
import { Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { expiryDot } from '@/lib/expiry';
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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-2.5">Conductor</th>
                <th>Documento</th>
                <th>Licencia</th>
                <th>Vence licencia</th>
                <th>EPS / ARL / Pensión</th>
                <th>Examen méd.</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drivers.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Sin conductores aún</td></tr>
              )}
              {drivers.map((d: any) => {
                const lic = expiryDot(d.licenseExpiresAt);
                const med = expiryDot(d.medicalExamExpiresAt);
                return (
                  <tr key={d.id} className="hover:bg-background/50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{d.fullName}</p>
                      <p className="text-xs text-muted">{d.phone}</p>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{d.documentType} {d.document}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className="inline-flex rounded-md bg-primary/10 px-1.5 py-0.5 font-bold text-primary">{d.licenseCategory ?? '—'}</span>
                      <p className="mt-0.5 font-mono text-[11px]">{d.licenseNumber}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${lic.color}`} />
                        <span className="tabular-nums">{d.licenseExpiresAt ? formatDate(d.licenseExpiresAt) : '—'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <p>{d.eps ?? '—'}</p>
                      <p className="text-muted">{d.arl ?? '—'} · {d.pension ?? '—'}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${med.color}`} />
                        <span className="tabular-nums">{d.medicalExamExpiresAt ? formatDate(d.medicalExamExpiresAt) : '—'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5"><DriverActions driver={d} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
