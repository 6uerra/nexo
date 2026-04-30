# Nexo

> **Conecta tu flota. Simplifica el negocio.**

**Nexo** es una plataforma SaaS multi-tenant para administradores intermediarios de flotas de vehículos. Centraliza vehículos, propietarios, conductores, contratos y facturación cruzada en un solo lugar — diseñada mobile-first para usar desde cualquier celular.

[![Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20Fastify%20%7C%20PostgreSQL-2563EB)]()
[![Self-hosted](https://img.shields.io/badge/self--hosted-100%25%20free-16A34A)]()
[![Made in](https://img.shields.io/badge/made%20in-Colombia-F97316)]()

---

## Tabla de contenidos

- [¿Qué es Nexo?](#qué-es-nexo)
- [Quick start (5 minutos)](#quick-start-5-minutos)
- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del monorepo](#estructura-del-monorepo)
- [Roles y permisos](#roles-y-permisos)
- [Suscripciones y bloqueo](#suscripciones-y-bloqueo)
- [Módulos](#módulos)
- [Onboarding](#onboarding)
- [Roadmap por sprints](#roadmap-por-sprints)
- [Variables de entorno](#variables-de-entorno)
- [Comandos útiles](#comandos-útiles)
- [Despliegue](#despliegue)
- [Seguridad y compliance](#seguridad-y-compliance)
- [Documentación adicional](#documentación-adicional)

---

## ¿Qué es Nexo?

El **administrador intermediario** de flotas vive en el medio de tres partes:

```
        ┌────────────┐         ┌────────────┐         ┌────────────┐
        │  Empresas  │  paga   │  Nexo      │  paga   │ Propietario│
        │  cliente   │ ──────▶ │ (interme-  │ ──────▶ │ del        │
        │            │         │  diario)   │         │ vehículo   │
        └────────────┘         └────────────┘         └────────────┘
                                     │
                                     ▼
                              ┌────────────┐
                              │ Conductor  │
                              └────────────┘
```

Nexo automatiza ese flujo: cobra a la empresa cliente, descuenta los gastos (mantenimientos, multas, deducciones) y le paga al propietario el neto, todo con trazabilidad completa.

### Funciones clave

- 🚗 **Vehículos** — clasificación, fotos, SOAT, RTM, vencimientos en calendario
- 👥 **Conductores** — licencia, EPS, ARL, exámenes médicos, dotación
- 🛡️ **Propietarios** — registro y vinculación a vehículos + datos bancarios
- 🏢 **Empresas cliente** — contratos, rutas, condiciones
- 📄 **Contratos PDF** — generación automática (indefinido o término fijo)
- 🔧 **Mantenimientos** — por fecha y kilometraje, con deducción automática
- 💰 **Facturación cruzada** — cobros y pagos con conciliación
- 🔔 **Alertas** — email + in-app, configurables por días de anticipación
- 📷 **Captura desde cámara** — fotos de vehículos/facturas desde web o celular, videos para vehículos
- 🔐 **Multi-tenant** — un super-admin gestiona varios intermediarios
- 🎚️ **Feature flags** — el super-admin habilita/apaga módulos por tenant
- 📵 **Bloqueo total** por suscripción vencida (3 meses sin pago)

---

## Quick start (5 minutos)

### Requisitos

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (`npm install -g pnpm`)
- **Docker** + Docker Compose
- **Git**

### 1. Clona e instala

```bash
git clone <url-del-repo> nexo
cd nexo
cp .env.example .env
pnpm install
```

### 2. Levanta la infraestructura local

```bash
pnpm infra:up
```

Esto inicia en Docker:

| Servicio | Puerto | Para qué |
|---|---|---|
| PostgreSQL 16 | 5432 | Base de datos principal |
| Redis 7 | 6379 | Cache y colas de jobs |
| MinIO | 9000 / 9001 | Almacenamiento S3-compatible (consola en `:9001`, user/pass `minioadmin`) |
| MailHog | 1025 / 8025 | SMTP de desarrollo (UI en `:8025`) |

### 3. Migra la BD y crea datos demo

```bash
pnpm db:generate   # genera migraciones desde el schema
pnpm db:migrate    # aplica migraciones
pnpm db:seed       # crea super-admin + tenant demo
```

### 4. Arranca todo

```bash
pnpm dev
```

Esto levanta en paralelo:

- **Web (Next.js)** → <http://localhost:3000>
- **API (Fastify)** → <http://localhost:3001>

### 5. Inicia sesión

| Rol | Email | Contraseña |
|---|---|---|
| Super Admin | `admin@nexo.local` | `NexoAdmin2026!` |
| Tenant Admin (demo) | `admin@demo.local` | `Demo2026!` |
| Tenant Viewer (demo) | `viewer@demo.local` | `Viewer2026!` |

> ⚠️ Cambia estas credenciales en `.env` antes de cualquier despliegue.

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                        NAVEGADOR / MÓVIL                     │
└─────────────────────┬────────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌──────────────────────────────────────────────────────────────┐
│   Next.js 15 (apps/web)                                      │
│   - SSR + App Router                                         │
│   - Tailwind v3 + shadcn-style                               │
│   - Layout dashboard responsive (sidebar + bottom nav)       │
└─────────────────────┬────────────────────────────────────────┘
                      │ /api/v1/* (rewrite proxy)
                      ▼
┌──────────────────────────────────────────────────────────────┐
│   Fastify API (apps/api)                                     │
│   - JWT en cookie httpOnly                                   │
│   - Tenant middleware (multi-tenant row-level)               │
│   - Subscription guard (bloqueo total por impago)            │
│   - Cron in-process para vencimientos                        │
└──┬─────────────┬──────────────┬───────────────┬──────────────┘
   ▼             ▼              ▼               ▼
┌────────┐  ┌────────┐    ┌──────────┐    ┌──────────┐
│Postgres│  │ Redis  │    │  MinIO   │    │  SMTP    │
│ +      │  │ + Bull │    │ (S3 API) │    │ (Gmail/  │
│Drizzle │  │  MQ    │    │          │    │  MailHog)│
└────────┘  └────────┘    └──────────┘    └──────────┘
```

### Multi-tenant

Cada registro lleva un `tenant_id`. Todos los queries filtran por `tenantId` en el guard.
El super-admin puede saltarse este filtro (rol `super_admin`).

### Bloqueo por suscripción

Cada `tenant` tiene una `subscription` con tres fechas clave:

- `currentPeriodEnd` → fin del periodo actual
- `blockAt` = `currentPeriodEnd + 90 días` → punto de bloqueo total
- Si `now > blockAt` → status pasa a `blocked` y el guard rechaza todas las requests con HTTP 402

Estados: `trial` → `active` → `past_due` → `blocked` → (`cancelled`)

---

## Stack tecnológico

| Capa | Herramienta | Por qué |
|---|---|---|
| **Frontend** | Next.js 15 + Tailwind v3 + Lucide | App Router, SSR, mobile-first |
| **Backend** | Fastify + Zod | Performance, tipos, validación |
| **DB** | PostgreSQL 16 + Drizzle ORM | Tipado end-to-end, migraciones limpias |
| **Auth** | JWT + bcrypt + cookies httpOnly | Simple, seguro, sin dependencias externas |
| **Almacenamiento** | MinIO (dev) / Cloudflare R2 (prod) | S3-compatible, gratis self-hosted |
| **Cola/Jobs** | BullMQ + Redis | Cron, vencimientos, emails async |
| **Email** | Nodemailer (Gmail SMTP / MailHog) | Sin servicios pagos |
| **OCR** | Tesseract.js (planeado Sprint 2) | Local, sin API keys |
| **PDFs** | pdfmake / react-pdf (planeado Sprint 3) | Sin dependencias pagas |
| **Mapas** | Leaflet + OpenStreetMap (planeado Sprint 3) | Gratis, sin API keys |
| **Tests** | Vitest + Playwright | Más rápido que Jest+Cypress |
| **Monorepo** | Turborepo + pnpm workspaces | Builds incrementales |

> **Filosofía:** todo gratis o self-hosted. Nada con tarjeta de crédito, ni APIs pagas.

---

## Estructura del monorepo

```
nexo/
├── apps/
│   ├── web/              Next.js (frontend)
│   └── api/              Fastify (backend)
├── packages/
│   ├── db/               Schemas Drizzle + migraciones + seed
│   └── shared/           Tipos, validaciones Zod, constantes
├── docker/
│   └── postgres/init.sql Inicialización de extensiones
├── docs/
│   ├── onboarding.md     Guía paso a paso para nuevos tenants
│   └── deployment.md     Guía de despliegue producción
├── scripts/
│   └── setup.sh          Setup automatizado
├── docker-compose.yml    Infra local (Postgres, Redis, MinIO, MailHog)
├── turbo.json            Pipeline de builds
├── pnpm-workspace.yaml
├── package.json
├── ARCHITECTURE.md       Decisiones técnicas (ADRs)
├── SECURITY.md           Threat model + Habeas Data
└── SPRINTS.md            Roadmap detallado por sprint
```

---

## Roles y permisos

| Rol | Alcance | Puede |
|---|---|---|
| `super_admin` | **Plataforma** (tu cuenta) | Crear tenants, ver todos, habilitar/apagar módulos por tenant, verificar pagos de suscripción |
| `tenant_admin` | Su tenant | Todo dentro de su tenant: crear, editar, borrar, configurar |
| `tenant_viewer` | Su tenant | Solo lectura |

> Más roles en sprints futuros: `propietario` (ve sus vehículos), `conductor` (ve sus documentos), `cliente` (ve sus contratos).

---

## Suscripciones y bloqueo

```
Día 0          Día 30          Día 90          Día 120 (vencimiento + 90)
  │              │                │                  │
  │   trial    │ active │  past_due  │     blocked    │
  ▼              ▼                ▼                  ▼
Tenant nuevo  Vence prueba    Aviso al admin    Acceso 100% bloqueado
```

- Trial inicial: **30 días** sin tarjeta
- Periodo de gracia: **90 días** después del vencimiento
- Notificaciones automáticas por email + in-app cuando faltan **15 días**
- Bloqueo total al pasar `blockAt`: HTTP 402 en todas las rutas

### Cómo se paga

Modo manual (sin gateway):

1. El tenant ve los métodos de pago en `/settings/subscription`
2. Paga via QR, transferencia bancaria o link de Mercado Pago
3. Sube el comprobante (URL/imagen)
4. El **super-admin verifica** el pago y la suscripción se extiende automáticamente

> Los datos de pago (QR, cuenta bancaria, link MP) los configura el super-admin en la tabla `platform_payment_methods`.

---

## Módulos

El super-admin puede activar/desactivar estos módulos por tenant:

| Key | Módulo | Sprint |
|---|---|---|
| `vehicles` | Vehículos | 2 |
| `drivers` | Conductores | 2 |
| `owners` | Propietarios | 2 |
| `clients` | Empresas Clientes | 3 |
| `contracts` | Contratos PDF | 3 |
| `prospects` | Prospectos | 3 |
| `maintenance` | Mantenimientos | 4 |
| `billing` | Facturación cruzada | 4 |
| `notifications` | Alertas automáticas | 1 ✓ |
| `reports` | Reportes y exportables | 4 |

Los módulos desactivados no aparecen en el menú ni en el dashboard.

---

## Onboarding

Al registrarse, un nuevo tenant pasa por un wizard de 3 pasos:

1. **Datos de la empresa** — razón social, NIT, contacto
2. **Activación de módulos** — confirma o ajusta los módulos por defecto
3. **Listo** — redirige al dashboard

El super-admin puede crear tenants directamente sin pasar por el wizard público.

---

## Roadmap por sprints

Ver detalle completo en [`SPRINTS.md`](./SPRINTS.md).

### ✅ Sprint 1 — Núcleo (este release)

- Setup monorepo, Docker, Postgres, Redis, MinIO, MailHog
- Schema multi-tenant: `tenants`, `users`, `subscriptions`, `tenant_modules`
- Auth con JWT en cookie httpOnly, registro, login, logout
- Middleware de tenant + guard de suscripción (bloqueo total)
- Frontend: landing, login, register, onboarding wizard, dashboard, settings de módulos, página de bloqueo, panel super-admin
- Sistema de notificaciones (email + in-app + cron de vencimientos)

### 🚧 Sprint 2 — Activos

CRUD completos de vehículos, conductores, propietarios. Carga de fotos a MinIO. OCR local de placas (Tesseract.js).

### 🚧 Sprint 3 — Operación y contratos

Empresas cliente, generación de contratos PDF, módulo de prospectos, integración con Leaflet para rutas.

### 🚧 Sprint 4 — Finanzas y alertas

Mantenimientos por fecha y kilometraje, facturación cruzada con deducciones, motor avanzado de notificaciones, reportes exportables (Excel/PDF).

---

## Variables de entorno

Ver [`.env.example`](./.env.example) para la lista completa.

**Imprescindibles** para que arranque:

```bash
DATABASE_URL=postgresql://nexo:nexo@localhost:5432/nexo
REDIS_URL=redis://localhost:6379
JWT_SECRET=cambia-esto-en-produccion
SMTP_HOST=localhost
SMTP_PORT=1025
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

**Producción** — cambia:

- `JWT_SECRET` → cadena aleatoria larga (`openssl rand -base64 64`)
- `SMTP_*` → Gmail con app password ([guía](https://support.google.com/mail/answer/185833))
- `S3_*` → Cloudflare R2 (10GB free) o AWS S3
- `DATABASE_URL` → Neon, Supabase o Postgres dedicado

---

## Comandos útiles

```bash
# Desarrollo
pnpm dev              # Levanta web + api en paralelo
pnpm infra:up         # Postgres, Redis, MinIO, MailHog
pnpm infra:down       # Apaga la infra
pnpm infra:logs       # Logs en vivo

# Base de datos
pnpm db:generate      # Genera migraciones desde el schema
pnpm db:migrate       # Aplica migraciones
pnpm db:seed          # Crea super-admin + tenant demo
pnpm db:studio        # UI web para explorar la BD (puerto 4983)

# Build & checks
pnpm build            # Build de producción
pnpm typecheck        # TypeScript en todo el monorepo
pnpm lint             # ESLint
```

---

## Despliegue

Ver [`docs/deployment.md`](./docs/deployment.md).

Recomendaciones gratuitas para empezar:

| Componente | Plataforma | Tier free |
|---|---|---|
| Frontend (Next.js) | Vercel / Cloudflare Pages | ✅ |
| Backend (Fastify) | Railway / Render / Fly.io | $5 crédito mensual |
| Postgres | Neon / Supabase | 0.5GB / 500MB |
| Redis | Upstash | 10K commands/día |
| Storage | Cloudflare R2 | 10GB |
| Email | Gmail SMTP (con app password) | 500/día |
| Monitoreo | Sentry | 5K errores/mes |

---

## Seguridad y compliance

Ver [`SECURITY.md`](./SECURITY.md) para el threat model completo.

- ✅ Contraseñas con bcrypt (cost 10)
- ✅ JWT en cookie `httpOnly`, `sameSite=lax`
- ✅ Validación de input con Zod en cada endpoint
- ✅ Aislamiento por `tenant_id` en cada query
- ✅ Política de tratamiento de datos (Habeas Data, ley 1581/2012)
- ✅ Audit log de acciones críticas
- 🚧 2FA (Sprint 5)
- 🚧 Backups automáticos (depende del proveedor de Postgres)

---

## Documentación adicional

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — decisiones técnicas y ADRs
- [`SECURITY.md`](./SECURITY.md) — threat model + Habeas Data
- [`SPRINTS.md`](./SPRINTS.md) — roadmap detallado
- [`docs/onboarding.md`](./docs/onboarding.md) — guía para nuevos tenants
- [`docs/deployment.md`](./docs/deployment.md) — despliegue producción

---

## Licencia

Propietario. Todos los derechos reservados.

---

**Hecho con ❤️ en Colombia.** Si encuentras un bug o tienes una idea, abre un issue.
