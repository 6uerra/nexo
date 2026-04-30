# Arquitectura — Nexo

Documento vivo con las decisiones técnicas (ADRs ligeros) y la justificación.

## Principios

1. **Todo gratis o self-hosted.** No dependemos de servicios pagos.
2. **Tipado end-to-end.** TypeScript + Zod + Drizzle desde la BD hasta el navegador.
3. **Multi-tenant desde día 1.** Cada query filtra por `tenant_id`.
4. **Mobile-first.** El móvil no es responsive del desktop, es el target principal.
5. **Bloqueo determinístico.** Si la suscripción vence, todas las rutas devuelven HTTP 402.

## Stack

### Frontend: Next.js 15 (App Router)

- **Por qué:** SSR para SEO de la landing, App Router para layouts compartidos, soporte React 19.
- **Estilos:** Tailwind v3 + clases utility + componentes compuestos en `globals.css` (`btn`, `card`, `input`).
- **Data fetching:** server components con `fetch` directo a la API; client components usan `lib/api.ts` con cookies.
- **No usamos:** Redux, React Query (innecesarios en Sprint 1; podemos agregar TanStack Query si crece).

### Backend: Fastify 5

- **Por qué:** ~3× más rápido que Express, ecosistema TypeScript first-class, plugins para cookie/cors/multipart out-of-the-box.
- **No NestJS:** demasiado decoradores, slower cold start, más boilerplate. Fastify + módulos por feature folder es suficiente.
- **Validación:** Zod en cada handler. El error handler global convierte `ZodError` a 400 con detalles.
- **Auth:** JWT en cookie `httpOnly` + header `Authorization: Bearer`. La cookie es la default; el header sirve para apps externas o SSR.

### Base de datos: PostgreSQL 16 + Drizzle ORM

- **Por qué Drizzle vs Prisma:** sintaxis SQL-like, sin runtime engine, builds 10× más livianos, perfecto para serverless.
- **Multi-tenant:** row-level con columna `tenant_id`. No usamos schema-per-tenant porque complica migraciones y backups.
- **Índices:** cada tabla con `tenantId` tiene un índice. Joins multi-tenant siempre pasan por el `tenantId`.

### Almacenamiento: MinIO (dev) / Cloudflare R2 (prod)

- **Por qué:** S3-compatible, free self-hosted (MinIO) o 10GB gratis (R2). El SDK `@aws-sdk/client-s3` funciona con ambos.
- **Convención de keys:** `{tenantId}/{entity}/{entityId}/{filename}` para aislamiento + búsqueda.
- **Versionado:** al renovar SOAT, no se sobrescribe — se sube como nueva versión y se mantiene el histórico.

### Cola/Jobs: BullMQ + Redis

- **Por qué:** estándar Node, persiste en Redis, soporta cron, retries y delayed jobs.
- **Sprint 1:** cron in-process en el API para vencimientos de suscripción. Suficiente para empezar.
- **Sprint 4:** worker dedicado para vencimientos de SOAT/RTM/mantenimientos.

### Email: Nodemailer

- **Dev:** MailHog en `localhost:1025`. UI en `:8025`.
- **Prod:** Gmail SMTP con app password (gratis hasta 500 envíos/día). Para escalar: Resend (3000/mes free) o Postmark.

## Decisiones (ADRs ligeros)

### ADR-001: Multi-tenant row-level (no schema-per-tenant)

**Decisión:** Cada tabla con datos de tenant tiene columna `tenant_id` (FK a `tenants`).
**Por qué:** Migraciones simples, backups simples, queries simples. El costo es disciplina al filtrar.
**Riesgo:** Si un query olvida `tenantId`, leak de datos. Mitigación: el guard `subscriptionGuard` exige `req.session.tenantId` y los repositorios deben recibirlo explícitamente.

### ADR-002: JWT en cookie httpOnly (no localStorage)

**Decisión:** Token JWT en cookie `httpOnly`, `sameSite=lax`. Sin refresh tokens en Sprint 1.
**Por qué:** Inmune a XSS. Para Sprint 1 con sesiones de 7 días, refresh tokens son overkill.
**Trade-off:** No funciona cross-domain sin CORS configurado (lo está). Si sale app nativa, agregamos refresh tokens.

### ADR-003: Bloqueo total al vencer (no read-only)

**Decisión:** A los 90 días sin pago, todas las rutas devuelven HTTP 402.
**Por qué:** El usuario lo pidió explícitamente. Simple y predecible.
**Excepciones:** `/settings/subscription` permite ver métodos de pago. Login funciona; el dashboard no.

### ADR-004: Sin gateway de pago

**Decisión:** Pagos manuales con QR o transferencia. El super-admin verifica.
**Por qué:** Cero costos. Suficiente para empezar.
**Migración futura:** Cuando haya tracción, integrar Wompi o Mercado Pago Checkout para pagos automáticos.

### ADR-005: Cron in-process (no worker separado)

**Decisión:** `setInterval` dentro del API para vencimientos de suscripción.
**Por qué:** Sprint 1 con un solo tenant en producción, no necesitamos worker separado.
**Migración futura:** Sprint 4 con muchos vencimientos → worker BullMQ dedicado en otro proceso.

### ADR-006: Drizzle ORM (no Prisma)

**Decisión:** Drizzle.
**Por qué:** No requiere generación de cliente, queries más cercanas a SQL, menor footprint, menor cold-start en serverless.

### ADR-007: Tailwind v3 (no v4)

**Decisión:** Tailwind v3 con `tailwind.config.ts`.
**Por qué:** v4 todavía está estabilizándose con Next.js 15. v3 es battle-tested. Migrar a v4 es trivial cuando esté listo.

## Modelo de datos (resumen)

```
tenants ──┬─< users (role: super_admin | tenant_admin | tenant_viewer)
          ├─< subscriptions ──< subscription_payments
          ├─< tenant_modules (feature flags por tenant)
          ├─< notifications
          ├─< owners ──< vehicles ──< maintenances
          │                     └─< invoices (owner_payout)
          ├─< drivers
          ├─< clients ──< contracts ──< invoices (client_charge)
          └─< audit_log

platform_payment_methods (global, gestionado por super-admin)
```

## Performance

- **API:** Fastify + Postgres con pool de 10 conexiones. ~5K req/s por instancia en hardware modesto.
- **DB:** índices en cada `tenant_id`, en `users.email`, en `vehicles.plate`, en `notifications.user_id + read_at`.
- **Frontend:** Next.js con SSR + ISR para landing. App Router con streaming.

## Observabilidad (Sprint 5)

- **Logs:** Pino con pino-pretty en dev, JSON en prod.
- **Errors:** Sentry (5K errores/mes free).
- **Métricas:** PostHog (free) para uso de features.
- **Health:** `GET /health` + readiness probe.
