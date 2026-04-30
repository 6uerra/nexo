'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { driverCreateSchema } from '@nexo/shared';
import { EntityDrawer } from './entity-drawer';
import { MediaCapture, type MediaItem } from './media-capture';

type Driver = {
  id?: string;
  fullName: string;
  document: string;
  documentType: 'CC' | 'CE' | 'PA';
  licenseNumber?: string | null;
  licenseCategory?: 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3' | null;
  licenseExpiresAt?: string | null;
  eps?: string | null;
  arl?: string | null;
  pension?: string | null;
  medicalExamAt?: string | null;
  medicalExamExpiresAt?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
};

const empty: Driver = {
  fullName: '', document: '', documentType: 'CC',
  licenseNumber: '', licenseCategory: 'C1', licenseExpiresAt: '',
  eps: '', arl: '', pension: '', medicalExamAt: '', medicalExamExpiresAt: '',
  phone: '', email: '', isActive: true,
};

export function DriverCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary text-sm">
        <Plus className="h-4 w-4" /> Nuevo conductor
      </button>
      {open && <DriverDrawer initial={empty} onClose={() => setOpen(false)} />}
    </>
  );
}

export function DriverActions({ driver }: { driver: Driver }) {
  const [edit, setEdit] = useState(false);
  const router = useRouter();
  async function remove() {
    if (!driver.id) return;
    if (!confirm(`¿Eliminar al conductor "${driver.fullName}"?`)) return;
    try { await api(`/drivers/${driver.id}`, { method: 'DELETE' }); router.refresh(); } catch (e: any) { alert(e?.message); }
  }
  return (
    <>
      <div className="flex gap-1">
        <button onClick={() => setEdit(true)} className="rounded-md p-1.5 text-muted hover:bg-background hover:text-primary cursor-pointer" aria-label="Editar"><Pencil className="h-4 w-4" /></button>
        <button onClick={remove} className="rounded-md p-1.5 text-muted hover:bg-red-50 hover:text-red-600 cursor-pointer" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
      </div>
      {edit && <DriverDrawer initial={driver} onClose={() => setEdit(false)} />}
    </>
  );
}

function DriverDrawer({ initial, onClose }: { initial: Driver; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState<Driver>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isEdit = !!initial.id;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = driverCreateSchema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Datos inválidos'); return; }
    setBusy(true);
    try {
      if (isEdit) await api(`/drivers/${initial.id}`, { method: 'PUT', json: parsed.data });
      else await api('/drivers', { method: 'POST', json: parsed.data });
      onClose(); router.refresh();
    } catch (e: any) { setError(e?.message ?? 'No se pudo guardar'); }
    finally { setBusy(false); }
  }

  return (
    <EntityDrawer
      open onClose={onClose} onSubmit={submit} submitting={busy} error={error}
      title={isEdit ? 'Editar conductor' : 'Nuevo conductor'}
      subtitle="Datos personales, licencia y seguridad social"
      submitLabel={isEdit ? 'Guardar cambios' : 'Crear conductor'}
    >
      <div>
        <label className="label">Nombre completo</label>
        <input className="input" name="fullName" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label className="label">Tipo doc.</label>
          <select className="input" value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value as any })}>
            <option value="CC">CC</option><option value="CE">CE</option><option value="PA">Pasaporte</option>
          </select>
        </div>
        <div className="sm:col-span-2"><label className="label">Documento</label>
          <input className="input" name="document" required value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
        </div>
      </div>
      <fieldset className="rounded-lg border border-border p-3 space-y-3">
        <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted">Licencia</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="label">Categoría</label>
            <select className="input" value={form.licenseCategory ?? ''} onChange={(e) => setForm({ ...form, licenseCategory: (e.target.value || null) as any })}>
              <option value="">—</option><option>B1</option><option>B2</option><option>B3</option><option>C1</option><option>C2</option><option>C3</option>
            </select>
          </div>
          <div className="sm:col-span-2"><label className="label">Número</label>
            <input className="input font-mono" value={form.licenseNumber ?? ''} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
          </div>
        </div>
        <div><label className="label">Vencimiento de licencia</label>
          <input className="input" type="date" value={form.licenseExpiresAt ?? ''} onChange={(e) => setForm({ ...form, licenseExpiresAt: e.target.value })} />
        </div>
      </fieldset>
      <fieldset className="rounded-lg border border-border p-3 space-y-3">
        <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted">Seguridad social</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="label">EPS</label><input className="input" value={form.eps ?? ''} onChange={(e) => setForm({ ...form, eps: e.target.value })} /></div>
          <div><label className="label">ARL</label><input className="input" value={form.arl ?? ''} onChange={(e) => setForm({ ...form, arl: e.target.value })} /></div>
          <div><label className="label">Pensión</label><input className="input" value={form.pension ?? ''} onChange={(e) => setForm({ ...form, pension: e.target.value })} /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Examen médico</label><input className="input" type="date" value={form.medicalExamAt ?? ''} onChange={(e) => setForm({ ...form, medicalExamAt: e.target.value })} /></div>
          <div><label className="label">Vence examen</label><input className="input" type="date" value={form.medicalExamExpiresAt ?? ''} onChange={(e) => setForm({ ...form, medicalExamExpiresAt: e.target.value })} /></div>
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Email</label><input className="input" type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><label className="label">Teléfono</label><input className="input" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-border text-primary cursor-pointer" />
        <span>Conductor activo</span>
      </label>
      {isEdit && initial.id && (
        <fieldset className="rounded-lg border border-border p-3">
          <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted">Foto y licencia</legend>
          <p className="text-xs text-muted mb-2">Adjunta foto del conductor y de la licencia.</p>
          <MediaCapture entityType="driver" entityId={initial.id} kinds={['image', 'document']} label="driver" initial={[]} />
        </fieldset>
      )}
    </EntityDrawer>
  );
}
