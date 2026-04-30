'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle2, Send, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { PLANS, PLAN_KEYS, MODULE_KEYS, MODULE_LABELS, getPlanModules } from '@nexo/shared';

export default function NewClientPage() {
  const router = useRouter();
  const [step, setStep] = useState<'company' | 'plan' | 'modules' | 'confirm' | 'done'>('company');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ activationUrl: string; email: string } | null>(null);

  const [company, setCompany] = useState({
    tenantName: '', legalName: '', nit: '', city: '',
    adminName: '', adminEmail: '',
  });
  const [plan, setPlan] = useState<'free_trial' | 'standard' | 'pro' | 'enterprise'>('free_trial');
  const [trialDays, setTrialDays] = useState(30);
  const [modules, setModules] = useState<string[]>([...MODULE_KEYS]);

  function selectPlan(key: typeof plan) {
    setPlan(key);
    setModules([...getPlanModules(key)]);
  }

  function toggleModule(key: string) {
    setModules((prev) => prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]);
  }

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const r = await api<{ activationToken: string; user: { email: string } }>('/admin/clients', {
        method: 'POST',
        json: { ...company, plan, trialDays, modules },
      });
      setCreated({
        activationUrl: `${window.location.origin}/activate?token=${r.activationToken}`,
        email: r.user.email,
      });
      setStep('done');
    } catch (e: any) {
      setError(e?.message ?? 'No pudimos crear el cliente');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header className="flex items-center gap-3">
        <Link href="/admin/clients" className="btn-ghost text-sm" aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Crear cliente</h1>
          <p className="text-sm text-muted">Empresa + admin + plan + módulos.</p>
        </div>
      </header>

      <Stepper step={step} />

      <div className="card p-6">
        {step === 'company' && (
          <div className="space-y-4">
            <h2 className="font-semibold">1. Datos de la empresa y admin</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre de la empresa">
                <input className="input" required value={company.tenantName}
                  onChange={(e) => setCompany({ ...company, tenantName: e.target.value })} placeholder="Transportes del Norte" />
              </Field>
              <Field label="Razón social (opcional)">
                <input className="input" value={company.legalName}
                  onChange={(e) => setCompany({ ...company, legalName: e.target.value })} placeholder="Transportes del Norte SAS" />
              </Field>
              <Field label="NIT (opcional)">
                <input className="input" value={company.nit}
                  onChange={(e) => setCompany({ ...company, nit: e.target.value })} placeholder="900.123.456-7" />
              </Field>
              <Field label="Ciudad (opcional)">
                <input className="input" value={company.city}
                  onChange={(e) => setCompany({ ...company, city: e.target.value })} placeholder="Bogotá" />
              </Field>
              <Field label="Nombre del admin">
                <input className="input" required value={company.adminName}
                  onChange={(e) => setCompany({ ...company, adminName: e.target.value })} placeholder="Juan Pérez" />
              </Field>
              <Field label="Correo del admin">
                <input className="input" type="email" required value={company.adminEmail}
                  onChange={(e) => setCompany({ ...company, adminEmail: e.target.value })} placeholder="juan@empresa.com" />
              </Field>
            </div>
            <div className="flex justify-end pt-2">
              <button className="btn-primary"
                disabled={!company.tenantName || !company.adminName || !company.adminEmail}
                onClick={() => setStep('plan')}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 'plan' && (
          <div className="space-y-4">
            <h2 className="font-semibold">2. Plan y duración del trial</h2>
            <p className="text-sm text-muted">Elige el plan que le vas a regalar como trial. Después puedes ajustar módulos uno a uno.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PLAN_KEYS.map((key) => {
                const p = PLANS[key];
                const selected = plan === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectPlan(key)}
                    className={`text-left rounded-xl border p-4 cursor-pointer transition-all ${
                      selected ? 'border-primary bg-primary/5 shadow-card' : 'border-border bg-white hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold">{p.name}</span>
                      {selected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </div>
                    <p className="text-xs text-muted mt-1">{p.tagline}</p>
                    <p className="text-xs text-muted mt-2">{p.modules.length} módulos</p>
                  </button>
                );
              })}
            </div>
            <Field label="Días de trial (lo que le regalas)">
              <input type="number" min={1} max={365} className="input w-32 tabular-nums"
                value={trialDays} onChange={(e) => setTrialDays(Number(e.target.value) || 30)} />
              <p className="text-xs text-muted mt-1">Default: 30 días. Después tendrá 90 días de gracia antes del bloqueo.</p>
            </Field>
            <div className="flex justify-between">
              <button className="btn-outline" onClick={() => setStep('company')}>Atrás</button>
              <button className="btn-primary" onClick={() => setStep('modules')}>Continuar</button>
            </div>
          </div>
        )}

        {step === 'modules' && (
          <div className="space-y-4">
            <h2 className="font-semibold">3. Módulos a activar</h2>
            <p className="text-sm text-muted">El cliente solo verá en su menú los módulos activos. Puedes cambiarlos cuando quieras.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODULE_KEYS.map((key) => {
                const meta = MODULE_LABELS[key];
                const enabled = modules.includes(key);
                return (
                  <label key={key} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${enabled ? 'border-primary/40 bg-primary/5' : 'border-border bg-white'}`}>
                    <input type="checkbox" checked={enabled} onChange={() => toggleModule(key)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary cursor-pointer" />
                    <div>
                      <p className="text-sm font-semibold">{meta.label}</p>
                      <p className="text-xs text-muted">{meta.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-between">
              <button className="btn-outline" onClick={() => setStep('plan')}>Atrás</button>
              <button className="btn-primary" onClick={() => setStep('confirm')}>Continuar</button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <h2 className="font-semibold">4. Confirmar y enviar invitación</h2>
            <div className="rounded-lg bg-background p-4 text-sm space-y-2">
              <Row term="Empresa">{company.tenantName}</Row>
              <Row term="Admin">{company.adminName}</Row>
              <Row term="Correo">{company.adminEmail}</Row>
              <Row term="Plan">{PLANS[plan].name} · {trialDays} días de trial</Row>
              <Row term="Módulos activos">{modules.length} de {MODULE_KEYS.length}</Row>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm flex gap-2">
              <Send className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>Le mandaremos un email a <strong>{company.adminEmail}</strong> con un link para activar la cuenta.</span>
            </div>
            {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
            <div className="flex justify-between">
              <button className="btn-outline" onClick={() => setStep('modules')}>Atrás</button>
              <button className="btn-primary" disabled={loading} onClick={submit}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Crear cliente
              </button>
            </div>
          </div>
        )}

        {step === 'done' && created && (
          <div className="text-center py-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-4 text-xl font-bold">¡Cliente creado!</h2>
            <p className="mt-2 text-sm text-muted">Le mandamos un email a {created.email} para que active su cuenta.</p>
            <div className="mt-4 rounded-lg bg-background p-3 text-xs text-left break-all">
              <p className="font-medium mb-1">Link de activación (puedes mandárselo manualmente si no le llegó el correo):</p>
              <p className="font-mono">{created.activationUrl}</p>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              <Link href="/admin/clients" className="btn-outline">Ver lista</Link>
              <button className="btn-primary" onClick={() => router.refresh()}>Crear otro</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted">{term}:</dt>
      <dd className="font-medium text-ink text-right">{children}</dd>
    </div>
  );
}

function Stepper({ step }: { step: string }) {
  const labels = [
    { key: 'company', label: 'Empresa' },
    { key: 'plan', label: 'Plan' },
    { key: 'modules', label: 'Módulos' },
    { key: 'confirm', label: 'Confirmar' },
  ];
  const idx = labels.findIndex((l) => l.key === step);
  return (
    <ol className="flex items-center gap-1 sm:gap-2 text-xs">
      {labels.map((l, i) => {
        const done = i < idx || step === 'done';
        const current = i === idx;
        return (
          <li key={l.key} className="flex items-center gap-1 sm:gap-2 flex-1">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold ${done ? 'bg-primary text-white' : current ? 'bg-primary text-white' : 'bg-background text-muted'}`}>
              {done && i < idx ? '✓' : i + 1}
            </span>
            <span className={`hidden sm:inline ${current ? 'font-semibold text-ink' : 'text-muted'}`}>{l.label}</span>
            {i < labels.length - 1 && <span className="flex-1 border-t border-border" />}
          </li>
        );
      })}
    </ol>
  );
}
