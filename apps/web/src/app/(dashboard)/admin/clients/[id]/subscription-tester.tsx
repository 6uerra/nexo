'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertTriangle, ShieldAlert, Lock, Loader2, FlaskConical } from 'lucide-react';
import { api } from '@/lib/api';

const PRESETS = [
  {
    key: 'active',
    label: 'Activa',
    desc: '30 días por delante. Sin avisos.',
    icon: CheckCircle2,
    color: 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    key: 'expiring_soon',
    label: 'Por vencer',
    desc: 'Vence en 5 días. El cliente verá un banner de aviso.',
    icon: AlertTriangle,
    color: 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    key: 'past_due',
    label: 'Vencida (en gracia)',
    desc: 'Venció hace 30 días. Aún tiene 60 días de gracia antes del bloqueo.',
    icon: ShieldAlert,
    color: 'border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    key: 'blocked',
    label: 'Bloqueada (sin acceso)',
    desc: 'Pasaron los 90 días. Toda la operación bloqueada — sólo /settings/subscription.',
    icon: Lock,
    color: 'border-red-300 bg-red-50 text-red-800 hover:bg-red-100',
    iconColor: 'text-red-600',
  },
] as const;

export function SubscriptionTester({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function apply(preset: string) {
    setBusy(preset);
    setFeedback(null);
    try {
      await api(`/admin/clients/${clientId}/set-subscription`, { method: 'POST', json: { preset } });
      setFeedback(`Aplicado: ${PRESETS.find((p) => p.key === preset)?.label}. Entra como cliente para ver el efecto.`);
      router.refresh();
    } catch (e: any) {
      setFeedback(`Error: ${e?.message ?? 'no se aplicó'}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-amber-600" /> Probar estados de suscripción
        </h2>
      </div>
      <p className="text-xs text-muted">
        Cambia el estado de la suscripción del cliente para ver cómo se comporta su vista (avisos, bloqueos, etc.).
        Después entra como cliente desde <code className="rounded bg-background px-1">/login</code> con el icono 🚗.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {PRESETS.map((p) => {
          const Icon = p.icon;
          return (
            <button key={p.key} onClick={() => apply(p.key)} disabled={busy !== null}
              className={`text-left rounded-lg border p-3 cursor-pointer transition-colors disabled:opacity-50 ${p.color}`}>
              <div className="flex items-start gap-2">
                <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${p.iconColor}`} />
                <div className="min-w-0">
                  <p className="font-bold text-sm">{p.label}</p>
                  <p className="text-xs opacity-80 leading-snug">{p.desc}</p>
                </div>
                {busy === p.key && <Loader2 className="h-4 w-4 animate-spin ml-auto shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>

      {feedback && (
        <p className={`text-xs font-semibold ${feedback.startsWith('Error') ? 'text-red-700' : 'text-emerald-700'}`}>
          {feedback}
        </p>
      )}
    </div>
  );
}
