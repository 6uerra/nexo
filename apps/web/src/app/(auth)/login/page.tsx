'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { api } from '@/lib/api';
import { loginSchema, type AuthSession } from '@nexo/shared';
import { AlertCircle, Loader2, KeyRound, Car } from 'lucide-react';
import { TestFillButton } from '@/components/test-fill-button';

// Quick-login icons. Quita este bloque y los handlers `quickLogin` antes de producción.
const QUICK_USERS = {
  admin: { email: 'admin@nexo.local', password: 'NexoAdmin2026!', redirect: '/admin/clients' },
  user: { email: 'admin@demo.local', password: 'Demo2026!', redirect: '/dashboard' },
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickBusy, setQuickBusy] = useState<'admin' | 'user' | null>(null);

  async function quickLogin(role: 'admin' | 'user') {
    setError(null);
    setQuickBusy(role);
    try {
      const u = QUICK_USERS[role];
      // Limpia sesión previa por si hay otra activa
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
      const r = await api<{ session: AuthSession }>('/auth/login', { method: 'POST', json: { email: u.email, password: u.password } });
      router.push(u.redirect);
    } catch (e: any) {
      setError(e?.message ?? 'No pudimos entrar con la cuenta de prueba');
    } finally {
      setQuickBusy(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    setLoading(true);
    try {
      const r = await api<{ session: AuthSession }>('/auth/login', { method: 'POST', json: parsed.data });
      if (r.session.role === 'super_admin') router.push('/admin');
      else if (!r.session.tenantId) router.push('/onboarding');
      else router.push('/dashboard');
    } catch (e: any) {
      setError(e?.message ?? 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
        </div>
        <div className="card p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Bienvenido de vuelta</h1>
              <p className="mt-1 text-sm text-muted">Ingresa con tu cuenta para continuar</p>
            </div>
            <TestFillButton onFill={() => { setEmail('admin@demo.local'); setPassword('Demo2026!'); }} label="Demo" />
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="label">Correo</label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="tu@correo.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">Contraseña</label>
              <input
                id="password" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="input" placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Ingresar
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
            <Link href="/forgot-password" className="text-muted hover:text-ink">¿Olvidaste tu contraseña?</Link>
            <Link href="/register" className="font-semibold text-primary hover:text-primary-700">Solicitar acceso</Link>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <Link href="/roadmap" className="text-xs text-muted hover:text-ink">Ver lo que viene en Nexo →</Link>
          </div>

          {/* Quick-login icons (quita antes de producción) */}
          <div className="mt-3 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => quickLogin('admin')}
              disabled={quickBusy !== null}
              aria-label="Entrar como admin"
              title="Entrar como admin"
              className="group inline-flex h-7 w-7 items-center justify-center rounded-md text-muted/60 hover:text-amber-600 hover:bg-amber-50 cursor-pointer transition-colors disabled:opacity-30"
            >
              {quickBusy === 'admin'
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <KeyRound className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => quickLogin('user')}
              disabled={quickBusy !== null}
              aria-label="Entrar como usuario"
              title="Entrar como usuario"
              className="group inline-flex h-7 w-7 items-center justify-center rounded-md text-muted/60 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors disabled:opacity-30"
            >
              {quickBusy === 'user'
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Car className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          Al ingresar aceptas nuestros{' '}
          <a href="#" className="underline">Términos</a> y{' '}
          <a href="#" className="underline">Política de tratamiento de datos</a>.
        </p>
      </div>
    </div>
  );
}
