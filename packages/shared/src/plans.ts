import type { ModuleKey } from './constants';

export type PlanKey = 'free_trial' | 'standard' | 'pro' | 'enterprise';

export interface PlanDef {
  key: PlanKey;
  name: string;
  tagline: string;
  priceLabel: string;
  vehicleLimit: number | 'unlimited';
  modules: ModuleKey[];
  highlights: string[];
  highlighted?: boolean;
}

const ALL_MODULES: ModuleKey[] = [
  'vehicles', 'drivers', 'owners', 'clients', 'contracts',
  'maintenance', 'billing', 'notifications', 'reports', 'prospects',
];

export const PLANS: Record<PlanKey, PlanDef> = {
  free_trial: {
    key: 'free_trial',
    name: 'Trial',
    tagline: '30 días para probar todo',
    priceLabel: 'Gratis',
    vehicleLimit: 5,
    modules: ALL_MODULES,
    highlights: [
      '30 días sin tarjeta',
      'Hasta 5 vehículos',
      'Todos los módulos activos',
      'Sin soporte priorizado',
    ],
  },
  standard: {
    key: 'standard',
    name: 'Standard',
    tagline: 'Para empresas en crecimiento',
    priceLabel: 'Próximamente',
    vehicleLimit: 20,
    modules: ['vehicles', 'drivers', 'owners', 'clients', 'notifications'],
    highlights: [
      'Hasta 20 vehículos',
      'Vehículos, conductores, propietarios',
      'Empresas cliente',
      'Notificaciones por email',
      'Soporte por correo',
    ],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    tagline: 'La opción más completa',
    priceLabel: 'Próximamente',
    vehicleLimit: 100,
    modules: ['vehicles', 'drivers', 'owners', 'clients', 'notifications', 'contracts', 'maintenance', 'prospects', 'billing'],
    highlights: [
      'Hasta 100 vehículos',
      'Todo lo de Standard',
      'Contratos PDF generados',
      'Mantenimientos con deducción automática',
      'Facturación cruzada',
      'Soporte prioritario',
    ],
    highlighted: true,
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    tagline: 'A tu medida',
    priceLabel: 'Cotización',
    vehicleLimit: 'unlimited',
    modules: ALL_MODULES,
    highlights: [
      'Vehículos ilimitados',
      'Todos los módulos',
      'Reportes avanzados',
      'Integraciones premium opcionales',
      'WhatsApp Business, API, dominio propio',
      '(estas integraciones usan herramientas pagas externas)',
      'Soporte dedicado y SLA',
    ],
  },
};

export const PLAN_KEYS: PlanKey[] = ['free_trial', 'standard', 'pro', 'enterprise'];

export function getPlanModules(key: PlanKey): ModuleKey[] {
  return PLANS[key]?.modules ?? [];
}

export function moduleIsInPlan(moduleKey: ModuleKey, planKey: PlanKey): boolean {
  return getPlanModules(planKey).includes(moduleKey);
}
