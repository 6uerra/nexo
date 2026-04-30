'use client';
import { useEffect, useState } from 'react';
import { UserCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    (async () => {
      const r = await api<{ session: any }>('/auth/me');
      setMe(r.session);
      setName(r.session.name ?? '');
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(false); setLoading(true);
    try {
      const payload: any = { name, phone: phone || null };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      await api('/auth/profile', { method: 'PUT', json: payload });
      setSuccess(true);
      setCurrentPassword(''); setNewPassword('');
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserCircle className="h-6 w-6 text-primary" /> Mi perfil
        </h1>
        <p className="text-sm text-muted">Edita tus datos personales y contraseña.</p>
      </header>

      {me && (
        <div className="card p-3 text-xs">
          <p><strong>Email:</strong> {me.email}</p>
          <p><strong>Rol:</strong> <span className="capitalize">{me.role.replace('_', ' ')}</span></p>
        </div>
      )}

      <form onSubmit={save} className="card p-6 space-y-4">
        <div>
          <label className="label">Nombre</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} minLength={2} required />
        </div>
        <div>
          <label className="label">Teléfono (opcional)</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57..." />
        </div>

        <div className="pt-4 border-t border-border">
          <h2 className="font-semibold">Cambiar contraseña</h2>
          <p className="text-xs text-muted mb-3">Solo si quieres cambiarla. Si no, déjalo vacío.</p>
          <div className="space-y-3">
            <div>
              <label className="label">Contraseña actual</label>
              <input className="input" type="password" value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <div>
              <label className="label">Nueva contraseña</label>
              <input className="input" type="password" minLength={8} value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password"
                placeholder="Mínimo 8 caracteres" />
            </div>
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
        {success && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Guardado correctamente
          </div>
        )}

        <div className="flex justify-end">
          <button className="btn-primary" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
