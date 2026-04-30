import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Mail, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

async function load() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const r = await fetch(`${apiUrl}/api/v1/admin/emails`, {
    headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
    cache: 'no-store',
  });
  if (r.status === 403) return 'forbidden' as const;
  if (!r.ok) return { emails: [] };
  return r.json();
}

const STATUS_ICON = {
  sent: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
  failed: <XCircle className="h-3.5 w-3.5 text-red-600" />,
  pending: <Clock className="h-3.5 w-3.5 text-amber-600" />,
};

export default async function AdminEmailsPage() {
  const data = await load();
  if (data === 'forbidden') redirect('/dashboard');
  const emails = data.emails as any[];

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" /> Correos enviados
        </h1>
        <p className="text-sm text-muted">Últimos 200 correos enviados por el sistema. En dev caen a MailHog (<a href="http://localhost:8025" target="_blank" rel="noreferrer" className="text-primary hover:underline">http://localhost:8025</a>).</p>
      </header>

      {emails.length === 0 ? (
        <div className="card p-12 text-center">
          <Mail className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 font-medium">Sin correos aún</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-background text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-2.5">Fecha</th>
                <th>Para</th>
                <th>Asunto</th>
                <th>Template</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {emails.map((e: any) => (
                <tr key={e.id}>
                  <td className="px-4 py-2.5 text-xs tabular-nums">{formatDate(e.createdAt)}</td>
                  <td className="px-4 py-2.5 text-xs">{e.toEmail}</td>
                  <td className="px-4 py-2.5 text-xs font-medium">{e.subject}</td>
                  <td className="px-4 py-2.5 text-xs"><span className="rounded bg-background px-1.5 py-0.5 font-mono">{e.template}</span></td>
                  <td className="px-4 py-2.5 text-xs flex items-center gap-1.5">
                    {STATUS_ICON[e.status as keyof typeof STATUS_ICON]}
                    <span className="capitalize">{e.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
