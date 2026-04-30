import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldAlert, ArrowRight, LogOut } from 'lucide-react';
import { Logo } from '@/components/logo';
import { BrandLogo } from '@/components/brand-logo';

async function loadAll() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  if (!token) return null;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const headers = { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` };
  const [meR, subR, methodsR] = await Promise.all([
    fetch(`${apiUrl}/api/v1/auth/me`, { headers, cache: 'no-store' }),
    fetch(`${apiUrl}/api/v1/subscriptions/me`, { headers, cache: 'no-store' }),
    fetch(`${apiUrl}/api/v1/payment-methods`, { cache: 'no-store' }),
  ]);
  if (!meR.ok) return null;
  const me = await meR.json();
  const subData = subR.ok ? await subR.json() : { subscription: null };
  const methodsData = methodsR.ok ? await methodsR.json() : { methods: [] };
  return { me: me.session, subscription: subData.subscription, methods: methodsData.methods };
}

export default async function BlockedPage() {
  const data = await loadAll();
  if (!data) redirect('/login');
  if (data.me.role === 'super_admin') redirect('/admin/clients');
  const sub = data.subscription;
  if (sub && sub.status !== 'blocked' && sub.status !== 'cancelled' && new Date(sub.blockAt) > new Date()) {
    redirect('/dashboard');
  }

  const daysExpired = sub?.currentPeriodEnd
    ? Math.floor((Date.now() - new Date(sub.currentPeriodEnd).getTime()) / (24 * 60 * 60 * 1000))
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 lg:px-6">
          <Logo />
          <form action="/api/v1/auth/logout" method="post">
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink hover:bg-background cursor-pointer">
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-12 lg:px-6 space-y-8">
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-50/50 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-red-900">Tu acceso está bloqueado</h1>
          <p className="mt-2 text-sm text-red-800/90 max-w-xl mx-auto leading-relaxed">
            Tu suscripción {daysExpired > 0 ? `venció hace ${daysExpired} días y ya pasó el período de gracia de 90 días` : 'está vencida'}.
            Por seguridad, suspendimos el acceso a la operación de tu cuenta hasta que registres un pago.
          </p>
          <p className="mt-1 text-xs text-red-700">
            <strong>Hola {data.me.name}.</strong> Realiza un pago para reactivar tu cuenta inmediatamente.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-bold mb-3">Cómo pagar</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.methods.map((m: any) => (
              <PaymentCard key={m.id} method={m} />
            ))}
          </div>
        </section>

        <section className="card p-5 bg-primary/5 border-primary/20">
          <p className="text-sm">
            <strong>Después de pagar:</strong> guarda el comprobante y registra el pago en tu cuenta.
          </p>
          <Link href="/settings/subscription" className="btn-primary mt-3 text-sm">
            Registrar mi pago
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <p className="text-center text-xs text-muted">
          ¿Problemas? Escríbenos a <a href="mailto:admin@nexo.local" className="text-primary underline">admin@nexo.local</a>
        </p>
      </main>
    </div>
  );
}

function PaymentCard({ method }: { method: any }) {
  const brandKind = method.kind === 'bank' ? 'bancolombia' : method.kind === 'mercado_pago' ? 'mercado_pago' : 'qr';
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <BrandLogo kind={brandKind} />
        <div>
          <p className="font-bold leading-tight">{method.label}</p>
          {method.kind === 'bank' && <p className="text-xs text-muted">{method.bankName}</p>}
        </div>
      </div>
      {method.kind === 'bank' && (
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Cuenta:</dt><dd className="font-mono font-medium">{method.bankAccount ?? '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Tipo:</dt><dd>{method.bankAccountType ?? '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Titular:</dt><dd>{method.holderName ?? '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Documento:</dt><dd className="font-mono">{method.holderDocument ?? '—'}</dd></div>
        </dl>
      )}
      {method.kind === 'mercado_pago' && method.link && (
        <a href={method.link} target="_blank" rel="noreferrer" className="btn-primary text-sm w-full">
          Pagar en Mercado Pago
          <ArrowRight className="h-4 w-4" />
        </a>
      )}
      {method.qrImageUrl && (
        <div>
          <p className="text-xs text-muted mb-1">Escanea:</p>
          <img src={method.qrImageUrl} alt={`QR ${method.label}`} className="h-32 w-32 rounded-lg border border-border bg-white p-1.5" />
        </div>
      )}
      {method.instructions && (
        <p className="text-xs text-muted">{method.instructions}</p>
      )}
    </div>
  );
}
