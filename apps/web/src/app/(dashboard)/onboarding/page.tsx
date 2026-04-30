'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { tenantOnboardingSchema } from '@nexo/shared';

const STEPS = [
  { id: 'company', title: 'Datos de la empresa', desc: 'Información legal del intermediario' },
  { id: 'modules', title: 'Activa módulos', desc: 'Selecciona qué quieres usar' },
  { id: 'done', title: 'Listo', desc: 'Empieza a usar Nexo' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    legalName: '',
    nit: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = tenantOnboardingSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos incompletos');
      return;
    }
    setLoading(true);
    try {
      await api('/tenants/me/onboarding', { method: 'PUT', json: parsed.data });
      setStep(1);
    } catch (e: any) {
      setError(e?.message ?? 'Error guardando');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">Bienvenido a Nexo</h1>
      <p className="text-sm text-muted">Configura tu cuenta en 3 pasos rápidos.</p>

      <ol className="mt-6 grid grid-cols-3 gap-3">
        {STEPS.map((s, i) => (
          <li key={s.id} className={`rounded-lg border p-3 ${step === i ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step > i ? 'bg-primary text-white' : step === i ? 'bg-primary text-white' : 'bg-background text-muted'}`}>
                {step > i ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="text-sm font-semibold">{s.title}</span>
            </div>
            <p className="mt-1 text-xs text-muted">{s.desc}</p>
          </li>
        ))}
      </ol>

      <div className="card mt-6 p-6">
        {step === 0 && (
          <form onSubmit={saveCompany} className="space-y-4">
            <h2 className="font-semibold">Datos de la empresa</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Razón social</label>
                <input className="input" required value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} />
              </div>
              <div>
                <label className="label">NIT</label>
                <input className="input" required value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} placeholder="900.123.456-7" />
              </div>
              <div>
                <label className="label">Correo de contacto</label>
                <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input className="input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Dirección</label>
                <input className="input" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <label className="label">Ciudad</label>
                <input className="input" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex justify-end">
              <button className="btn-primary" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar y continuar
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold">Activa los módulos que vas a usar</h2>
            <p className="text-sm text-muted">Puedes cambiarlos cuando quieras desde Configuración → Módulos.</p>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm">
              Por defecto activamos todos. Continúa al dashboard y desactiva los que no necesites.
            </div>
            <div className="flex justify-between">
              <button className="btn-outline" onClick={() => setStep(0)}>Atrás</button>
              <button className="btn-primary" onClick={() => setStep(2)}>Continuar</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center py-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold">¡Todo listo!</h2>
            <p className="mt-1 text-sm text-muted">Empieza a registrar vehículos, conductores y propietarios.</p>
            <button className="btn-primary mt-6" onClick={() => router.push('/dashboard')}>Ir al dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
}
