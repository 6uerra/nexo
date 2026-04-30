'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Truck, Users, Building2, FileText, Wrench,
  Receipt, Bell, Settings, LogOut, ShieldCheck,
} from 'lucide-react';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import type { AuthSession } from '@nexo/shared';

const NAV_ITEMS = [
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
  const items = NAV_ITEMS.filter((it) => !it.module || enabledModules.includes(it.module));

  async function logout() {
    await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/';
  }

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + '/');
          const Icon = it.icon;
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
      </nav>
      <div className="border-t border-border p-3">
        <Link
          href="/settings/modules"
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-background cursor-pointer"
        >
          <Settings className="h-5 w-5" />
          <span>Configuración</span>
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
  );
}
