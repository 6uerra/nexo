import { cookies } from 'next/headers';
import { Receipt, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCop, formatDate } from '@/lib/utils';

async function load() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const r = await fetch(`${apiUrl}/api/v1/invoices`, {
    headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
    cache: 'no-store',
  });
  if (!r.ok) return { invoices: [] };
  return r.json();
}

const STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-700' },
  issued: { label: 'Emitida', color: 'bg-blue-50 text-blue-700' },
  paid: { label: 'Pagada', color: 'bg-emerald-50 text-emerald-700' },
  overdue: { label: 'Vencida', color: 'bg-red-50 text-red-700' },
  cancelled: { label: 'Cancelada', color: 'bg-slate-100 text-slate-500' },
};

export default async function BillingPage() {
  const { invoices } = await load();
  const charges = invoices.filter((i: any) => i.direction === 'client_charge');
  const payouts = invoices.filter((i: any) => i.direction === 'owner_payout');
  const totalCharged = charges.reduce((s: number, i: any) => s + (i.netAmountCop ?? 0), 0);
  const totalPaid = payouts.reduce((s: number, i: any) => s + (i.netAmountCop ?? 0), 0);

  return (
    <div className="max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" />
          Facturación cruzada
        </h1>
        <p className="text-sm text-muted">Cobros a empresas cliente y pagos a propietarios.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-xs text-emerald-700 uppercase tracking-wider font-semibold">
            <TrendingUp className="h-3.5 w-3.5" /> Cobrado a clientes
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatCop(totalCharged)}</p>
        </div>
        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-xs text-amber-700 uppercase tracking-wider font-semibold">
            <TrendingDown className="h-3.5 w-3.5" /> Pagado a propietarios
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatCop(totalPaid)}</p>
        </div>
        <div className="card p-4 bg-primary/5 border-primary/30">
          <p className="text-xs text-primary uppercase tracking-wider font-semibold">Margen del intermediario</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-primary">{formatCop(totalCharged - totalPaid)}</p>
        </div>
      </div>

      <Section title="Cobros a empresas cliente" rows={charges} kind="charge" />
      <Section title="Pagos a propietarios" rows={payouts} kind="payout" />
    </div>
  );
}

function Section({ title, rows, kind }: { title: string; rows: any[]; kind: 'charge' | 'payout' }) {
  return (
    <section>
      <h2 className="font-semibold mb-2">{title}</h2>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-2.5">Código</th>
              <th>{kind === 'charge' ? 'Cliente' : 'Propietario'}</th>
              <th>Periodo</th>
              <th>Bruto</th>
              <th>Deducc.</th>
              <th>Neto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">Sin facturas en este grupo</td></tr>
            )}
            {rows.map((i: any) => {
              const s = STATUS[i.status] ?? STATUS.draft;
              return (
                <tr key={i.id} className="hover:bg-background/50">
                  <td className="px-4 py-2.5 font-mono text-xs font-bold">{i.code}</td>
                  <td className="px-4 py-2.5">{i.counterpartyName}</td>
                  <td className="px-4 py-2.5 text-xs tabular-nums">{formatDate(i.periodStart)} → {formatDate(i.periodEnd)}</td>
                  <td className="px-4 py-2.5 text-xs tabular-nums">{formatCop(i.grossAmountCop)}</td>
                  <td className="px-4 py-2.5 text-xs tabular-nums text-amber-700">
                    {i.deductionsCop > 0 ? `-${formatCop(i.deductionsCop)}` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-bold tabular-nums">{formatCop(i.netAmountCop)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.color}`}>{s.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
