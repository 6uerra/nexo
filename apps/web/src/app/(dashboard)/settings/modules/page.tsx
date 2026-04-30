'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2, Check, X } from 'lucide-react';

const LABELS: Record<string, { label: string; desc: string }> = {
  vehicles: { label: 'Vehículos', desc: 'Gestión de vehículos y documentos legales' },
  drivers: { label: 'Conductores', desc: 'Conductores con seguridad social y licencias' },
  owners: { label: 'Propietarios', desc: 'Dueños de los vehículos' },
  clients: { label: 'Empresas Clientes', desc: 'Empresas que alquilan vehículos' },
  contracts: { label: 'Contratos', desc: 'Contratos PDF generables' },
  maintenance: { label: 'Mantenimientos', desc: 'Por fecha y kilometraje' },
  billing: { label: 'Facturación', desc: 'Cobros y pagos cruzados' },
  notifications: { label: 'Notificaciones', desc: 'Alertas automáticas' },
  reports: { label: 'Reportes', desc: 'Estados de cuenta y exportables' },
  prospects: { label: 'Prospectos', desc: 'Vehículos disponibles para ofertar' },
};

type ModuleRow = { tenantId: string; moduleKey: string; enabled: boolean };

export default function ModulesSettingsPage() {
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [m, me] = await Promise.all([
          api<{ modules: ModuleRow[] }>('/modules'),
          api<{ session: { tenantId: string | null } }>('/auth/me'),
        ]);
        setModules(m.modules);
        setTenantId(me.session.tenantId);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggle(moduleKey: string, enabled: boolean) {
    if (!tenantId) return;
    setSavingKey(moduleKey);
    try {
      await api(`/modules/${tenantId}`, { method: 'PUT', json: { moduleKey, enabled } });
      setModules((prev) => prev.map((m) => (m.moduleKey === moduleKey ? { ...m, enabled } : m)));
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Módulos</h1>
        <p className="text-sm text-muted">Activa o desactiva las funciones que tu equipo usará. Los módulos desactivados no aparecerán en el menú.</p>
      </header>

      <div className="card divide-y divide-border">
        {modules.map((m) => {
          const meta = LABELS[m.moduleKey] ?? { label: m.moduleKey, desc: '' };
          return (
            <div key={m.moduleKey} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-semibold">{meta.label}</p>
                <p className="text-sm text-muted">{meta.desc}</p>
              </div>
              <button
                onClick={() => toggle(m.moduleKey, !m.enabled)}
                disabled={savingKey === m.moduleKey}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer ${m.enabled ? 'bg-primary' : 'bg-border'}`}
                aria-label={`${m.enabled ? 'Desactivar' : 'Activar'} ${meta.label}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${m.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
