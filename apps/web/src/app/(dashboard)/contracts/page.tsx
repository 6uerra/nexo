import { cookies } from 'next/headers';
import { FileText } from 'lucide-react';
import { formatCop, formatDate } from '@/lib/utils';
import { PendingFeatureBanner } from '@/components/pending-feature-banner';

async function load() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const r = await fetch(`${apiUrl}/api/v1/contracts`, {
    headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
    cache: 'no-store',
  });
  if (!r.ok) return { contracts: [] };
  return r.json();
}

const STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-700' },
  active: { label: 'Activo', color: 'bg-emerald-50 text-emerald-700' },
  suspended: { label: 'Suspendido', color: 'bg-amber-50 text-amber-700' },
  finished: { label: 'Finalizado', color: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelado', color: 'bg-red-50 text-red-700' },
};

export default async function ContractsPage() {
  const { contracts } = await load();
  return (
    <div className="max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Contratos
          <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">{contracts.length}</span>
        </h1>
        <p className="text-sm text-muted">Contratos vigentes y borradores.</p>
      </header>

      <PendingFeatureBanner
        status="partial"
        title="CRUD de Contratos"
        sprint={3}
        whatWorks={[
          'Lectura de contratos con cliente, vehículo, conductor y montos',
          'Estados visuales (Activo, Borrador, Finalizado, etc.)',
        ]}
        whatPending={[
          'Crear contrato nuevo (vincular cliente + vehículo + conductor)',
          'Generar PDF del contrato (Sprint 3)',
          'Firma electrónica',
          'Editar/cancelar contratos existentes',
        ]}
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-2.5">Código</th>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Conductor</th>
                <th>Tipo / Fechas</th>
                <th>Mensual</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contracts.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Sin contratos aún</td></tr>
              )}
              {contracts.map((c: any) => {
                const s = STATUS[c.status] ?? STATUS.draft;
                return (
                  <tr key={c.id} className="hover:bg-background/50">
                    <td className="px-4 py-2.5 font-mono text-xs font-bold">{c.code}</td>
                    <td className="px-4 py-2.5">{c.clientName ?? '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{c.vehiclePlate ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs">{c.driverName ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <p className="capitalize">{c.type === 'fixed_term' ? 'Término fijo' : 'Indefinido'}</p>
                      <p className="text-muted tabular-nums">
                        {formatDate(c.startDate)}{c.endDate ? ` → ${formatDate(c.endDate)}` : ' →'}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-bold tabular-nums">{c.monthlyAmountCop ? formatCop(c.monthlyAmountCop) : '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.color}`}>
                        {s.label}
                      </span>
                    </td>
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
