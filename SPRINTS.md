# Roadmap por Sprints — Nexo

## ✅ Sprint 1 — Núcleo (HECHO)

**Meta:** Que un usuario pueda registrarse, crear su tenant, recorrer onboarding, ver dashboard y ser bloqueado si no paga.

### Tickets completados

- [x] Setup monorepo Turborepo + pnpm
- [x] Docker Compose con Postgres, Redis, MinIO, MailHog
- [x] Schema Drizzle multi-tenant: `tenants`, `users`, `subscriptions`, `subscription_payments`, `tenant_modules`, `notifications`, `audit_log`, `platform_payment_methods`
- [x] Migraciones + seed con super-admin + tenant demo
- [x] Backend Fastify: auth (login, register, logout, me) + tenant guard + subscription guard + role guard
- [x] Endpoints: tenants, modules toggle, subscriptions + payment submit/verify, notifications, dashboard kpis
- [x] Cron in-process para detectar vencimientos y notificar
- [x] Email service con Nodemailer + Gmail/MailHog
- [x] Frontend Next.js: landing, login, register, onboarding wizard, dashboard, settings/modules, settings/subscription, blocked page, panel super-admin
- [x] Logo SVG + design system (paleta + tipografía Plus Jakarta Sans)
- [x] Documentación completa (README, ARCHITECTURE, SECURITY)
- [x] Captura de fotos/videos desde cámara (web + móvil) y subida desde galería; almacenamiento en MinIO via tabla `media` polimórfica

### DoD Sprint 1

- [x] Un usuario puede registrarse y entrar al dashboard
- [x] Sin suscripción activa → ve la página de bloqueo
- [x] El super-admin puede activar/apagar módulos por tenant
- [x] Los emails se envían (a MailHog en dev)

---

## 🚧 Sprint 2 — Activos y documentación

**Meta:** El intermediario puede dar de alta su flota completa con propietarios, vehículos y conductores.

### Tickets

#### 2.1 — CRUD Propietarios
- [ ] `GET /owners`, `POST /owners`, `PUT /owners/:id`, `DELETE /owners/:id`
- [ ] Página `/owners` con tabla + drawer de creación
- [ ] Campos: nombre, documento, contacto, datos bancarios (banco/cuenta/titular)

#### 2.2 — CRUD Vehículos
- [ ] CRUD endpoints + UI
- [ ] Subida de fotos a MinIO via presigned URLs
- [ ] Campos: placa, tipo (4x4, sedan, bus, etc.), marca, modelo, año, color, chasis, motor, capacidad
- [ ] Campos legales: SOAT, RTM, póliza extracontractual con fechas de vencimiento
- [ ] Vinculación a propietario
- [ ] Estado visual: rojo (vencido), naranja (próximo 30d), verde (al día)

#### 2.3 — CRUD Conductores
- [ ] Endpoints + UI
- [ ] Campos: documento, licencia (categoría + vencimiento), EPS, ARL, pensión, examen médico
- [ ] Subida de foto y documentos a MinIO

#### 2.4 — OCR de placas (opcional)
- [ ] Tesseract.js en cliente — extrae texto de la foto subida
- [ ] Pre-rellena el campo "placa" con confianza visible

#### 2.5 — Calendario de vencimientos
- [ ] Página `/calendar` con vista mensual de todos los vencimientos del tenant

### DoD Sprint 2

- [ ] Tenant puede registrar 1 propietario, vincularle 1 vehículo y asignarle 1 conductor
- [ ] Las fotos se suben y se ven correctamente
- [ ] El dashboard muestra contadores reales (no 0)

---

## 🚧 Sprint 3 — Operación y contratos

**Meta:** El intermediario opera contratos y genera PDFs.

### Tickets

#### 3.1 — CRUD Empresas Cliente
- [ ] Endpoints + UI
- [ ] Campos: razón social, NIT, contacto, dirección

#### 3.2 — CRUD Contratos
- [ ] Endpoints + UI
- [ ] Tipos: indefinido o término fijo (con fecha de fin)
- [ ] Vinculación a cliente, vehículo, conductor
- [ ] Campo "rutas" como texto + opción futura para Leaflet

#### 3.3 — Generación de PDFs
- [ ] Plantilla de contrato con `pdfmake` o `react-pdf`
- [ ] Variables dinámicas: cliente, vehículo, conductor, vigencia, monto
- [ ] Almacenar en MinIO + retornar URL descargable
- [ ] Envío opcional por email al cliente

#### 3.4 — Módulo Prospectos
- [ ] Listado de vehículos no asignados a contrato + conductores libres
- [ ] Filtros por tipo, ciudad, disponibilidad

### DoD Sprint 3

- [ ] Generar un contrato PDF desde la UI
- [ ] El PDF se descarga correctamente y tiene los datos
- [ ] Lista de prospectos muestra solo recursos disponibles

---

## 🚧 Sprint 4 — Finanzas, mantenimiento y alertas

**Meta:** El sistema cobra a clientes, paga a propietarios (con deducciones) y avisa antes de cada vencimiento.

### Tickets

#### 4.1 — CRUD Mantenimientos
- [ ] Endpoints + UI
- [ ] Tipos: aceite, llantas, alineación, lavado motor, frenos, extintor, general
- [ ] Por fecha + por kilometraje (próximo en N km)
- [ ] Costo + comprobante (factura del taller)
- [ ] Flag `deductFromOwner` que aplica al próximo pago

#### 4.2 — Facturación cruzada
- [ ] Generador de cobros mensuales por contrato (a la empresa cliente)
- [ ] Cálculo del pago al propietario: cobros - deducciones (mantenimientos con flag) - comisión del intermediario
- [ ] Estados de cuenta exportables a PDF y Excel
- [ ] Conciliación: marcar facturas como pagadas

#### 4.3 — Motor de notificaciones avanzado
- [ ] Worker BullMQ dedicado (no más in-process)
- [ ] Reglas configurables por usuario: días de anticipación por tipo de vencimiento
- [ ] Templates de email con HTML profesional
- [ ] Centro de notificaciones in-app con badge de no leídas

#### 4.4 — Reportes
- [ ] Reporte de ingresos por mes
- [ ] Rentabilidad por vehículo
- [ ] Top propietarios por facturación
- [ ] Vencimientos próximos (30/60/90 días)
- [ ] Export a Excel y PDF

### DoD Sprint 4

- [ ] El sistema genera facturas mensuales automáticamente
- [ ] Las deducciones se aplican correctamente al pago del propietario
- [ ] Cuando un SOAT se acerca a su vencimiento, llega un email al admin

---

## 🔮 Sprint 5+ — Maduración y producción

- 2FA con TOTP
- Roles adicionales (propietario, conductor, cliente con sus propios accesos)
- Rate limiting + helmet
- Audit log completo en UI
- Tests Vitest (unit) + Playwright (e2e)
- CI/CD con GitHub Actions
- Sentry + PostHog
- Backups automatizados
- App móvil PWA con modo offline
- Integración WhatsApp Business (cuando haya budget) o continuar solo email
- Integración Wompi/Mercado Pago para pagos automáticos de suscripción
