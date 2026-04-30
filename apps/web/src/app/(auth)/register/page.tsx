'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Logo } from '@/components/logo';
import { Mail, Send, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent('Solicitud de acceso a Nexo');
    const body = encodeURIComponent(
      `Hola,\n\nMe interesa probar Nexo.\n\n` +
      `Nombre: ${form.name}\nEmpresa: ${form.company}\nCorreo: ${form.email}\n\n` +
      `${form.message}\n\nGracias.`
    );
    window.location.href = `mailto:admin@nexo.local?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
        </div>

        {submitted ? (
          <div className="card p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-xl font-bold">¡Solicitud enviada!</h1>
            <p className="mt-2 text-sm text-muted">
              Te contactaremos en menos de 24h con tus credenciales de acceso.
            </p>
            <Link href="/" className="btn-outline mt-6 text-sm">Volver al inicio</Link>
          </div>
        ) : (
          <div className="card p-7">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              <Mail className="h-3.5 w-3.5" />
              Acceso por invitación
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Solicita tu acceso</h1>
            <p className="mt-1 text-sm text-muted">
              Por ahora Nexo es por invitación. Cuéntanos de ti y te activamos un trial de 30 días personalizado.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label">Tu nombre</label>
                <input className="input" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tu nombre completo" autoComplete="name" />
              </div>
              <div>
                <label className="label">Empresa</label>
                <input className="input" required value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Nombre de tu empresa" autoComplete="organization" />
              </div>
              <div>
                <label className="label">Correo</label>
                <input className="input" type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="tu@correo.com" autoComplete="email" />
              </div>
              <div>
                <label className="label">¿Cuántos vehículos manejas?</label>
                <textarea className="input min-h-[80px]" value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Cuéntanos un poco de tu operación..." />
              </div>
              <button type="submit" className="btn-primary w-full">
                <Send className="h-4 w-4" />
                Enviar solicitud
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="font-semibold text-primary hover:text-primary-700 cursor-pointer">
                Ingresar
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
