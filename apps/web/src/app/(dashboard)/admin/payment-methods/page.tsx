'use client';
import { useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { BrandLogo, brandLabelFor } from '@/components/brand-logo';
import { MediaCapture, type MediaItem } from '@/components/media-capture';

type Method = {
  id: string;
  label: string;
  kind: 'qr' | 'bank' | 'mercado_pago';
  qrImageUrl: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankAccountType: string | null;
  holderName: string | null;
  holderDocument: string | null;
  link: string | null;
  instructions: string | null;
  isActive: boolean;
  sortOrder: string;
};

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await api<{ methods: Method[] }>('/admin/payment-methods');
      setMethods(r.methods);
    } catch (e: any) {
      setError(e?.message ?? 'Error cargando');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(m: Method) {
    setSaving(m.id);
    try {
      await api(`/admin/payment-methods/${m.id}`, { method: 'PUT', json: m });
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Error guardando');
    } finally {
      setSaving(null);
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este método?')) return;
    await api(`/admin/payment-methods/${id}`, { method: 'DELETE' });
    await load();
  }

  async function addNew(kind: Method['kind']) {
    const draft = {
      label: kind === 'bank' ? 'Banco' : kind === 'mercado_pago' ? 'Mercado Pago' : 'Pago QR',
      kind,
      isActive: true,
      sortOrder: String(methods.length + 1),
    };
    await api('/admin/payment-methods', { method: 'POST', json: draft });
    await load();
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>;

  return (
    <div className="max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Métodos de pago</h1>
          <p className="text-sm text-muted">Datos que verán tus tenants al pagar la suscripción.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => addNew('bank')} className="btn-outline text-sm">
            <Plus className="h-4 w-4" /> Banco
          </button>
          <button onClick={() => addNew('mercado_pago')} className="btn-outline text-sm">
            <Plus className="h-4 w-4" /> Mercado Pago
          </button>
          <button onClick={() => addNew('qr')} className="btn-outline text-sm">
            <Plus className="h-4 w-4" /> QR
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
      )}

      {methods.length === 0 && (
        <div className="card p-12 text-center">
          <Wallet className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 font-medium">Sin métodos configurados</p>
          <p className="text-sm text-muted">Agrega Bancolombia, Mercado Pago o un QR arriba.</p>
        </div>
      )}

      {methods.map((m) => (
        <MethodEditor key={m.id} method={m} onSave={save} onDelete={remove} saving={saving === m.id} />
      ))}
    </div>
  );
}

function MethodEditor({
  method, onSave, onDelete, saving,
}: { method: Method; onSave: (m: Method) => Promise<void>; onDelete: (id: string) => Promise<void>; saving: boolean }) {
  const [m, setM] = useState<Method>(method);
  const brand = brandLabelFor(m.kind);

  function set<K extends keyof Method>(k: K, v: Method[K]) {
    setM((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <section className="card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BrandLogo kind={m.kind === 'bank' ? 'bancolombia' : m.kind === 'mercado_pago' ? 'mercado_pago' : 'qr'} />
          <div>
            <input
              className="input text-base font-semibold"
              value={m.label}
              onChange={(e) => set('label', e.target.value)}
              placeholder={brand.label}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={m.isActive} onChange={(e) => set('isActive', e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary cursor-pointer" />
          Activo
        </label>
      </div>

      {m.kind === 'bank' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Banco">
            <input className="input" value={m.bankName ?? ''} onChange={(e) => set('bankName', e.target.value)} placeholder="Bancolombia" />
          </Field>
          <Field label="Tipo de cuenta">
            <input className="input" value={m.bankAccountType ?? ''} onChange={(e) => set('bankAccountType', e.target.value)} placeholder="Cuenta de Ahorros" />
          </Field>
          <Field label="Número de cuenta">
            <input className="input tabular-nums" value={m.bankAccount ?? ''} onChange={(e) => set('bankAccount', e.target.value)} placeholder="123-456789-00" />
          </Field>
          <Field label="Titular">
            <input className="input" value={m.holderName ?? ''} onChange={(e) => set('holderName', e.target.value)} placeholder="Nexo SAS" />
          </Field>
          <Field label="Documento del titular">
            <input className="input" value={m.holderDocument ?? ''} onChange={(e) => set('holderDocument', e.target.value)} placeholder="NIT 900.123.456-7" />
          </Field>
        </div>
      )}

      {m.kind === 'mercado_pago' && (
        <Field label="Link de Mercado Pago">
          <input className="input" type="url" value={m.link ?? ''} onChange={(e) => set('link', e.target.value)} placeholder="https://mpago.la/tu-link" />
        </Field>
      )}

      {(m.kind === 'qr' || m.kind === 'bank') && (
        <Field label="Imagen del QR (opcional)">
          {m.qrImageUrl ? (
            <div className="flex items-start gap-3">
              <img src={m.qrImageUrl} alt="QR" className="h-32 w-32 rounded-lg border border-border" />
              <div className="space-y-2">
                <input className="input text-xs" value={m.qrImageUrl} readOnly />
                <button type="button" className="btn-ghost text-xs text-red-600" onClick={() => set('qrImageUrl', null)}>
                  Quitar QR
                </button>
              </div>
            </div>
          ) : (
            <QrUploader onUploaded={(url) => set('qrImageUrl', url)} />
          )}
        </Field>
      )}

      <Field label="Instrucciones para el tenant">
        <textarea className="input min-h-[70px]" value={m.instructions ?? ''} onChange={(e) => set('instructions', e.target.value)}
          placeholder="Realiza el pago y envía el comprobante a..." />
      </Field>

      <div className="flex justify-between gap-2 pt-2 border-t border-border">
        <button type="button" onClick={() => onDelete(m.id)} className="btn-ghost text-sm text-red-600">
          <Trash2 className="h-4 w-4" /> Eliminar
        </button>
        <button type="button" onClick={() => onSave(m)} disabled={saving} className="btn-primary text-sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </button>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function QrUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  return (
    <div>
      <MediaCapture
        entityType="payment-method"
        kinds={['image']}
        label="QR método de pago"
        initial={items}
        onChange={(list) => {
          setItems(list);
          if (list[0]) onUploaded(list[0].url);
        }}
      />
      <p className="mt-1 text-xs text-muted">Sube una foto o PNG del QR.</p>
    </div>
  );
}
