'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { vehicleCreateSchema } from '@nexo/shared';
import { EntityDrawer } from './entity-drawer';
import { MediaCapture, type MediaItem } from './media-capture';

type Vehicle = {
  id?: string;
  ownerId?: string | null;
  plate: string;
  type: 'car_4x4' | 'sedan' | 'minivan' | 'bus' | 'truck' | 'pickup' | 'other';
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  capacity?: number | null;
  soatExpiresAt?: string | null;
  rtmExpiresAt?: string | null;
  insuranceExpiresAt?: string | null;
  status: 'active' | 'inactive' | 'maintenance' | 'sold';
  notes?: string | null;
};

const empty: Vehicle = {
  plate: '', type: 'sedan', brand: '', model: '', color: '', notes: '',
  status: 'active', soatExpiresAt: '', rtmExpiresAt: '', insuranceExpiresAt: '',
};

export function VehicleCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary text-sm">
        <Plus className="h-4 w-4" /> Nuevo vehículo
      </button>
      {open && <VehicleDrawer initial={empty} onClose={() => setOpen(false)} />}
    </>
  );
}

export function VehicleActions({ vehicle }: { vehicle: Vehicle }) {
  const [edit, setEdit] = useState(false);
  const router = useRouter();
  async function remove() {
    if (!vehicle.id) return;
    if (!confirm(`¿Eliminar el vehículo ${vehicle.plate}?`)) return;
    try { await api(`/vehicles/${vehicle.id}`, { method: 'DELETE' }); router.refresh(); } catch (e: any) { alert(e?.message); }
  }
  return (
    <>
      <div className="flex gap-1">
        <button onClick={() => setEdit(true)} className="rounded-md p-1.5 text-muted hover:bg-background hover:text-primary cursor-pointer" aria-label="Editar"><Pencil className="h-4 w-4" /></button>
        <button onClick={remove} className="rounded-md p-1.5 text-muted hover:bg-red-50 hover:text-red-600 cursor-pointer" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
      </div>
      {edit && <VehicleDrawer initial={vehicle} onClose={() => setEdit(false)} />}
    </>
  );
}

function VehicleDrawer({ initial, onClose }: { initial: Vehicle; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState<Vehicle>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [owners, setOwners] = useState<Array<{ id: string; fullName: string }>>([]);
  const isEdit = !!initial.id;

  useEffect(() => {
    api<{ owners: Array<{ id: string; fullName: string }> }>('/owners').then((r) => setOwners(r.owners)).catch(() => {});
  }, []);

  const [media, setMedia] = useState<MediaItem[]>([]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = vehicleCreateSchema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Datos inválidos'); return; }
    setBusy(true);
    try {
      if (isEdit) await api(`/vehicles/${initial.id}`, { method: 'PUT', json: parsed.data });
      else await api('/vehicles', { method: 'POST', json: parsed.data });
      onClose(); router.refresh();
    } catch (e: any) { setError(e?.message ?? 'No se pudo guardar'); }
    finally { setBusy(false); }
  }

  return (
    <EntityDrawer
      open onClose={onClose} onSubmit={submit} submitting={busy} error={error}
      title={isEdit ? `Editar vehículo ${initial.plate}` : 'Nuevo vehículo'}
      subtitle="Datos del vehículo, propietario y vencimientos"
      submitLabel={isEdit ? 'Guardar cambios' : 'Crear vehículo'}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Placa</label>
          <input className="input font-mono uppercase" name="plate" required value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })} placeholder="ABC-123" />
        </div>
        <div><label className="label">Tipo</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
            <option value="sedan">Sedán</option><option value="car_4x4">4x4</option>
            <option value="pickup">Pickup</option><option value="minivan">Minivan</option>
            <option value="bus">Bus</option><option value="truck">Camión</option>
            <option value="other">Otro</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Propietario</label>
        <select className="input" value={form.ownerId ?? ''} onChange={(e) => setForm({ ...form, ownerId: e.target.value || null })}>
          <option value="">— Sin asignar —</option>
          {owners.map((o) => <option key={o.id} value={o.id}>{o.fullName}</option>)}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label className="label">Marca</label><input className="input" value={form.brand ?? ''} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
        <div><label className="label">Modelo</label><input className="input" value={form.model ?? ''} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
        <div><label className="label">Año</label><input className="input tabular-nums" type="number" min={1950} max={2100} value={form.year ?? ''} onChange={(e) => setForm({ ...form, year: e.target.value ? Number(e.target.value) : null })} /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Color</label><input className="input" value={form.color ?? ''} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
        <div><label className="label">Capacidad (pasajeros)</label><input className="input tabular-nums" type="number" min={1} max={100} value={form.capacity ?? ''} onChange={(e) => setForm({ ...form, capacity: e.target.value ? Number(e.target.value) : null })} /></div>
      </div>
      <fieldset className="rounded-lg border border-border p-3 space-y-3">
        <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted">Vencimientos</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="label">SOAT</label><input className="input" type="date" value={form.soatExpiresAt ?? ''} onChange={(e) => setForm({ ...form, soatExpiresAt: e.target.value })} /></div>
          <div><label className="label">Tecnomec.</label><input className="input" type="date" value={form.rtmExpiresAt ?? ''} onChange={(e) => setForm({ ...form, rtmExpiresAt: e.target.value })} /></div>
          <div><label className="label">Póliza</label><input className="input" type="date" value={form.insuranceExpiresAt ?? ''} onChange={(e) => setForm({ ...form, insuranceExpiresAt: e.target.value })} /></div>
        </div>
      </fieldset>
      <div>
        <label className="label">Estado</label>
        <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
          <option value="active">Activo</option><option value="maintenance">En mantenimiento</option>
          <option value="inactive">Inactivo</option><option value="sold">Vendido</option>
        </select>
      </div>
      <div>
        <label className="label">Notas</label>
        <textarea className="input min-h-[60px]" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      {isEdit && initial.id && (
        <fieldset className="rounded-lg border border-border p-3">
          <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted">Fotos, matrícula y videos</legend>
          <p className="text-xs text-muted mb-2">Adjunta evidencia visual del vehículo. La foto de la matrícula puede tomarse directamente con la cámara.</p>
          <MediaCapture
            entityType="vehicle"
            entityId={initial.id}
            kinds={['image', 'video', 'document']}
            label="vehicle"
            initial={media}
            onChange={setMedia}
          />
        </fieldset>
      )}
    </EntityDrawer>
  );
}
