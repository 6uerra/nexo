'use client';
import { Bell, Menu } from 'lucide-react';
import Link from 'next/link';
import { Logo } from './logo';
import type { AuthSession } from '@nexo/shared';

export function Topbar({ session }: { session: AuthSession }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/95 backdrop-blur-md px-4 lg:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <Logo withText={false} />
        <span className="text-base font-semibold">Nexo</span>
      </div>
      <div className="hidden lg:block flex-1" />
      <div className="flex items-center gap-2">
        <Link
          href="/notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-ink transition-colors duration-150 cursor-pointer"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
        </Link>
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-xs text-muted">Hola</span>
          <span className="text-sm font-semibold text-ink">{session.name.split(' ')[0]}</span>
        </div>
      </div>
    </header>
  );
}
