import { cookies } from 'next/headers';
import { Building2 } from 'lucide-react';

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
    <div className="max-w-5xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Empresas Cliente
          <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">{clients.length}</span>
        </h1>
        <p className="text-sm text-muted">Empresas que te alquilan vehículos.</p>
      </header>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-2.5">Razón social</th>
              <th>NIT</th>
              <th>Contacto</th>
              <th>Ciudad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clients.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Sin empresas cliente aún</td></tr>
            )}
            {clients.map((c: any) => (
              <tr key={c.id}>
                <td className="px-4 py-2.5 font-semibold">{c.legalName}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{c.nit}</td>
                <td className="px-4 py-2.5 text-xs">
                  <p>{c.contactName ?? '—'}</p>
                  <p className="text-muted">{c.email ?? '—'} · {c.phone ?? '—'}</p>
                </td>
                <td className="px-4 py-2.5 text-xs">{c.city ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
