# Onboarding — Guía para nuevos tenants

Esta guía explica el flujo desde que un intermediario crea su cuenta hasta que tiene su flota operando.

## 1. Registro

1. Ir a **<http://localhost:3000/register>**
2. Completar:
   - Nombre del intermediario (ej. "Flotas del Norte")
   - Identificador URL (ej. `flotas-norte`) — se autogenera del nombre
   - Tu nombre y correo
   - Contraseña (mínimo 8 caracteres)
   - Aceptar Términos y Política de tratamiento de datos (Habeas Data)
3. Click en **Crear cuenta gratis**

> Al registrarte, se crea automáticamente:
> - Tu **tenant** (intermediario)
> - Tu usuario como **`tenant_admin`**
> - Una **suscripción en modo `trial`** por 30 días
> - Todos los **módulos activos**

## 2. Onboarding wizard

Después del registro entras a `/onboarding`. Pasos:

### Paso 1 — Datos de la empresa

Completa los datos legales:

- Razón social
- NIT
- Correo de contacto y teléfono
- Dirección y ciudad

> Estos datos aparecerán en los contratos PDF generados (Sprint 3).

### Paso 2 — Activación de módulos

Por defecto se activan todos. Puedes ajustar después en **Configuración → Módulos**.

### Paso 3 — Listo

Click en **Ir al dashboard**.

## 3. Primeros pasos en el dashboard

El dashboard muestra el flujo recomendado:

1. **Crear propietario** (`/owners`) — el dueño del vehículo con sus datos bancarios
2. **Registrar vehículo** (`/vehicles`) — placa, fotos, SOAT, RTM
3. **Sumar conductor** (`/drivers`) — licencia y seguridad social

> Estas funciones llegan en el **Sprint 2**.

## 4. Configurar módulos

Como `tenant_admin`, ve a **Configuración → Módulos** y desactiva los que no uses.
Los módulos desactivados desaparecen del menú.

## 5. Pagar la suscripción

Después de los 30 días de prueba:

1. Ve a **Configuración → Suscripción**
2. Verás los métodos de pago disponibles (QR, transferencia, Mercado Pago)
3. Realiza el pago
4. Registra el pago en la sección "Historial de pagos" (próximamente con upload de comprobante)
5. El **super-admin** verifica el pago y tu suscripción se extiende automáticamente

> Si no pagas en **90 días desde el vencimiento**, el acceso se bloquea totalmente.
> Solo puedes ver `/settings/subscription` para regularizar.

## 6. Roles del equipo

Como `tenant_admin` puedes invitar a tu equipo (Sprint 2):

| Rol | Permisos |
|---|---|
| `tenant_admin` | Todo dentro del tenant |
| `tenant_viewer` | Solo lectura — perfecto para auxiliares |

## Soporte

- **Bugs:** abre un issue en el repositorio
- **Preguntas:** correo al super-admin de la plataforma
