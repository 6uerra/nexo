import Link from 'next/link';
import { Sparkles, Clock } from 'lucide-react';

export function PlanBanner({
  plan, status, daysLeft, modulesActive, modulesTotal,
}: {
  plan: string;
  status: string;
  daysLeft: number;
  modulesActive: number;
  modulesTotal: number;
}) {
  const isTrial = status === 'trial';
  const isWarning = daysLeft <= 7 && (status === 'trial' || status === 'past_due');

  return (
    <div className={`card p-4 flex flex-wrap items-center justify-between gap-3 ${isWarning ? 'border-amber-300 bg-amber-50' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${isWarning ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold capitalize">
            Plan {plan?.replace('_', ' ') ?? '—'}{isTrial && ' (trial)'}
          </p>
          <p className="text-xs text-muted">
            {modulesActive}/{modulesTotal} módulos activos · {daysLeft > 0 ? `${daysLeft} días restantes` : 'Vencido'}
          </p>
        </div>
      </div>
      <Link href="/settings/subscription" className="btn-outline text-xs">
        <Clock className="h-3.5 w-3.5" />
        Ver suscripción
      </Link>
    </div>
  );
}
