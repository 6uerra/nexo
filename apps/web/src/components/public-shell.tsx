import Link from 'next/link';
import { Logo } from './logo';

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
          <Link href="/" className="cursor-pointer"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
            <Link href="/#features" className="hover:text-ink transition-colors">Funciones</Link>
            <Link href="/#planes" className="hover:text-ink transition-colors">Planes</Link>
            <Link href="/roadmap" className="hover:text-ink transition-colors">Próximamente</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost text-sm">Ingresar</Link>
            <Link href="/register" className="btn-primary text-sm">Solicitar acceso</Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border bg-surface py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 lg:px-6">
          <Logo />
          <p className="text-xs text-muted">© {new Date().getFullYear()} Nexo · Hecho en Colombia</p>
        </div>
      </footer>
    </div>
  );
}
