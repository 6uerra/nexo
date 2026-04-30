export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: 'super_admin' | 'tenant_admin' | 'tenant_viewer';
  tenantId: string | null;
  tenantSlug: string | null;
}

export interface KpiStat {
  label: string;
  value: string | number;
  delta?: { value: string; positive?: boolean };
  hint?: string;
}
