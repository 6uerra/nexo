# Seguridad — Nexo

## Principios

1. **Defense in depth.** Múltiples capas: autenticación → tenant guard → subscription guard → validación Zod.
2. **Least privilege.** El rol `tenant_viewer` no puede modificar nada. El `super_admin` solo se usa para gestión de plataforma, no para operación diaria.
3. **Audit trail.** Todas las acciones críticas se registran en `audit_log`.

## Threat model (STRIDE)

| Amenaza | Vector | Mitigación |
|---|---|---|
| **Spoofing** (suplantación de usuario) | Token JWT robado | Cookie `httpOnly` + `sameSite=lax` + HTTPS obligatorio en prod |
| **Tampering** (alteración de datos) | Modificar requests para acceder a otro tenant | Filtro por `tenant_id` en cada query, guard que lo exige |
| **Repudiation** (negar acciones) | Usuario afirma que no hizo X | Tabla `audit_log` con userId + IP + diff |
| **Information disclosure** | SQL injection, XSS, leak de tenants | Drizzle (parametrized queries), React (escape automático), validación Zod |
| **Denial of service** | Flood de requests | Rate limiting (TODO Sprint 5: Fastify-rate-limit) |
| **Elevation of privilege** | Tenant_viewer haciendo POST | `requireRole('tenant_admin', 'super_admin')` en endpoints de escritura |

## Controles implementados (Sprint 1)

- ✅ Hash de contraseñas con **bcrypt** cost 10
- ✅ JWT con secret rotable via `JWT_SECRET`
- ✅ Cookie `httpOnly`, `sameSite=lax`, `secure` en prod
- ✅ Validación Zod en **todos** los endpoints
- ✅ Filtro `tenantId` en cada query (responsabilidad del repo)
- ✅ Guards: `authMiddleware`, `subscriptionGuard`, `requireRole`
- ✅ Headers de seguridad básicos vía Fastify (TODO: añadir helmet)

## Pendientes (Sprint 2-5)

- [ ] Rate limiting (login, register: 5/min por IP)
- [ ] Helmet para headers HSTS, CSP, X-Frame-Options
- [ ] CSRF token en mutaciones (cookie httpOnly + token de header)
- [ ] 2FA (TOTP con app authenticator)
- [ ] Rotación de secretos (JWT_SECRET versionado)
- [ ] Auditoría completa: quién creó, modificó, eliminó cada entidad
- [ ] Pen-test antes de producción
- [ ] Vault/encriptación en reposo de campos sensibles (cédula, EPS)

## Compliance: Habeas Data (Ley 1581/2012 Colombia)

### Política de tratamiento

Cada tenant que se registra **acepta explícitamente** la política de tratamiento de datos personales como parte del registro (checkbox obligatorio).

### Datos sensibles que tratamos

- Datos personales de propietarios y conductores (cédula, EPS, ARL, pensión, exámenes médicos, licencia, fotos)
- Datos financieros: cuentas bancarias para pagos
- Datos de contacto (correo, teléfono, dirección)

### Derechos del titular

- **Acceso:** ver qué datos guardamos sobre él
- **Rectificación:** corregir datos
- **Cancelación:** solicitar eliminación
- **Oposición:** oponerse al tratamiento

> Sprint 5: implementar export GDPR-style por usuario y endpoint de "right to be forgotten".

### Tiempo de retención

- Datos activos: mientras el contrato esté vigente + 5 años (requisito tributario)
- Documentos legales (SOAT, RTM): histórico permanente para trazabilidad
- Backups: 90 días

## Reporte de vulnerabilidades

Si descubres una vulnerabilidad, **NO la publiques en issues**. Envía un correo a `security@nexo.local` (o el correo del super-admin) con:

- Descripción del problema
- Pasos para reproducir
- Impacto potencial
- (Opcional) Sugerencia de mitigación

Te responderé en menos de 48 horas.
