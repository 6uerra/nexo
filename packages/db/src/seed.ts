import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
loadEnv({ path: resolve(process.cwd(), '../../.env') });
loadEnv();
import bcrypt from 'bcryptjs';
import { getDb, closeDb } from './index.js';
import { tenants, users, subscriptions, tenantModules, MODULE_KEYS, platformPaymentMethods, platformPlans } from './schema/index.js';
import { eq } from 'drizzle-orm';

async function main() {
  const db = getDb();
  console.log('🌱 Seeding base de datos...');

  // 1. Tenant "system" para el super-admin
  const slug = 'system';
  const existing = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  let systemTenantId: string;
  if (existing.length === 0) {
    const [t] = await db
      .insert(tenants)
      .values({
        slug,
        name: 'Plataforma Nexo',
        legalName: 'Nexo SAS',
        country: 'CO',
        onboardingCompleted: true,
      })
      .returning();
    systemTenantId = t!.id;
    console.log('  ✔ Tenant "system" creado');
  } else {
    systemTenantId = existing[0]!.id;
    console.log('  ↺ Tenant "system" ya existía');
  }

  // 2. Super admin
  const superEmail = process.env.SEED_SUPERADMIN_EMAIL ?? 'admin@nexo.local';
  const superPass = process.env.SEED_SUPERADMIN_PASSWORD ?? 'NexoAdmin2026!';
  const superName = process.env.SEED_SUPERADMIN_NAME ?? 'Super Admin';
  const existingUser = await db.select().from(users).where(eq(users.email, superEmail)).limit(1);
  if (existingUser.length === 0) {
    const passwordHash = await bcrypt.hash(superPass, 10);
    await db.insert(users).values({
      tenantId: systemTenantId,
      email: superEmail,
      passwordHash,
      name: superName,
      role: 'super_admin',
      isActive: true,
      emailVerified: true,
    });
    console.log(`  ✔ Super admin: ${superEmail} / ${superPass}`);
  } else {
    console.log(`  ↺ Super admin ya existía: ${superEmail}`);
  }

  // 3. Tenant demo + admin demo
  const demoSlug = 'demo';
  const existingDemo = await db.select().from(tenants).where(eq(tenants.slug, demoSlug)).limit(1);
  let demoTenantId: string;
  if (existingDemo.length === 0) {
    const [t] = await db
      .insert(tenants)
      .values({
        slug: demoSlug,
        name: 'Flotas Demo',
        legalName: 'Flotas Demo SAS',
        country: 'CO',
        city: 'Bogotá',
        nit: '900123456-7',
      })
      .returning();
    demoTenantId = t!.id;

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30d
    const blockAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);   // 90d

    await db.insert(subscriptions).values({
      tenantId: demoTenantId,
      plan: 'free_trial',
      status: 'trial',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      blockAt,
    });

    const adminPass = await bcrypt.hash('Demo2026!', 10);
    await db.insert(users).values({
      tenantId: demoTenantId,
      email: 'admin@demo.local',
      passwordHash: adminPass,
      name: 'Admin Demo',
      role: 'tenant_admin',
      isActive: true,
      emailVerified: true,
    });

    const viewerPass = await bcrypt.hash('Viewer2026!', 10);
    await db.insert(users).values({
      tenantId: demoTenantId,
      email: 'viewer@demo.local',
      passwordHash: viewerPass,
      name: 'Viewer Demo',
      role: 'tenant_viewer',
      isActive: true,
      emailVerified: true,
    });

    // Activar todos los módulos
    for (const key of MODULE_KEYS) {
      await db.insert(tenantModules).values({
        tenantId: demoTenantId,
        moduleKey: key,
        enabled: true,
        label: defaultLabel(key),
        description: defaultDescription(key),
      });
    }

    console.log('  ✔ Tenant demo + admin@demo.local / Demo2026!');
    console.log('  ✔ Tenant demo + viewer@demo.local / Viewer2026!');
  } else {
    demoTenantId = existingDemo[0]!.id;
    console.log('  ↺ Tenant demo ya existía');
  }

  // 4. Métodos de pago de la plataforma (datos dummy editables por el super-admin)
  const existingMethods = await db.select().from(platformPaymentMethods).limit(1);
  if (existingMethods.length === 0) {
    await db.insert(platformPaymentMethods).values([
      {
        label: 'Bancolombia',
        kind: 'bank',
        bankName: 'Bancolombia',
        bankAccount: '123-456789-00',
        bankAccountType: 'Cuenta de Ahorros',
        holderName: 'Nexo SAS',
        holderDocument: 'NIT 900.123.456-7',
        instructions: 'Realiza la transferencia y envía el comprobante a admin@nexo.local indicando el NIT de tu empresa.',
        isActive: true,
        sortOrder: '1',
      },
      {
        label: 'Mercado Pago',
        kind: 'mercado_pago',
        link: 'https://mpago.la/tu-link',
        instructions: 'Abre el link, paga el monto correspondiente y guarda el comprobante.',
        isActive: true,
        sortOrder: '2',
      },
    ]);
    console.log('  ✔ Métodos de pago seed (Bancolombia + Mercado Pago — edítalos en /admin/payment-methods)');
  }

  // 5. Planes (editables por super-admin)
  const existingPlans = await db.select().from(platformPlans).limit(1);
  if (existingPlans.length === 0) {
    const ALL = [...MODULE_KEYS] as string[];
    await db.insert(platformPlans).values([
      {
        key: 'free_trial',
        name: 'Trial',
        tagline: '30 días para probar todo',
        priceCop: 0,
        priceLabel: 'Gratis',
        showPrice: true,
        vehicleLimit: 5,
        modules: ALL,
        highlights: [
          '30 días sin tarjeta',
          'Hasta 5 vehículos',
          'Todos los módulos activos',
        ],
        highlighted: false,
        sortOrder: 1,
      },
      {
        key: 'standard',
        name: 'Standard',
        tagline: 'Para flotas en crecimiento',
        priceLabel: 'Consultar',
        showPrice: false,
        vehicleLimit: 20,
        modules: ['vehicles', 'drivers', 'owners', 'clients', 'notifications'],
        highlights: [
          'Hasta 20 vehículos',
          'Vehículos, conductores, propietarios',
          'Empresas cliente',
          'Notificaciones por email',
          'Soporte por correo',
        ],
        highlighted: false,
        sortOrder: 2,
      },
      {
        key: 'pro',
        name: 'Pro',
        tagline: 'La opción más completa',
        priceLabel: 'Consultar',
        showPrice: false,
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
        sortOrder: 3,
      },
      {
        key: 'enterprise',
        name: 'Enterprise',
        tagline: 'A tu medida, con IA',
        priceLabel: 'Cotización personalizada',
        showPrice: false,
        vehicleLimit: null,
        modules: ALL,
        highlights: [
          'Vehículos ilimitados',
          'Todos los módulos',
          'Reportes con IA — insights automáticos',
          'Informes inteligentes con tendencias',
          'Análisis IA de gastos y rentabilidad',
          'Integraciones premium opcionales',
          'WhatsApp Business, API, dominio propio',
          '(estas integraciones usan herramientas pagas externas)',
          'Soporte dedicado y SLA',
        ],
        highlighted: false,
        sortOrder: 4,
      },
    ]);
    console.log('  ✔ Planes seed (Trial, Standard, Pro, Enterprise — edítalos en /admin/plans)');
  }

  console.log('✅ Seed completo');
  await closeDb();
}

function defaultLabel(key: string): string {
  const labels: Record<string, string> = {
    vehicles: 'Vehículos',
    drivers: 'Conductores',
    owners: 'Propietarios',
    clients: 'Empresas Clientes',
    contracts: 'Contratos',
    maintenance: 'Mantenimientos',
    billing: 'Facturación',
    notifications: 'Notificaciones',
    reports: 'Reportes',
    prospects: 'Prospectos',
  };
  return labels[key] ?? key;
}

function defaultDescription(key: string): string {
  const desc: Record<string, string> = {
    vehicles: 'Gestión de vehículos, fotos y documentos legales (SOAT, RTM)',
    drivers: 'Conductores con seguridad social y licencias',
    owners: 'Dueños de los vehículos y datos bancarios para pagos',
    clients: 'Empresas que alquilan vehículos',
    contracts: 'Contratos por tiempo definido o indefinido + PDF',
    maintenance: 'Mantenimientos por fecha y kilometraje',
    billing: 'Facturación cruzada cliente-propietario con deducciones',
    notifications: 'Alertas automáticas por email e in-app',
    reports: 'Reportes y estados de cuenta exportables',
    prospects: 'Vehículos y conductores disponibles para ofertar',
  };
  return desc[key] ?? '';
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
