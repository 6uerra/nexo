import { cookies } from 'next/headers';
import { Bell } from 'lucide-react';
import { formatDate } from '@/lib/utils';

async function getNotifications() {
  const c = await cookies();
  const token = c.get(process.env.SESSION_COOKIE_NAME ?? 'nexo_session')?.value;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const r = await fetch(`${apiUrl}/api/v1/notifications`, {
    headers: { cookie: `${process.env.SESSION_COOKIE_NAME ?? 'nexo_session'}=${token}` },
    cache: 'no-store',
  });
  if (!r.ok) return { notifications: [] as any[] };
  return r.json();
}

export default async function NotificationsPage() {
  const { notifications } = await getNotifications();
  return (
    <div className="max-w-3xl space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Notificaciones</h1>
        <p className="text-sm text-muted">Avisos del sistema y vencimientos</p>
      </header>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 font-medium">Sin notificaciones por ahora</p>
          <p className="text-sm text-muted">Te avisaremos por aquí y por correo cuando algo importante ocurra.</p>
        </div>
      ) : (
        <ul className="card divide-y divide-border">
          {notifications.map((n: any) => (
            <li key={n.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{n.title}</p>
                  <p className="mt-1 text-sm text-muted">{n.body}</p>
                </div>
                <span className="text-xs text-muted shrink-0">{formatDate(n.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
