'use client';
import { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  submitting?: boolean;
  error?: string | null;
}

export function EntityDrawer({
  open, onClose, title, subtitle, children, onSubmit,
  submitLabel = 'Guardar', submitting = false, error,
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

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white shadow-2xl flex flex-col animate-[slideIn_.18s_ease-out]"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true"
      >
        <header className="flex items-start justify-between border-b border-border p-5 shrink-0">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1.5 text-muted hover:bg-background hover:text-ink cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form id="entity-drawer-form" onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {children}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}
        </form>

        <footer className="flex justify-end gap-2 border-t border-border p-4 shrink-0">
          <button type="button" onClick={onClose} className="btn-outline text-sm">Cancelar</button>
          <button type="submit" form="entity-drawer-form" disabled={submitting} className="btn-primary text-sm">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </button>
        </footer>
      </div>
      <style jsx>{`
        @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
