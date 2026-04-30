import { Construction, Sparkles, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

type Status = 'partial' | 'pending' | 'planned';

interface Props {
  status: Status;
  title: string;
  whatWorks?: string[];
  whatPending?: string[];
  sprint?: number;
}

const META: Record<Status, { color: string; icon: any; label: string; tone: string }> = {
  partial: {
    color: 'border-amber-300 bg-amber-50',
    icon: Construction,
    label: 'En desarrollo · Vista parcial',
    tone: 'text-amber-700',
  },
  pending: {
    color: 'border-blue-300 bg-blue-50',
    icon: AlertTriangle,
    label: 'Pendiente de implementación',
    tone: 'text-blue-700',
  },
  planned: {
    color: 'border-slate-300 bg-slate-50',
    icon: Sparkles,
    label: 'Próximamente',
    tone: 'text-slate-700',
  },
};

export function PendingFeatureBanner({ status, title, whatWorks, whatPending, sprint }: Props) {
  const meta = META[status];
  const Icon = meta.icon;
  return (
    <div className={`rounded-xl border p-4 ${meta.color}`}>
      <div className="flex items-start gap-3">
        <div className={`rounded-lg bg-white p-2 shrink-0 shadow-sm ${meta.tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold">{title}</p>
            <span className={`rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.tone}`}>
              {meta.label}
            </span>
            {sprint && (
              <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold">
                Sprint {sprint}
              </span>
            )}
          </div>
          {whatWorks && whatWorks.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">✓ Lo que ya funciona</p>
              <ul className="mt-1 ml-4 list-disc text-xs text-ink/80 space-y-0.5">
                {whatWorks.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </div>
          )}
          {whatPending && whatPending.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">⏳ Pendiente</p>
              <ul className="mt-1 ml-4 list-disc text-xs text-ink/80 space-y-0.5">
                {whatPending.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          )}
          <p className="mt-2 text-[11px] text-muted">
            Ver matriz completa de funcionalidades en <Link href="/roadmap" className="text-primary underline">/roadmap</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
