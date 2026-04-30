'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/auth/forgot-password', { method: 'POST', json: { email } });
      setSent(true);
    } catch {
      setSent(true); // siempre OK por seguridad
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block"><Logo /></Link>
        </div>
        {sent ? (
          <div className="card p-7 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="mt-4 text-xl font-bold">Listo</h1>
            <p className="mt-2 text-sm text-muted">
              Si ese correo está registrado, te enviamos un link para crear una nueva contraseña.
            </p>
            <Link href="/login" className="btn-outline mt-6 text-sm">Volver a ingresar</Link>
          </div>
        ) : (
          <div className="card p-7">
            <Mail className="h-8 w-8 text-primary" />
            <h1 className="mt-3 text-2xl font-bold tracking-tight">Olvidaste tu contraseña</h1>
            <p className="mt-1 text-sm text-muted">Te mandamos un link a tu correo para que la cambies.</p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label">Correo</label>
                <input className="input" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" autoComplete="email" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar link
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-muted">
              ¿La recuerdas?{' '}
              <Link href="/login" className="font-semibold text-primary hover:text-primary-700">Ingresar</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
