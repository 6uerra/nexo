import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface Props {
  resource: string;
  used: number;
  limit: number | null | undefined;
  upgradeHref?: string;
}

export function LimitBanner({ resource, used, limit, upgradeHref = '/settings/subscription' }: Props) {
  if (limit === null || limit === undefined) return null;
  const blocked = Math.max(0, used - limit);
  const overLimit = blocked > 0;

  return (
    <div className={`card p-4 flex flex-wrap items-center justify-between gap-3 ${
      overLimit ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50/50'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`rounded-lg p-2 shrink-0 ${overLimit ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {overLimit ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          {overLimit ? (
            <>
              <p className="text-sm font-semibold text-amber-900">
                Tu plan permite hasta <strong>{limit} {resource}</strong>. Tienes <strong>{used}</strong>.
              </p>
              <p className="text-xs text-amber-800">
                <strong>{blocked}</strong> {resource} están bloqueados — sube tu plan para activarlos.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-emerald-900">
                Usando <strong>{used}</strong> de <strong>{limit}</strong> {resource} permitidos
              </p>
              <p className="text-xs text-emerald-800">Aún tienes capacidad disponible en tu plan.</p>
            </>
          )}
        </div>
      </div>
      {overLimit && (
        <Link href={upgradeHref} className="btn-primary text-xs shrink-0">
          Subir plan
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
