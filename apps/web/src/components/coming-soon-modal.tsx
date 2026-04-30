'use client';
import { useEffect } from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  moduleLabel?: string;
  reason?: 'not_in_plan' | 'in_development' | 'coming_soon';
}

const REASON_COPY: Record<NonNullable<Props['reason']>, { tag: string; cta: string; ctaHref: string }> = {
  not_in_plan: {
    tag: 'No incluido en tu plan',
    cta: 'Ver planes disponibles',
    ctaHref: '/roadmap',
  },
  in_development: {
    tag: 'En desarrollo',
    cta: 'Ver roadmap',
    ctaHref: '/roadmap',
  },
  coming_soon: {
    tag: 'Próximamente',
    cta: 'Ver roadmap',
    ctaHref: '/roadmap',
  },
};

export function ComingSoonModal({
  open, onClose,
  title = '¡Estamos en eso!',
  description = 'Esta función todavía no está disponible. Estamos trabajando para tenerla pronto.',
  moduleLabel,
  reason = 'in_development',
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const r = REASON_COPY[reason];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-[fadeIn_.15s_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:bg-background hover:text-ink transition-colors cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-7 pt-7 pb-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <span className="mt-4 inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent">
            {r.tag}
          </span>
          <h2 className="mt-3 text-xl font-bold tracking-tight">{title}</h2>
          {moduleLabel && (
            <p className="mt-1 text-sm font-semibold text-primary">{moduleLabel}</p>
          )}
          <p className="mt-2 text-sm text-muted leading-relaxed">{description}</p>
        </div>

        <div className="flex flex-col gap-2 px-7 pb-7 pt-4">
          <Link
            href={r.ctaHref}
            onClick={onClose}
            className="btn-primary w-full text-sm"
          >
            {r.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button onClick={onClose} className="btn-ghost w-full text-sm">
            Cerrar
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
