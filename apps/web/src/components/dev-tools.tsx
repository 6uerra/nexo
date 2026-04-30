'use client';
import { useEffect, useState } from 'react';
import { Code2, Crown, User, LogOut, X, Loader2, AlertTriangle } from 'lucide-react';

const SEED_USERS = {
  super_admin: {
    label: 'Super Admin',
    email: 'admin@nexo.local',
    password: 'NexoAdmin2026!',
    icon: Crown,
    desc: 'Tú — dueño de la plataforma. Ves todo.',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    redirectTo: '/admin/clients',
  },
  tenant_admin: {
    label: 'Cliente / Admin',
    email: 'admin@demo.local',
    password: 'Demo2026!',
    icon: User,
    desc: 'Empresa cliente — usa el sistema día a día.',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    redirectTo: '/dashboard',
  },
} as const;

type RoleKey = keyof typeof SEED_USERS;

export function DevTools() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<{ email: string; role: string; name: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(process.env.NEXT_PUBLIC_DEV_MODE === 'true');
    refreshSession();
  }, []);

  async function refreshSession() {
    try {
      const r = await fetch('/api/v1/auth/me', { credentials: 'include' });
      if (r.ok) {
        const data = await r.json();
        setMe(data.session);
      } else {
        setMe(null);
      }
    } catch {
      setMe(null);
    }
  }

  async function loginAs(role: RoleKey) {
    setBusy(role);
    try {
      const u = SEED_USERS[role];
      // Logout primero por si hay sesión previa
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
      const r = await fetch('/api/v1/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email, password: u.password }),
      });
      if (!r.ok) {
        alert('No pude entrar. Verifica el seed: pnpm db:seed');
        return;
      }
      window.location.href = u.redirectTo;
    } finally {
      setBusy(null);
    }
  }

  async function logout() {
    setBusy('logout');
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } finally {
      setBusy(null);
    }
  }

  if (!enabled) return null;

  return (
    <>
      {/* Botón flotante (bottom-left, evita el botón de Next dev tools en bottom-right) */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Dev Tools — switch role"
        className="fixed bottom-4 left-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl ring-2 ring-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
        title="Modo desarrollo — entrar como super admin / cliente"
      >
        <Code2 className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-slate-900">DEV</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center lg:justify-start bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="m-0 lg:m-4 lg:ml-20 w-full lg:w-80 rounded-t-2xl lg:rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <Code2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight">Dev Tools</p>
                  <p className="text-[10px] text-muted leading-tight">Modo prueba · Quitar antes de prod</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-background cursor-pointer">
                <X className="h-4 w-4 text-muted" />
              </button>
            </div>

            <div className="px-4 py-3">
              {me ? (
                <div className="rounded-lg bg-background p-3 mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Sesión actual</p>
                  <p className="mt-1 text-sm font-semibold truncate">{me.name}</p>
                  <p className="text-xs text-muted truncate">{me.email}</p>
                  <span className="mt-1.5 inline-block rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
                    {me.role.replace('_', ' ')}
                  </span>
                </div>
              ) : (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 mb-3 text-xs text-amber-800 flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  Sin sesión activa
                </div>
              )}

              <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Entrar como…</p>
              <div className="space-y-2">
                {(Object.keys(SEED_USERS) as RoleKey[]).map((roleKey) => {
                  const u = SEED_USERS[roleKey];
                  const Icon = u.icon;
                  const current = me?.role === roleKey;
                  return (
                    <button
                      key={roleKey}
                      onClick={() => loginAs(roleKey)}
                      disabled={busy !== null}
                      className={`w-full text-left rounded-lg border p-3 transition-all cursor-pointer hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${u.color} ${current ? 'ring-2 ring-current' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
                          {busy === roleKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-sm">{u.label}</p>
                            {current && <span className="text-[9px] font-bold uppercase">activo</span>}
                          </div>
                          <p className="text-[11px] opacity-75 leading-snug">{u.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {me && (
                <button
                  onClick={logout}
                  disabled={busy === 'logout'}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-background cursor-pointer transition-colors disabled:opacity-50"
                >
                  {busy === 'logout' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                  Cerrar sesión
                </button>
              )}

              <p className="mt-3 text-[10px] text-muted leading-relaxed">
                Estos accesos directos usan las credenciales de seed. Quita esta herramienta antes de subir a producción cambiando <code className="rounded bg-background px-1">NEXT_PUBLIC_DEV_MODE</code> a <code className="rounded bg-background px-1">false</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
