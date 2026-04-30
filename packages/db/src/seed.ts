import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
loadEnv({ path: resolve(process.cwd(), '../../.env') });
loadEnv();
import bcrypt from 'bcryptjs';
import { getDb, closeDb } from './index.js';
import {
  tenants, users, subscriptions, tenantModules, MODULE_KEYS, platformPaymentMethods, platformPlans,
  owners, drivers, vehicles, clients, contracts, maintenances, invoices,
} from './schema/index.js';
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
  const superName = process.env.SEED_SUPERADMIN_NAME ?? 'Admin';
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
        name: 'Empresa Demo',
        legalName: 'Empresa Demo SAS',
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
      name: 'Cliente Demo',
      role: 'tenant_admin',
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

    console.log('  ✔ Cliente demo: admin@demo.local / Demo2026!');
  } else {
    demoTenantId = existingDemo[0]!.id;
    console.log('  ↺ Tenant demo ya existía');
  }

  // 3.b — Data dummy para que el cliente vea sus módulos con contenido
  await seedDemoData(demoTenantId);

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
        tagline: 'Para empresas en crecimiento',
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

async function seedDemoData(tenantId: string) {
  const db = getDb();
  // skip si ya hay vehículos en el tenant
  const existing = await db.select().from(vehicles).where(eq(vehicles.tenantId, tenantId)).limit(1);
  if (existing.length > 0) {
    console.log('  ↺ Data demo ya existía (skip)');
    return;
  }

  const today = new Date();
  const daysFromNow = (n: number) => {
    const d = new Date(today); d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  // Owners
  const [ownerCarlos, ownerMaria, ownerPedro] = await db.insert(owners).values([
    {
      tenantId, fullName: 'Carlos Rodríguez', document: '79123456', documentType: 'CC',
      email: 'carlos.r@email.com', phone: '+57 310 555 0001',
      city: 'Bogotá', address: 'Cra 7 # 100-50',
      bankInfo: { bank: 'Bancolombia', account: '123-456789-00', accountType: 'Ahorros' },
      isActive: true,
    },
    {
      tenantId, fullName: 'María Hernández', document: '52987654', documentType: 'CC',
      email: 'maria.h@email.com', phone: '+57 311 555 0002',
      city: 'Medellín', address: 'Cl 50 # 30-20',
      bankInfo: { bank: 'Davivienda', account: '987-654321-00', accountType: 'Corriente' },
      isActive: true,
    },
    {
      tenantId, fullName: 'Pedro Gómez', document: '80555111', documentType: 'CC',
      email: 'pedro.g@email.com', phone: '+57 312 555 0003',
      city: 'Cali', address: 'Av 6 # 25-10',
      bankInfo: { bank: 'BBVA', account: '555-111000-00', accountType: 'Ahorros' },
      isActive: true,
    },
  ]).returning();

  // Drivers
  const [drJuan, drLuis, drAndres, drDiego, drRoberto] = await db.insert(drivers).values([
    { tenantId, fullName: 'Juan Pérez', document: '1020304050', documentType: 'CC', licenseNumber: 'LIC123456', licenseCategory: 'C2', licenseExpiresAt: daysFromNow(180), eps: 'Sura', arl: 'Sura', pension: 'Porvenir', medicalExamAt: daysFromNow(-90), medicalExamExpiresAt: daysFromNow(275), phone: '+57 320 100 0001', isActive: true },
    { tenantId, fullName: 'Luis Castro', document: '1020304051', documentType: 'CC', licenseNumber: 'LIC234567', licenseCategory: 'C1', licenseExpiresAt: daysFromNow(45), eps: 'Sanitas', arl: 'Positiva', pension: 'Colpensiones', medicalExamAt: daysFromNow(-30), medicalExamExpiresAt: daysFromNow(335), phone: '+57 320 100 0002', isActive: true },
    { tenantId, fullName: 'Andrés Vargas', document: '1020304052', documentType: 'CC', licenseNumber: 'LIC345678', licenseCategory: 'C2', licenseExpiresAt: daysFromNow(20), eps: 'Compensar', arl: 'Sura', pension: 'Protección', medicalExamAt: daysFromNow(-180), medicalExamExpiresAt: daysFromNow(185), phone: '+57 320 100 0003', isActive: true },
    { tenantId, fullName: 'Diego Suárez', document: '1020304053', documentType: 'CC', licenseNumber: 'LIC456789', licenseCategory: 'B2', licenseExpiresAt: daysFromNow(365), eps: 'Famisanar', arl: 'Colmena', pension: 'Porvenir', medicalExamAt: daysFromNow(-60), medicalExamExpiresAt: daysFromNow(305), phone: '+57 320 100 0004', isActive: true },
    { tenantId, fullName: 'Roberto Mora', document: '1020304054', documentType: 'CC', licenseNumber: 'LIC567890', licenseCategory: 'C1', licenseExpiresAt: daysFromNow(-15), eps: 'Sura', arl: 'Sura', pension: 'Colpensiones', medicalExamAt: daysFromNow(-200), medicalExamExpiresAt: daysFromNow(165), phone: '+57 320 100 0005', isActive: true },
  ]).returning();

  // Vehicles — variar fechas para tener mezcla de estados (al día / por vencer / vencido)
  const [vAbc, vDef, vGhi, vJkl, vMno, vPqr, vStu, vVwx] = await db.insert(vehicles).values([
    { tenantId, ownerId: ownerCarlos!.id, plate: 'ABC-123', type: 'pickup', brand: 'Toyota', model: 'Hilux', year: 2022, color: 'Blanco', capacity: 5,  soatExpiresAt: daysFromNow(120), rtmExpiresAt: daysFromNow(80),  insuranceExpiresAt: daysFromNow(60),  status: 'active' },
    { tenantId, ownerId: ownerMaria!.id,  plate: 'DEF-456', type: 'sedan',  brand: 'Renault', model: 'Sandero', year: 2020, color: 'Gris', capacity: 5,    soatExpiresAt: daysFromNow(15),  rtmExpiresAt: daysFromNow(40),  insuranceExpiresAt: daysFromNow(180), status: 'active' },
    { tenantId, ownerId: ownerPedro!.id,  plate: 'GHI-789', type: 'truck',  brand: 'Chevrolet', model: 'NPR',   year: 2021, color: 'Azul', capacity: 3,   soatExpiresAt: daysFromNow(-10), rtmExpiresAt: daysFromNow(25),  insuranceExpiresAt: daysFromNow(90),  status: 'active' },
    { tenantId, ownerId: ownerCarlos!.id, plate: 'JKL-012', type: 'car_4x4',brand: 'Mazda', model: 'CX-5', year: 2023, color: 'Negro', capacity: 5,     soatExpiresAt: daysFromNow(280), rtmExpiresAt: daysFromNow(180), insuranceExpiresAt: daysFromNow(220), status: 'active' },
    { tenantId, ownerId: ownerMaria!.id,  plate: 'MNO-345', type: 'sedan',  brand: 'Hyundai', model: 'i10',  year: 2019, color: 'Rojo', capacity: 4,    soatExpiresAt: daysFromNow(7),   rtmExpiresAt: daysFromNow(-5),  insuranceExpiresAt: daysFromNow(45),  status: 'maintenance' },
    { tenantId, ownerId: ownerPedro!.id,  plate: 'PQR-678', type: 'minivan',brand: 'Mercedes', model: 'Sprinter', year: 2022, color: 'Plata', capacity: 12, soatExpiresAt: daysFromNow(200), rtmExpiresAt: daysFromNow(150), insuranceExpiresAt: daysFromNow(160), status: 'active' },
    { tenantId, ownerId: ownerCarlos!.id, plate: 'STU-901', type: 'pickup', brand: 'Ford', model: 'Ranger', year: 2021, color: 'Blanco', capacity: 5,   soatExpiresAt: daysFromNow(90),  rtmExpiresAt: daysFromNow(70),  insuranceExpiresAt: daysFromNow(110), status: 'active' },
    { tenantId, ownerId: ownerMaria!.id,  plate: 'VWX-234', type: 'sedan',  brand: 'Kia', model: 'Picanto', year: 2020, color: 'Verde', capacity: 4,   soatExpiresAt: daysFromNow(-30), rtmExpiresAt: daysFromNow(-25), insuranceExpiresAt: daysFromNow(20),  status: 'inactive' },
  ]).returning();

  // Clients (empresas)
  const [cAndes, cLogistica, cMinera] = await db.insert(clients).values([
    { tenantId, legalName: 'Constructora Andes SAS', nit: '900111222-1', contactName: 'Sandra Lopez', email: 'compras@andes.co', phone: '+57 1 555 1100', city: 'Bogotá', address: 'Cl 100 # 8-50', isActive: true },
    { tenantId, legalName: 'Logística Express SAS', nit: '900222333-2', contactName: 'Felipe Ruiz', email: 'operaciones@logiexpress.co', phone: '+57 1 555 1200', city: 'Bogotá', address: 'Av 68 # 22-40', isActive: true },
    { tenantId, legalName: 'Minera del Pacífico SAS', nit: '900333444-3', contactName: 'Camila Torres', email: 'contratos@mineradelpacifico.co', phone: '+57 2 555 1300', city: 'Cali', address: 'Cra 5 # 80-15', isActive: true },
  ]).returning();

  // Contratos
  const [ctr1, ctr2, ctr3, ctr4] = await db.insert(contracts).values([
    { tenantId, code: 'CT-2026-001', clientId: cAndes!.id, vehicleId: vAbc!.id, driverId: drJuan!.id, type: 'fixed_term', status: 'active', startDate: daysFromNow(-90), endDate: daysFromNow(275), monthlyAmountCop: 4500000, routeText: 'Bogotá → obras zona norte (rotativo)' },
    { tenantId, code: 'CT-2026-002', clientId: cLogistica!.id, vehicleId: vDef!.id, driverId: drLuis!.id, type: 'indefinite', status: 'active', startDate: daysFromNow(-180), monthlyAmountCop: 3200000, routeText: 'Bogotá → Medellín (semanal)' },
    { tenantId, code: 'CT-2026-003', clientId: cMinera!.id, vehicleId: vGhi!.id, driverId: drAndres!.id, type: 'fixed_term', status: 'active', startDate: daysFromNow(-60), endDate: daysFromNow(305), monthlyAmountCop: 5800000, routeText: 'Cali → mina Pacífico' },
    { tenantId, code: 'CT-2026-004', clientId: cAndes!.id, vehicleId: vJkl!.id, driverId: drDiego!.id, type: 'fixed_term', status: 'draft', startDate: daysFromNow(15), endDate: daysFromNow(380), monthlyAmountCop: 4200000, routeText: 'Bogotá → obras Chapinero' },
  ]).returning();

  // Mantenimientos
  await db.insert(maintenances).values([
    { tenantId, vehicleId: vAbc!.id, type: 'oil_change', performedAt: daysFromNow(-30), nextDueAt: daysFromNow(60), nextDueKm: 5000, odometerKm: 45230, workshop: 'TallerCentral', costCop: 320000, deductFromOwner: true,  notes: 'Aceite sintético 10W40' },
    { tenantId, vehicleId: vDef!.id, type: 'tires',      performedAt: daysFromNow(-14), nextDueAt: daysFromNow(700), nextDueKm: 30000, odometerKm: 78400, workshop: 'Llantas y Más', costCop: 1500000, deductFromOwner: false, notes: 'Cambio juego completo Pirelli' },
    { tenantId, vehicleId: vGhi!.id, type: 'alignment',  performedAt: daysFromNow(-7),  nextDueAt: daysFromNow(180),                  odometerKm: 95000, workshop: 'TallerCentral', costCop: 200000, deductFromOwner: true,  notes: 'Alineación + balanceo' },
    { tenantId, vehicleId: vJkl!.id, type: 'general',    performedAt: daysFromNow(-21), nextDueAt: daysFromNow(170),                  odometerKm: 22100, workshop: 'Mazda Service', costCop: 540000, deductFromOwner: false, notes: 'Revisión 25.000 km' },
    { tenantId, vehicleId: vMno!.id, type: 'brakes',     performedAt: daysFromNow(-1),  nextDueAt: daysFromNow(365),                  odometerKm: 105200, workshop: 'TallerCentral', costCop: 820000, deductFromOwner: true,  notes: 'Pastillas y discos delanteros' },
  ]);

  // Facturas
  await db.insert(invoices).values([
    { tenantId, direction: 'client_charge', code: 'F-2026-100', counterpartyClientId: cAndes!.id, contractId: ctr1!.id, periodStart: daysFromNow(-30), periodEnd: daysFromNow(0), grossAmountCop: 4500000, deductionsCop: 0, netAmountCop: 4500000, status: 'paid',  issuedAt: new Date(), paidAt: new Date(), notes: 'Mes operativo - Septiembre' },
    { tenantId, direction: 'client_charge', code: 'F-2026-101', counterpartyClientId: cLogistica!.id, contractId: ctr2!.id, periodStart: daysFromNow(-30), periodEnd: daysFromNow(0), grossAmountCop: 3200000, deductionsCop: 0, netAmountCop: 3200000, status: 'issued', issuedAt: new Date(), notes: 'Pendiente cobro' },
    { tenantId, direction: 'owner_payout',   code: 'P-2026-050', counterpartyOwnerId: ownerCarlos!.id, periodStart: daysFromNow(-30), periodEnd: daysFromNow(0), grossAmountCop: 5000000, deductionsCop: 320000, netAmountCop: 4680000, status: 'paid',   paidAt: new Date(), notes: 'Pago neto Carlos - dedujo aceite ABC-123' },
    { tenantId, direction: 'owner_payout',   code: 'P-2026-051', counterpartyOwnerId: ownerMaria!.id,  periodStart: daysFromNow(-30), periodEnd: daysFromNow(0), grossAmountCop: 3200000, deductionsCop: 820000, netAmountCop: 2380000, status: 'issued', issuedAt: new Date(), notes: 'Por pagar - dedujo frenos MNO-345' },
  ]);

  console.log('  ✔ Data demo del cliente: 3 propietarios, 5 conductores, 8 vehículos, 3 empresas, 4 contratos, 5 mantenimientos, 4 facturas');
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
