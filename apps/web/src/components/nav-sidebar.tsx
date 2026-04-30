'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Truck, Users, Building2, FileText, Wrench,
  Receipt, Bell, Settings, LogOut, ShieldCheck, Wallet, Sparkles,
  BarChart3, Lock, Briefcase, UserCircle, Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import { ComingSoonModal } from './coming-soon-modal';
import type { AuthSession } from '@nexo/shared';

type NavItem = { href: string; label: string; icon: LucideIcon; module: string | null };

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: null },
  { href: '/vehicles', label: 'Vehículos', icon: Truck, module: 'vehicles' },
  { href: '/drivers', label: 'Conductores', icon: Users, module: 'drivers' },
  { href: '/owners', label: 'Propietarios', icon: ShieldCheck, module: 'owners' },
  { href: '/clients', label: 'Empresas', icon: Building2, module: 'clients' },
  { href: '/contracts', label: 'Contratos', icon: FileText, module: 'contracts' },
  { href: '/maintenance', label: 'Mantenimiento', icon: Wrench, module: 'maintenance' },
  { href: '/billing', label: 'Facturación', icon: Receipt, module: 'billing' },
  { href: '/notifications', label: 'Notificaciones', icon: Bell, module: null },
];

export function NavSidebar({
  session,
  enabledModules,
}: {
  session: AuthSession;
  enabledModules: string[];
}) {
  const pathname = usePathname();
  const [lockedClick, setLockedClick] = useState<{ label: string } | null>(null);

  async function logout() {
    await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/';
  }

  return (
    <>
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {NAV_ITEMS.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + '/');
            const locked = it.module !== null && !enabledModules.includes(it.module);
            const Icon = it.icon;

            if (locked) {
              return (
                <button
                  key={it.href}
                  onClick={() => setLockedClick({ label: it.label })}
                  className="group w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-background cursor-pointer transition-colors"
                >
                  <Icon className="h-5 w-5 shrink-0 opacity-60" />
                  <span className="opacity-70">{it.label}</span>
                  <Lock className="h-3.5 w-3.5 ml-auto shrink-0 opacity-60" />
                </button>
              );
            }

            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 cursor-pointer',
                  active ? 'bg-primary text-white' : 'text-ink hover:bg-background',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{it.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 mt-2 border-t border-border">
            <Link
              href="/roadmap"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-background hover:text-ink cursor-pointer transition-colors"
            >
              <Sparkles className="h-5 w-5" />
              <span>Próximamente</span>
            </Link>
          </div>
        </nav>

        <div className="border-t border-border p-3 space-y-1">
          {session.role === 'super_admin' && (
            <>
              <p className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted">Admin</p>
              <Link href="/admin/clients" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-background cursor-pointer">
                <Briefcase className="h-4 w-4" /><span>Clientes</span>
              </Link>
              <Link href="/admin/plans" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-background cursor-pointer">
                <Star className="h-4 w-4" /><span>Planes</span>
              </Link>
              <Link href="/admin/payment-methods" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-background cursor-pointer">
                <Wallet className="h-4 w-4" /><span>Métodos de pago</span>
              </Link>
              <Link href="/admin/emails" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-background cursor-pointer">
                <BarChart3 className="h-4 w-4" /><span>Correos enviados</span>
              </Link>
            </>
          )}
          <Link href="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-background cursor-pointer">
            <UserCircle className="h-4 w-4" /><span>Mi perfil</span>
          </Link>

          <div className="mt-2 rounded-lg bg-background p-3">
            <p className="text-xs text-muted">Sesión iniciada como</p>
            <p className="truncate text-sm font-semibold text-ink">{session.name}</p>
            <p className="truncate text-xs text-muted">{session.email}</p>
            <button
              onClick={logout}
              className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-muted hover:bg-white hover:text-ink cursor-pointer transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <ComingSoonModal
        open={!!lockedClick}
        onClose={() => setLockedClick(null)}
        moduleLabel={lockedClick?.label}
        title="Módulo no incluido en tu plan"
        description="Esta función no está activa para tu cuenta. Contacta a tu administrador para activarla."
        reason="not_in_plan"
      />
    </>
  );
}
