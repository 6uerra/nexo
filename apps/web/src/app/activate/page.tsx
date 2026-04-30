'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

function ActivateContent() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError('Mínimo 8 caracteres'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      await api('/auth/activate', { method: 'POST', json: { token, password } });
      router.push('/onboarding');
    } catch (e: any) {
      setError(e?.message ?? 'No pudimos activar tu cuenta');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="card p-7 text-center">
        <p className="text-sm text-muted">Falta el token de activación. Revisa el link de tu correo.</p>
        <Link href="/login" className="btn-outline mt-4 text-sm">Ir a ingresar</Link>
      </div>
    );
  }

  return (
    <div className="card p-7">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Activa tu cuenta</h1>
      <p className="mt-1 text-sm text-muted">Define una contraseña para empezar a usar Nexo.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label">Nueva contraseña</label>
          <input className="input" type="password" required minLength={8}
            value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
        </div>
        <div>
          <label className="label">Confirma la contraseña</label>
          <input className="input" type="password" required minLength={8}
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password" />
        </div>
        {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Activar mi cuenta
        </button>
      </form>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
        </div>
        <Suspense fallback={<div className="card p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted" /></div>}>
          <ActivateContent />
        </Suspense>
      </div>
    </div>
  );
}
