'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { api } from '@/lib/api';
import { registerSchema, type AuthSession } from '@nexo/shared';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    tenantName: '',
    tenantSlug: '',
    adminName: '',
    email: '',
    password: '',
    acceptTerms: false,
    acceptHabeasData: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onChange<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === 'tenantName' && typeof v === 'string' && !form.tenantSlug) {
      const slug = v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
      setForm((f) => ({ ...f, tenantSlug: slug }));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    setLoading(true);
    try {
      const r = await api<{ session: AuthSession }>('/auth/register', { method: 'POST', json: parsed.data });
      router.push('/onboarding');
    } catch (e: any) {
      setError(e?.message ?? 'Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
        </div>
        <div className="card p-7">
          <h1 className="text-2xl font-bold tracking-tight">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-muted">30 días gratis · Sin tarjeta</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Nombre del intermediario</label>
                <input className="input" required value={form.tenantName}
                  onChange={(e) => onChange('tenantName', e.target.value)}
                  placeholder="Flotas del Norte" />
              </div>
              <div>
                <label className="label">Identificador (URL)</label>
                <input className="input" required value={form.tenantSlug}
                  onChange={(e) => onChange('tenantSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="flotas-norte" />
              </div>
            </div>
            <div>
              <label className="label">Tu nombre</label>
              <input className="input" required value={form.adminName}
                onChange={(e) => onChange('adminName', e.target.value)}
                placeholder="Camilo Pérez" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Correo</label>
                <input className="input" type="email" required value={form.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  placeholder="tu@empresa.com" />
              </div>
              <div>
                <label className="label">Contraseña</label>
                <input className="input" type="password" required value={form.password}
                  onChange={(e) => onChange('password', e.target.value)}
                  placeholder="Mínimo 8 caracteres" />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input type="checkbox" required checked={form.acceptTerms}
                  onChange={(e) => onChange('acceptTerms', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary cursor-pointer" />
                <span className="text-muted">Acepto los <a href="#" className="text-primary underline">Términos y Condiciones</a></span>
              </label>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input type="checkbox" required checked={form.acceptHabeasData}
                  onChange={(e) => onChange('acceptHabeasData', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary cursor-pointer" />
                <span className="text-muted">Acepto la <a href="#" className="text-primary underline">Política de tratamiento de datos</a> (Ley 1581/2012)</span>
              </label>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear cuenta gratis
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-semibold text-primary hover:text-primary-700 cursor-pointer">
              Ingresar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
