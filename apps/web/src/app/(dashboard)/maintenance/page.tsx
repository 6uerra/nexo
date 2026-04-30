import { cookies } from 'next/headers';
import { Wrench } from 'lucide-react';
import { formatCop, formatDate } from '@/lib/utils';

async function load() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const r = await fetch(`${apiUrl}/api/v1/maintenance`, {
    headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
    cache: 'no-store',
  });
  if (!r.ok) return { maintenances: [] };
  return r.json();
}

const TYPE_LABEL: Record<string, string> = {
  oil_change: 'Cambio de aceite', tires: 'Llantas', alignment: 'Alineación',
  engine_wash: 'Lavado de motor', brakes: 'Frenos', extinguisher: 'Extintor',
  general: 'Revisión general', other: 'Otro',
};

export default async function MaintenancePage() {
  const { maintenances } = await load();
  const totalCost = maintenances.reduce((s: number, m: any) => s + (m.costCop ?? 0), 0);
  const totalDeducted = maintenances.filter((m: any) => m.deductFromOwner).reduce((s: number, m: any) => s + (m.costCop ?? 0), 0);

  return (
    <div className="max-w-5xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          Mantenimientos
          <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">{maintenances.length}</span>
        </h1>
        <p className="text-sm text-muted">Por fecha y kilometraje.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">Total registrado</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatCop(totalCost)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">Se deduce a propietarios</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">{formatCop(totalDeducted)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">Asume el cliente</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{formatCop(totalCost - totalDeducted)}</p>
        </div>
      </div>

      <ul className="space-y-3">
        {maintenances.length === 0 && (
          <li className="card p-8 text-center text-muted">Sin mantenimientos aún</li>
        )}
        {maintenances.map((m: any) => (
          <li key={m.id} className="card p-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold">{m.vehiclePlate ?? '—'}</span>
                <span className="font-semibold">{TYPE_LABEL[m.type] ?? m.type}</span>
                {m.deductFromOwner && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">Deduce</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted">
                {formatDate(m.performedAt)} · {m.workshop ?? 'Taller'} · {m.odometerKm ? `${m.odometerKm.toLocaleString('es-CO')} km` : 'sin km'}
              </p>
              {m.notes && <p className="mt-1 text-xs text-ink/80">{m.notes}</p>}
            </div>
            <p className="text-lg font-bold tabular-nums">{formatCop(m.costCop ?? 0)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
