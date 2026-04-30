import { cookies } from 'next/headers';
import { Truck, Lock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { expiryDot } from '@/lib/expiry';
import { LimitBanner } from '@/components/limit-banner';
import { VehicleCreateButton, VehicleActions } from '@/components/vehicle-form';

async function fetchAll() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const headers = { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` };
  const [vRes, sRes] = await Promise.all([
    fetch(`${apiUrl}/api/v1/vehicles`, { headers, cache: 'no-store' }),
    fetch(`${apiUrl}/api/v1/subscriptions/me`, { headers, cache: 'no-store' }),
  ]);
  const vData = vRes.ok ? await vRes.json() : { vehicles: [] };
  const sData = sRes.ok ? await sRes.json().catch(() => null) : null;
  return {
    vehicles: vData.vehicles as any[],
    vehicleLimit: sData?.plan?.vehicleLimit ?? null,
    planName: sData?.plan?.name ?? null,
  };
}

const TYPE_LABEL: Record<string, string> = {
  car_4x4: '4x4', sedan: 'Sedán', minivan: 'Minivan', bus: 'Bus', truck: 'Camión', pickup: 'Pickup', other: 'Otro',
};

export default async function VehiclesPage() {
  const { vehicles, vehicleLimit, planName } = await fetchAll();
  const items = vehicles.map((v, i) => ({
    ...v,
    blockedByPlan: vehicleLimit !== null && vehicleLimit !== undefined && i >= vehicleLimit,
  }));

  return (
    <div className="max-w-6xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Vehículos
            <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">{vehicles.length}</span>
          </h1>
          <p className="text-sm text-muted">Listado con estado de vencimiento de SOAT, RTM y póliza.</p>
        </div>
        <VehicleCreateButton />
      </header>

      <LimitBanner resource="vehículos" used={vehicles.length} limit={vehicleLimit} />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-2.5">Placa</th>
                <th>Vehículo</th>
                <th>Propietario</th>
                <th>SOAT</th>
                <th>Tecnomec.</th>
                <th>Póliza</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Sin vehículos aún</td></tr>
              )}
              {items.map((v) => {
                const soat = expiryDot(v.soatExpiresAt);
                const rtm = expiryDot(v.rtmExpiresAt);
                const ins = expiryDot(v.insuranceExpiresAt);
                return (
                  <tr key={v.id} className={v.blockedByPlan ? 'opacity-50 bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-background/50'}>
                    <td className="px-4 py-2.5">
                      <span className="font-mono font-bold tabular-nums inline-flex items-center gap-1.5">
                        {v.plate}
                        {v.blockedByPlan && <Lock className="h-3 w-3 text-amber-600" />}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{v.brand} {v.model}</p>
                      <p className="text-xs text-muted">{TYPE_LABEL[v.type] ?? v.type} · {v.year} · {v.color}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs">{v.ownerName ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${soat.color}`} />
                        <span className="tabular-nums">{v.soatExpiresAt ? formatDate(v.soatExpiresAt) : '—'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${rtm.color}`} />
                        <span className="tabular-nums">{v.rtmExpiresAt ? formatDate(v.rtmExpiresAt) : '—'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${ins.color}`} />
                        <span className="tabular-nums">{v.insuranceExpiresAt ? formatDate(v.insuranceExpiresAt) : '—'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {v.blockedByPlan ? (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                          Bloqueado
                        </span>
                      ) : (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          v.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                          v.status === 'maintenance' ? 'bg-amber-50 text-amber-700' :
                          v.status === 'inactive' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-700'
                        }`}>
                          {v.status === 'active' ? 'Activo' : v.status === 'maintenance' ? 'Mantenim.' : v.status === 'inactive' ? 'Inactivo' : 'Vendido'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">{!v.blockedByPlan && <VehicleActions vehicle={v} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {planName && (
        <p className="text-xs text-muted">Plan actual del cliente: <strong>{planName}</strong></p>
      )}
    </div>
  );
}
