'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Truck, Users, FileText, UserCircle,
  Briefcase, Star, Wallet, CreditCard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuthSession } from '@nexo/shared';

type Item = { href: string; label: string; icon: LucideIcon };

const CLIENT_ITEMS: Item[] = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/vehicles', label: 'Vehículos', icon: Truck },
  { href: '/drivers', label: 'Conductores', icon: Users },
  { href: '/contracts', label: 'Contratos', icon: FileText },
  { href: '/profile', label: 'Perfil', icon: UserCircle },
];

const ADMIN_ITEMS: Item[] = [
  { href: '/admin/clients', label: 'Clientes', icon: Briefcase },
  { href: '/admin/plans', label: 'Planes', icon: Star },
  { href: '/admin/payment-methods', label: 'Pagos', icon: Wallet },
  { href: '/admin/subscription-payments', label: 'Cobros', icon: CreditCard },
  { href: '/profile', label: 'Perfil', icon: UserCircle },
];

export function NavMobile({ session }: { session: AuthSession }) {
  const pathname = usePathname();
  const ITEMS = session.role === 'super_admin' ? ADMIN_ITEMS : CLIENT_ITEMS;

  return (
    <nav className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur-md">
      <ul className="grid grid-cols-5">
        {ITEMS.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + '/');
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-2.5 text-[10px] font-medium transition-colors duration-150',
                  active ? 'text-primary' : 'text-muted hover:text-ink',
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
