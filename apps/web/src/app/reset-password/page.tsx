'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Loader2, Lock } from 'lucide-react';
import { api } from '@/lib/api';

function ResetContent() {
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
    if (password.length < 8) return setError('Mínimo 8 caracteres');
    if (password !== confirm) return setError('Las contraseñas no coinciden');
    setLoading(true);
    try {
      await api('/auth/reset-password', { method: 'POST', json: { token, password } });
      router.push('/login');
    } catch (e: any) {
      setError(e?.message ?? 'No pudimos restablecer');
    } finally {
      setLoading(false);
    }
  }

  if (!token) return (
    <div className="card p-7 text-center">
      <p className="text-sm text-muted">Token inválido. Pide un nuevo link.</p>
      <Link href="/forgot-password" className="btn-outline mt-4 text-sm">Pedir nuevo link</Link>
    </div>
  );

  return (
    <div className="card p-7">
      <Lock className="h-8 w-8 text-primary" />
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Nueva contraseña</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label">Nueva contraseña</label>
          <input className="input" type="password" required minLength={8}
            value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </div>
        <div>
          <label className="label">Confírmala</label>
          <input className="input" type="password" required minLength={8}
            value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </div>
        {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block"><Logo /></Link>
        </div>
        <Suspense fallback={<div className="card p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted" /></div>}>
          <ResetContent />
        </Suspense>
      </div>
    </div>
  );
}
