import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function BlockedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Acceso bloqueado</h1>
        <p className="mt-2 text-sm text-muted">
          Tu suscripción está vencida. Realiza un pago para reactivar el acceso a Nexo.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/settings/subscription" className="btn-primary">Ver opciones de pago</Link>
          <Link href="/" className="btn-ghost">Volver al inicio</Link>
        </div>
      </div>
      <div className="absolute top-6 left-6">
        <Logo />
      </div>
    </div>
  );
}
