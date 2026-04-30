export const APP_NAME = 'Nexo';
export const APP_TAGLINE = 'Conecta tu flota. Simplifica el negocio.';

export const COLORS = {
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  secondary: '#3B82F6',
  accent: '#F97316',
  accentHover: '#EA580C',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textMuted: '#475569',
  border: '#E2E8F0',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
} as const;

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  TENANT_VIEWER: 'tenant_viewer',
} as const;

export const SUBSCRIPTION_GRACE_DAYS = 90; // 3 meses
