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

export const MODULE_KEYS = [
  'vehicles', 'drivers', 'owners', 'clients', 'contracts',
  'maintenance', 'billing', 'notifications', 'reports', 'prospects',
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export const MODULE_LABELS: Record<ModuleKey, { label: string; desc: string; icon: string }> = {
  vehicles: { label: 'Vehículos', desc: 'Gestión de vehículos y documentos', icon: 'Truck' },
  drivers: { label: 'Conductores', desc: 'Conductores y seguridad social', icon: 'Users' },
  owners: { label: 'Propietarios', desc: 'Dueños de los vehículos', icon: 'ShieldCheck' },
  clients: { label: 'Empresas Cliente', desc: 'Empresas que alquilan vehículos', icon: 'Building2' },
  contracts: { label: 'Contratos', desc: 'Generación de contratos PDF', icon: 'FileText' },
  maintenance: { label: 'Mantenimientos', desc: 'Por fecha y kilometraje', icon: 'Wrench' },
  billing: { label: 'Facturación', desc: 'Cobros y pagos cruzados', icon: 'Receipt' },
  notifications: { label: 'Notificaciones', desc: 'Alertas por email e in-app', icon: 'Bell' },
  reports: { label: 'Reportes', desc: 'Estados de cuenta y exportables', icon: 'BarChart3' },
  prospects: { label: 'Prospectos', desc: 'Vehículos disponibles para ofertar', icon: 'Sparkles' },
};
