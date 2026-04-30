import { cookies } from 'next/headers';
import { CalendarClock, ShieldAlert, ShieldCheck, ExternalLink, Info } from 'lucide-react';
import { formatCop, formatDate } from '@/lib/utils';
import { BrandLogo } from '@/components/brand-logo';

async function loadAll() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const headers = { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` };
  const [s, m, p] = await Promise.all([
    fetch(`${apiUrl}/api/v1/subscriptions/me`, { headers, cache: 'no-store' }).then((r) => r.json()),
    fetch(`${apiUrl}/api/v1/payment-methods`, { cache: 'no-store' }).then((r) => r.json()),
    fetch(`${apiUrl}/api/v1/subscriptions/me/payments`, { headers, cache: 'no-store' }).then((r) => r.json()),
  ]);
  return { sub: s.subscription, methods: m.methods, payments: p.payments };
}

const STATUS_BADGE: Record<string, { color: string; icon: typeof ShieldCheck; text: string }> = {
  trial: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: ShieldCheck, text: 'En prueba' },
  active: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ShieldCheck, text: 'Activa' },
  past_due: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: ShieldAlert, text: 'Por vencer' },
  blocked: { color: 'bg-red-50 text-red-700 border-red-200', icon: ShieldAlert, text: 'Bloqueada' },
  cancelled: { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: ShieldAlert, text: 'Cancelada' },
};

export default async function SubscriptionPage() {
  const { sub, methods, payments } = await loadAll();
  const status = sub?.status ?? 'trial';
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.trial!;

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Suscripción</h1>
        <p className="text-sm text-muted">Estado de tu plan y métodos de pago disponibles.</p>
      </header>

      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Estado actual</p>
            <span className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${badge.color}`}>
              <badge.icon className="h-4 w-4" />
              {badge.text}
            </span>
          </div>
          {sub && (
            <div className="text-right text-sm">
              <p className="text-muted">Vence el</p>
              <p className="font-semibold tabular-nums">{formatDate(sub.currentPeriodEnd)}</p>
              <p className="mt-1 text-xs text-muted flex items-center justify-end gap-1">
                <CalendarClock className="h-3.5 w-3.5" />
                Bloqueo: {formatDate(sub.blockAt)}
              </p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Cómo pagar</h2>
        <p className="text-sm text-muted">Elige el método que prefieras y registra tu pago al final.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {methods.map((m: any) => <MethodCard key={m.id} method={m} />)}
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Historial de pagos</h2>
        <div className="card mt-3 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-background text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-2.5">Fecha</th>
                <th className="px-4 py-2.5">Monto</th>
                <th className="px-4 py-2.5">Método</th>
                <th className="px-4 py-2.5">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted">Sin pagos registrados aún</td></tr>
              )}
              {payments.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-4 py-2.5 tabular-nums">{formatDate(p.submittedAt)}</td>
                  <td className="px-4 py-2.5 tabular-nums font-medium">{formatCop(p.amountCop)}</td>
                  <td className="px-4 py-2.5">{p.method}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.status === 'verified' ? 'bg-emerald-50 text-emerald-700' :
                      p.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                    }`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MethodCard({ method }: { method: any }) {
  const brandKind = method.kind === 'bank' ? 'bancolombia' : method.kind === 'mercado_pago' ? 'mercado_pago' : 'qr';
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <BrandLogo kind={brandKind} />
        <div>
          <p className="font-semibold leading-tight">{method.label}</p>
          {method.kind === 'bank' && <p className="text-xs text-muted">{method.bankName}</p>}
          {method.kind === 'mercado_pago' && <p className="text-xs text-muted">Pago en línea</p>}
          {method.kind === 'qr' && <p className="text-xs text-muted">Escanea con tu app de banca</p>}
        </div>
      </div>

      {method.kind === 'bank' && (
        <dl className="space-y-1 text-sm">
          <Row term="Tipo">{method.bankAccountType ?? '—'}</Row>
          <Row term="Cuenta"><span className="font-mono tabular-nums">{method.bankAccount ?? '—'}</span></Row>
          <Row term="Titular">{method.holderName ?? '—'}</Row>
          <Row term="Documento"><span className="font-mono">{method.holderDocument ?? '—'}</span></Row>
        </dl>
      )}

      {method.kind === 'mercado_pago' && method.link && (
        <a href={method.link} target="_blank" rel="noreferrer" className="btn-primary text-sm">
          Pagar en Mercado Pago
          <ExternalLink className="h-4 w-4" />
        </a>
      )}

      {method.qrImageUrl ? (
        <div>
          <p className="text-xs font-medium text-muted mb-2">Escanea el QR:</p>
          <img src={method.qrImageUrl} alt={`QR ${method.label}`} className="h-44 w-44 rounded-lg border border-border bg-white p-2" />
        </div>
      ) : method.kind === 'bank' ? (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 flex gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>El admin todavía no subió el QR. Usa los datos bancarios de arriba.</span>
        </div>
      ) : null}

      {method.instructions && (
        <p className="text-xs text-muted leading-relaxed">{method.instructions}</p>
      )}
    </div>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted">{term}:</dt>
      <dd className="font-medium text-ink text-right">{children}</dd>
    </div>
  );
}
