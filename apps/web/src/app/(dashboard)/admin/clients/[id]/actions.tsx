'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus, RotateCcw, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export function ClientDetailActions({ clientId, inlineToggle }: { clientId: string; inlineToggle?: any }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [enabled, setEnabled] = useState(inlineToggle?.enabled ?? false);

  async function extend() {
    if (!confirm(`¿Regalar ${days} días extra a este cliente?`)) return;
    setBusy('extend');
    try {
      await api(`/admin/clients/${clientId}/extend-subscription`, { method: 'POST', json: { days } });
      router.refresh();
    } finally { setBusy(null); }
  }

  async function resend() {
    setBusy('resend');
    try {
      await api(`/admin/clients/${clientId}/resend-activation`, { method: 'POST' });
      alert('Email de activación reenviado');
    } finally { setBusy(null); }
  }

  async function toggleModule() {
    if (!inlineToggle) return;
    setBusy('toggle');
    try {
      await api(`/modules/${clientId}`, { method: 'PUT', json: { moduleKey: inlineToggle.moduleKey, enabled: !enabled } });
      setEnabled(!enabled);
      router.refresh();
    } finally { setBusy(null); }
  }

  if (inlineToggle) {
    return (
      <button
        onClick={toggleModule}
        disabled={busy === 'toggle'}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${enabled ? 'bg-primary' : 'bg-border'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    );
  }

  return (
    <div className="card p-5 space-y-4">
      <h2 className="font-semibold">Acciones de super admin</h2>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Regalar días extra</label>
          <div className="flex gap-2">
            <input type="number" min={1} max={365} value={days}
              onChange={(e) => setDays(Number(e.target.value) || 30)}
              className="input w-24 tabular-nums" />
            <button onClick={extend} disabled={busy === 'extend'} className="btn-primary text-sm">
              {busy === 'extend' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
              Extender
            </button>
          </div>
        </div>
        <button onClick={resend} disabled={busy === 'resend'} className="btn-outline text-sm">
          {busy === 'resend' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Reenviar activación
        </button>
      </div>
    </div>
  );
}
