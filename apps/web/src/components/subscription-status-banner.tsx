import Link from 'next/link';
import { Sparkles, AlertTriangle, ShieldAlert, Clock, ArrowRight } from 'lucide-react';

interface Sub {
  status: string;
  currentPeriodEnd: string;
  blockAt: string;
  plan: string;
}

interface Props {
  subscription: Sub | null;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

/**
 * Banner persistente arriba de cada vista del cliente. Sólo aparece si la
 * suscripción NO está 'active' (warning visible para presionar el pago).
 * Para 'blocked' el middleware ya redirige a /blocked, así que aquí no aparece.
 */
export function SubscriptionStatusBanner({ subscription }: Props) {
  if (!subscription) return null;
  const { status, currentPeriodEnd, blockAt } = subscription;
  const daysToEnd = daysUntil(currentPeriodEnd);
  const daysToBlock = daysUntil(blockAt);

  // Activa y con tiempo: no mostrar nada
  if (status === 'active' && daysToEnd > 7) return null;

  let tone: 'info' | 'warning' | 'danger' = 'info';
  let icon = Sparkles;
  let title = '';
  let detail = '';

  if (status === 'trial') {
    tone = 'info';
    icon = Sparkles;
    title = `Periodo de prueba`;
    detail = daysToEnd > 0
      ? `Tu prueba termina en ${daysToEnd} ${daysToEnd === 1 ? 'día' : 'días'}.`
      : `Tu prueba terminó. Realiza el pago para continuar usando Nexo.`;
  } else if (status === 'active' && daysToEnd <= 7) {
    tone = 'warning';
    icon = Clock;
    title = `Tu plan vence pronto`;
    detail = `Vence en ${daysToEnd} ${daysToEnd === 1 ? 'día' : 'días'}. Realiza el pago para evitar interrupciones.`;
  } else if (status === 'past_due') {
    tone = daysToBlock <= 15 ? 'danger' : 'warning';
    icon = AlertTriangle;
    if (daysToEnd >= 0) {
      title = `Pago pendiente`;
      detail = `Tu plan vence en ${daysToEnd} ${daysToEnd === 1 ? 'día' : 'días'}. Realiza el pago para evitar el bloqueo.`;
    } else {
      title = `Suscripción vencida`;
      detail = `Venció hace ${Math.abs(daysToEnd)} días. Tienes ${daysToBlock} días de gracia antes del bloqueo total.`;
    }
  } else if (status === 'blocked' || status === 'cancelled') {
    tone = 'danger';
    icon = ShieldAlert;
    title = `Acceso bloqueado`;
    detail = `Realiza un pago para reactivar tu cuenta.`;
  }

  const STYLE = {
    info:    'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-amber-50 border-amber-300 text-amber-900',
    danger:  'bg-red-50 border-red-300 text-red-900',
  }[tone];
  const ICON_STYLE = {
    info: 'text-blue-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  }[tone];
  const Icon = icon;

  return (
    <div className={`border-b ${STYLE}`}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-8">
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className={`h-5 w-5 shrink-0 ${ICON_STYLE}`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">{title}</p>
            <p className="text-xs leading-tight opacity-80">{detail}</p>
          </div>
        </div>
        <Link
          href="/settings/subscription"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-white/80 hover:bg-white px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors"
        >
          Pagar ahora
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
