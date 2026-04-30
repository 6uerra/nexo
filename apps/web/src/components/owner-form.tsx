'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { ownerCreateSchema } from '@nexo/shared';
import { EntityDrawer } from './entity-drawer';

type Owner = {
  id?: string;
  fullName: string;
  document: string;
  documentType: 'CC' | 'CE' | 'NIT' | 'PA';
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  address?: string | null;
  bankInfo?: { bank?: string; account?: string; accountType?: string } | null;
  isActive: boolean;
};

const empty: Owner = {
  fullName: '', document: '', documentType: 'CC',
  email: '', phone: '', city: '', address: '',
  bankInfo: { bank: '', account: '', accountType: 'Ahorros' },
  isActive: true,
};

export function OwnerCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary text-sm">
        <Plus className="h-4 w-4" /> Nuevo propietario
      </button>
      {open && <OwnerDrawer initial={empty} onClose={() => setOpen(false)} />}
    </>
  );
}

export function OwnerActions({ owner }: { owner: Owner }) {
  const [edit, setEdit] = useState(false);
  const router = useRouter();
  async function remove() {
    if (!owner.id) return;
    if (!confirm(`¿Eliminar al propietario "${owner.fullName}"? Sus vehículos quedarán sin asignar.`)) return;
    try {
      await api(`/owners/${owner.id}`, { method: 'DELETE' });
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? 'Error al eliminar');
    }
  }
  return (
    <>
      <div className="flex gap-1">
        <button onClick={() => setEdit(true)} className="rounded-md p-1.5 text-muted hover:bg-background hover:text-primary cursor-pointer" aria-label="Editar"><Pencil className="h-4 w-4" /></button>
        <button onClick={remove} className="rounded-md p-1.5 text-muted hover:bg-red-50 hover:text-red-600 cursor-pointer" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
      </div>
      {edit && <OwnerDrawer initial={owner} onClose={() => setEdit(false)} />}
    </>
  );
}

function OwnerDrawer({ initial, onClose }: { initial: Owner; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState<Owner>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isEdit = !!initial.id;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = ownerCreateSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    setBusy(true);
    try {
      if (isEdit) await api(`/owners/${initial.id}`, { method: 'PUT', json: parsed.data });
      else await api('/owners', { method: 'POST', json: parsed.data });
      onClose();
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo guardar');
    } finally { setBusy(false); }
  }

  return (
    <EntityDrawer
      open onClose={onClose} onSubmit={submit} submitting={busy} error={error}
      title={isEdit ? 'Editar propietario' : 'Nuevo propietario'}
      subtitle="Datos personales y bancarios para pagos"
      submitLabel={isEdit ? 'Guardar cambios' : 'Crear propietario'}
    >
      <div>
        <label className="label">Nombre completo</label>
        <input className="input" name="fullName" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Tipo doc.</label>
          <select className="input" value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value as any })}>
            <option value="CC">CC</option><option value="CE">CE</option><option value="NIT">NIT</option><option value="PA">Pasaporte</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Documento</label>
          <input className="input" name="document" required value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Teléfono</label>
          <input className="input" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Ciudad</label>
          <input className="input" value={form.city ?? ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div>
          <label className="label">Dirección</label>
          <input className="input" value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
      </div>
      <fieldset className="rounded-lg border border-border p-3">
        <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted">Datos bancarios</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="label">Banco</label><input className="input" value={form.bankInfo?.bank ?? ''} onChange={(e) => setForm({ ...form, bankInfo: { ...form.bankInfo, bank: e.target.value } })} /></div>
          <div><label className="label">Tipo cuenta</label><input className="input" value={form.bankInfo?.accountType ?? ''} onChange={(e) => setForm({ ...form, bankInfo: { ...form.bankInfo, accountType: e.target.value } })} /></div>
          <div><label className="label">N° cuenta</label><input className="input font-mono" value={form.bankInfo?.account ?? ''} onChange={(e) => setForm({ ...form, bankInfo: { ...form.bankInfo, account: e.target.value } })} /></div>
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-border text-primary cursor-pointer" />
        <span>Propietario activo</span>
      </label>
    </EntityDrawer>
  );
}
