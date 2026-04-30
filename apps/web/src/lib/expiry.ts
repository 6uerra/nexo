export type ExpiryStatus = 'ok' | 'warning' | 'expired' | 'unknown';

export function expiryStatus(dateStr: string | null | undefined, warningDays = 30): ExpiryStatus {
  if (!dateStr) return 'unknown';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'unknown';
  const days = Math.floor((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days < 0) return 'expired';
  if (days <= warningDays) return 'warning';
  return 'ok';
}

export function expiryDot(dateStr: string | null | undefined, warningDays = 30) {
  const s = expiryStatus(dateStr, warningDays);
  return {
    color: s === 'expired' ? 'bg-red-500' : s === 'warning' ? 'bg-amber-500' : s === 'ok' ? 'bg-emerald-500' : 'bg-slate-300',
    label: s === 'expired' ? 'Vencido' : s === 'warning' ? 'Por vencer' : s === 'ok' ? 'Al día' : '—',
  };
}
