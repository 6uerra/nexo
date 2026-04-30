import { cookies } from 'next/headers';
import { Building2, FileText } from 'lucide-react';

async function load() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const r = await fetch(`${apiUrl}/api/v1/clients`, {
    headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
    cache: 'no-store',
  });
  if (!r.ok) return { clients: [] };
  return r.json();
}

export default async function ClientsPage() {
  const { clients } = await load();
  return (
    <div className="max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Empresas Cliente
          <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">{clients.length}</span>
        </h1>
        <p className="text-sm text-muted">Empresas que te alquilan vehículos. Cada card muestra los contratos asociados.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 card p-12 text-center text-muted">Sin empresas cliente aún</div>
        )}
        {clients.map((c: any) => (
          <div key={c.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold leading-tight">{c.legalName}</p>
                <p className="text-xs text-muted font-mono mt-0.5">{c.nit}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {c.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <div className="mt-3 text-xs space-y-1 text-muted">
              {c.contactName && <p>👤 {c.contactName}</p>}
              {c.phone && <p>📞 {c.phone}</p>}
              {c.email && <p>📧 {c.email}</p>}
              {c.city && <p>📍 {c.city}</p>}
            </div>

            {c.contracts && c.contracts.length > 0 ? (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                  <FileText className="h-3 w-3" />
                  {c.contractsCount} {c.contractsCount === 1 ? 'contrato' : 'contratos'}
                  {c.contractsActive > 0 && <span className="text-emerald-700">· {c.contractsActive} activo{c.contractsActive !== 1 ? 's' : ''}</span>}
                </p>
                <div className="mt-1.5 space-y-1">
                  {c.contracts.slice(0, 4).map((ct: any) => (
                    <div key={ct.id} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-mono text-ink">{ct.code}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        ct.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>{ct.status}</span>
                      {ct.vehiclePlate && <span className="font-mono text-muted">{ct.vehiclePlate}</span>}
                    </div>
                  ))}
                  {c.contracts.length > 4 && <p className="text-[10px] text-muted">+{c.contracts.length - 4} más…</p>}
                </div>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted italic">
                Sin contratos asociados
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
