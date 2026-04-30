'use client';
import { useEffect, useRef, useState } from 'react';
import { Loader2, Plus, Save, Trash2, Star, Brain, Sparkles, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { MODULE_LABELS, type ModuleKey } from '@nexo/shared';

type Plan = {
  id: string;
  key: string;
  name: string;
  tagline: string | null;
  description: string | null;
  priceCop: number | null;
  priceLabel: string | null;
  showPrice: boolean;
  vehicleLimit: number | null;
  modules: string[];
  highlights: string[];
  highlighted: boolean;
  sortOrder: number;
  isActive: boolean;
};

const ALL_MODULE_KEYS = [
  'vehicles', 'drivers', 'owners', 'clients', 'contracts',
  'maintenance', 'billing', 'notifications', 'reports', 'prospects',
];

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await api<{ plans: Plan[] }>('/admin/plans');
      setPlans(r.plans);
    } catch (e: any) { setError(e?.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save(p: Plan) {
    setSavingId(p.id);
    try {
      await api(`/admin/plans/${p.id}`, { method: 'PUT', json: p });
      await load();
    } catch (e: any) { setError(e?.message); }
    finally { setSavingId(null); }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este plan?')) return;
    await api(`/admin/plans/${id}`, { method: 'DELETE' });
    await load();
  }

  async function addNew() {
    const key = prompt('Identificador del plan (solo minúsculas y _, ej: starter):');
    if (!key) return;
    const name = prompt('Nombre visible:') ?? key;
    await api('/admin/plans', {
      method: 'POST',
      json: { key, name, modules: [], highlights: [], priceLabel: 'Consultar', showPrice: false, sortOrder: plans.length + 1 },
    });
    await load();
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>;

  return (
    <div className="max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Star className="h-6 w-6 text-primary" /> Planes
          </h1>
          <p className="text-sm text-muted">Define los planes que aparecen en la landing y se asignan a clientes.</p>
        </div>
        <button onClick={addNew} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> Nuevo plan
        </button>
      </header>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

      {plans.map((p) => (
        <PlanEditor key={p.id} plan={p} onSave={save} onDelete={remove} saving={savingId === p.id} />
      ))}
    </div>
  );
}

function PlanEditor({
  plan, onSave, onDelete, saving,
}: { plan: Plan; onSave: (p: Plan) => Promise<void>; onDelete: (id: string) => Promise<void>; saving: boolean }) {
  const [p, setP] = useState<Plan>(plan);
  const [highlightsText, setHighlightsText] = useState((plan.highlights ?? []).join('\n'));
  const dirtyRef = useRef(false);

  // Sincroniza desde props si la prop cambia y NO hay edición pendiente local
  useEffect(() => {
    if (!dirtyRef.current) {
      setP(plan);
      setHighlightsText((plan.highlights ?? []).join('\n'));
    }
  }, [plan]);

  function set<K extends keyof Plan>(k: K, v: Plan[K]) {
    dirtyRef.current = true;
    setP((prev) => ({ ...prev, [k]: v }));
  }

  function toggleModule(key: string) {
    set('modules', p.modules.includes(key) ? p.modules.filter((m) => m !== key) : [...p.modules, key]);
  }

  function commitHighlights() {
    set('highlights', highlightsText.split('\n').map((l) => l.trim()).filter(Boolean));
  }

  return (
    <section className={`card p-6 space-y-4 ${p.highlighted ? 'border-primary' : ''}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <input className="input text-base font-bold w-auto"
            value={p.name} onChange={(e) => set('name', e.target.value)} />
          <code className="rounded bg-background px-2 py-1 text-xs font-mono text-muted">{p.key}</code>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={p.highlighted} onChange={(e) => set('highlighted', e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary cursor-pointer" />
            <Star className="h-3.5 w-3.5 text-amber-500" /> Destacado
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={p.isActive} onChange={(e) => set('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary cursor-pointer" />
            Activo
          </label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tagline (subtítulo en la card)">
          <input className="input" value={p.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} />
        </Field>
        <Field label="Orden de aparición">
          <input className="input w-24 tabular-nums" type="number" value={p.sortOrder}
            onChange={(e) => set('sortOrder', Number(e.target.value) || 0)} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Precio en COP (opcional)">
          <input className="input tabular-nums" type="number" min={0}
            value={p.priceCop ?? ''} placeholder="ej. 89000"
            onChange={(e) => set('priceCop', e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Etiqueta alternativa de precio">
          <input className="input" value={p.priceLabel ?? ''}
            placeholder="Consultar / Gratis / Cotización"
            onChange={(e) => set('priceLabel', e.target.value)} />
        </Field>
        <Field label="Límite de vehículos">
          <input className="input tabular-nums" type="number" min={1}
            value={p.vehicleLimit ?? ''} placeholder="vacío = ilimitado"
            onChange={(e) => set('vehicleLimit', e.target.value ? Number(e.target.value) : null)} />
        </Field>
      </div>

      <div className="rounded-lg bg-background p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {p.showPrice ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted" />}
          <div>
            <p className="text-sm font-medium">Mostrar precio en la landing</p>
            <p className="text-xs text-muted">Si está apagado, se muestra "{p.priceLabel || 'Consultar'}".</p>
          </div>
        </div>
        <button type="button" onClick={() => set('showPrice', !p.showPrice)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${p.showPrice ? 'bg-primary' : 'bg-border'}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${p.showPrice ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <div>
        <label className="label flex items-center gap-2">
          Módulos incluidos
          <span className="text-xs font-normal text-muted">({p.modules.length}/{ALL_MODULE_KEYS.length})</span>
        </label>
        <div className="grid gap-2 sm:grid-cols-3">
          {ALL_MODULE_KEYS.map((m) => {
            const meta = MODULE_LABELS[m as ModuleKey];
            return (
              <label key={m} className={`flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer ${p.modules.includes(m) ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                <input type="checkbox" checked={p.modules.includes(m)} onChange={() => toggleModule(m)}
                  className="h-4 w-4 rounded border-border text-primary cursor-pointer" />
                <span>{meta?.label ?? m}</span>
              </label>
            );
          })}
        </div>
      </div>

      <Field label="Highlights (uno por línea)">
        <textarea className="input min-h-[120px] font-mono text-xs"
          value={highlightsText} onChange={(e) => setHighlightsText(e.target.value)} onBlur={commitHighlights}
          placeholder={'30 días sin tarjeta\nHasta 5 vehículos\nTodos los módulos'} />
        <p className="text-xs text-muted mt-1">Tip: si una línea empieza con "(", se muestra como nota pequeña en cursiva.</p>
      </Field>

      {p.key === 'enterprise' && (
        <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-xs text-purple-900 flex gap-2">
          <Brain className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Plan Enterprise: aparecerá una etiqueta "Con IA" en la landing automáticamente.</span>
        </div>
      )}

      <div className="flex justify-between gap-2 pt-2 border-t border-border">
        <button type="button" onClick={() => onDelete(p.id)} className="btn-ghost text-sm text-red-600">
          <Trash2 className="h-4 w-4" /> Eliminar
        </button>
        <button type="button" onClick={async () => {
          commitHighlights();
          await onSave({ ...p, highlights: highlightsText.split('\n').map((l) => l.trim()).filter(Boolean) });
          dirtyRef.current = false;
        }}
          disabled={saving} className="btn-primary text-sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </button>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
