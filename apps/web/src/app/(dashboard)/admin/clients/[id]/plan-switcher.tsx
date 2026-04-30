'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, RefreshCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { MODULE_LABELS, type ModuleKey } from '@nexo/shared';

type Plan = { id: string; key: string; name: string; modules: string[] };

export function PlanSwitcher({ clientId, currentPlan }: { clientId: string; currentPlan: string | null }) {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState(currentPlan ?? 'free_trial');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api<{ plans: Plan[] }>('/admin/plans');
        setPlans(r.plans);
      } catch {}
    })();
  }, []);

  async function applyPlan() {
    if (!selected) return;
    setBusy(true);
    setFeedback(null);
    try {
      const r = await api<{ planName: string; modulesEnabled: number }>(`/admin/clients/${clientId}/set-plan`, {
        method: 'POST',
        json: { planKey: selected },
      });
      setFeedback(`Aplicado plan ${r.planName} con ${r.modulesEnabled} módulos activos.`);
      router.refresh();
    } catch (e: any) {
      setFeedback(`Error: ${e?.message ?? 'no se aplicó'}`);
    } finally {
      setBusy(false);
    }
  }

  const planObj = plans.find((p) => p.key === selected);

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Cambiar plan
        </h2>
      </div>
      <p className="text-xs text-muted">
        Al cambiar el plan, los módulos se sincronizan automáticamente con los del plan seleccionado.
        Útil para ver cómo se le ven las vistas al cliente cuando le subes/bajas el plan.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Plan</label>
          <select className="input min-w-[200px]" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {plans.map((p) => (
              <option key={p.key} value={p.key}>{p.name} · {p.modules.length} mods</option>
            ))}
          </select>
        </div>
        <button onClick={applyPlan} disabled={busy} className="btn-primary text-sm">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          Aplicar plan al cliente
        </button>
      </div>

      {planObj && (
        <div className="rounded-lg bg-background p-3 text-xs">
          <p className="font-semibold text-ink mb-1">Módulos del plan {planObj.name}:</p>
          <div className="flex flex-wrap gap-1">
            {planObj.modules.map((m) => {
              const label = MODULE_LABELS[m as ModuleKey]?.label ?? m;
              return (
                <span key={m} className="rounded-md bg-primary/10 px-2 py-0.5 text-primary font-medium">{label}</span>
              );
            })}
          </div>
        </div>
      )}

      {feedback && (
        <p className={`text-xs font-semibold ${feedback.startsWith('Error') ? 'text-red-700' : 'text-emerald-700'}`}>
          {feedback}
        </p>
      )}
    </div>
  );
}
