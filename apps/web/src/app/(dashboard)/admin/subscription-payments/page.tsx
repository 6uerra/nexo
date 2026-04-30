'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet, CheckCircle2, XCircle, Clock, Loader2, Receipt } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCop, formatDate } from '@/lib/utils';

type Payment = {
  id: string;
  tenantName: string | null;
  tenantSlug: string | null;
  tenantId: string;
  amountCop: number;
  method: string;
  status: 'pending' | 'submitted' | 'verified' | 'rejected';
  reference: string | null;
  receiptUrl: string | null;
  coversFrom: string;
  coversTo: string;
  submittedAt: string;
  verifiedAt: string | null;
  rejectionReason: string | null;
};

const STATUS_BADGE: Record<string, { label: string; color: string; icon: any }> = {
  submitted: { label: 'Pendiente', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  verified:  { label: 'Verificado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  rejected:  { label: 'Rechazado', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  pending:   { label: 'Pendiente', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock },
};

export default function SubscriptionPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'verified' | 'rejected'>('submitted');

  async function load() {
    setLoading(true);
    try {
      const r = await api<{ payments: Payment[] }>('/admin/subscription-payments');
      setPayments(r.payments);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function verify(id: string) {
    if (!confirm('¿Marcar este pago como verificado? Se extenderá la suscripción del cliente.')) return;
    setBusy(id);
    try {
      await api(`/admin/subscription-payments/${id}/verify`, { method: 'POST' });
      await load();
    } finally { setBusy(null); }
  }

  async function reject(id: string) {
    const reason = prompt('Motivo del rechazo:');
    if (!reason) return;
    setBusy(id);
    try {
      await api(`/admin/subscription-payments/${id}/reject`, { method: 'POST', json: { reason } });
      await load();
    } finally { setBusy(null); }
  }

  const filtered = filter === 'all' ? payments : payments.filter((p) => p.status === filter);
  const counts = {
    submitted: payments.filter((p) => p.status === 'submitted').length,
    verified: payments.filter((p) => p.status === 'verified').length,
    rejected: payments.filter((p) => p.status === 'rejected').length,
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>;

  return (
    <div className="max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" /> Pagos de suscripción
        </h1>
        <p className="text-sm text-muted">Pagos que tus clientes reportan por su suscripción a Nexo. Verifica para extender el plan.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(['submitted', 'verified', 'rejected', 'all'] as const).map((k) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              filter === k ? 'bg-primary text-white' : 'bg-background text-muted hover:bg-border'
            }`}>
            {k === 'submitted' && `Pendientes (${counts.submitted})`}
            {k === 'verified' && `Verificados (${counts.verified})`}
            {k === 'rejected' && `Rechazados (${counts.rejected})`}
            {k === 'all' && `Todos (${payments.length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Wallet className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 font-medium">Sin pagos en este filtro</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-2.5">Fecha</th>
                  <th>Cliente</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Cubre</th>
                  <th>Referencia</th>
                  <th>Estado</th>
                  <th className="px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const s = STATUS_BADGE[p.status];
                  const Icon = s.icon;
                  return (
                    <tr key={p.id} className="hover:bg-background/50">
                      <td className="px-4 py-2.5 text-xs tabular-nums">{formatDate(p.submittedAt)}</td>
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/clients/${p.tenantId}`} className="font-medium text-ink hover:text-primary cursor-pointer">
                          {p.tenantName ?? '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums font-bold">{formatCop(p.amountCop)}</td>
                      <td className="px-4 py-2.5 text-xs capitalize">{p.method.replace('_', ' ')}</td>
                      <td className="px-4 py-2.5 text-xs tabular-nums">{formatDate(p.coversFrom)} → {formatDate(p.coversTo)}</td>
                      <td className="px-4 py-2.5 text-xs font-mono">{p.reference ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.color}`}>
                          <Icon className="h-3 w-3" />
                          {s.label}
                        </span>
                        {p.status === 'rejected' && p.rejectionReason && (
                          <p className="mt-1 text-[10px] italic text-red-600">{p.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {p.status === 'submitted' && (
                          <div className="flex justify-end gap-1">
                            <button onClick={() => verify(p.id)} disabled={busy === p.id}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 cursor-pointer disabled:opacity-50">
                              {busy === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                              Verificar
                            </button>
                            <button onClick={() => reject(p.id)} disabled={busy === p.id}
                              className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 cursor-pointer disabled:opacity-50">
                              <XCircle className="h-3 w-3" />
                              Rechazar
                            </button>
                          </div>
                        )}
                        {p.status !== 'submitted' && p.receiptUrl && (
                          <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Ver comprobante</a>
                        )}
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
