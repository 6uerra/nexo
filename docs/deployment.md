# Despliegue — Nexo

Guía para desplegar a producción usando recursos gratuitos o muy baratos.

## Stack recomendado (todo free tier)

| Componente | Plataforma | Tier | Costo |
|---|---|---|---|
| Frontend (Next.js) | **Vercel** o **Cloudflare Pages** | Hobby | $0 |
| Backend (Fastify) | **Railway** o **Render** | Free | $0 ($5 crédito Railway) |
| Postgres | **Neon** | Free 0.5GB | $0 |
| Redis | **Upstash** | Free 10K cmds/día | $0 |
| Storage S3 | **Cloudflare R2** | 10GB | $0 |
| Email | **Gmail SMTP** + app password | 500/día | $0 |
| Errores | **Sentry** | 5K errores/mes | $0 |
| Analytics | **PostHog** | 1M eventos/mes | $0 |

## Pasos

### 1. Postgres en Neon

1. Crear cuenta en <https://neon.tech>
2. Crear proyecto "nexo"
3. Copiar `DATABASE_URL` (formato `postgresql://...`)

### 2. Redis en Upstash

1. Crear cuenta en <https://upstash.com>
2. Create Database → Region más cercana → Free
3. Copiar `REDIS_URL`

### 3. Storage en Cloudflare R2

1. Cuenta Cloudflare → R2 → Create bucket "nexo"
2. Manage R2 API Tokens → Create token con read+write a "nexo"
3. Variables:
   - `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`
   - `S3_ACCESS_KEY=<token-id>`
   - `S3_SECRET_KEY=<token-secret>`
   - `S3_REGION=auto`
   - `S3_BUCKET=nexo`
   - `S3_FORCE_PATH_STYLE=true`

### 4. Email con Gmail

1. Activar 2FA en tu cuenta Gmail
2. Generar app password: <https://myaccount.google.com/apppasswords>
3. Variables:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_SECURE=false`
   - `SMTP_USER=tu@gmail.com`
   - `SMTP_PASS=<app-password-16-chars>`
   - `SMTP_FROM="Nexo <tu@gmail.com>"`

### 5. Backend en Railway

1. <https://railway.app> → New Project → Deploy from GitHub
2. Selecciona el repo y la carpeta `apps/api`
3. Variables de entorno: copia todas las anteriores + `JWT_SECRET` (genera con `openssl rand -base64 64`)
4. Settings → Networking → Generate domain → te da `api-xxx.railway.app`

### 6. Frontend en Vercel

1. <https://vercel.com> → Import GitHub repo
2. Root directory: `apps/web`
3. Variables:
   - `NEXT_PUBLIC_API_URL=https://api-xxx.railway.app`
   - `API_URL=https://api-xxx.railway.app`
   - `SESSION_COOKIE_NAME=nexo_session`
4. Deploy

### 7. Migraciones en producción

Desde tu máquina con `DATABASE_URL` apuntando a Neon:

```bash
DATABASE_URL=postgresql://... pnpm db:migrate
DATABASE_URL=postgresql://... pnpm db:seed
```

> Ojo: el seed crea credenciales por defecto. **Cambia `SEED_SUPERADMIN_PASSWORD`** antes de correrlo en prod, o ejecuta solo el seed del super-admin manualmente.

### 8. CORS en producción

En `apps/api/src/main.ts` ya se usa `config.webUrl` como origin. Asegúrate de que `WEB_URL` apunte a tu dominio Vercel.

### 9. Cookies cross-domain

Si frontend y backend están en dominios distintos, cambia en `apps/api/src/auth/auth.routes.ts`:

```ts
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'none' as const,  // ← era 'lax'
  secure: true,                // ← OBLIGATORIO con sameSite=none
  path: '/',
  maxAge: 7 * 24 * 60 * 60,
};
```

### 10. Activar el cron

Variable: `ENABLE_CRON=true` en el backend.

## Healthcheck

`GET /health` → `{ ok: true, env, ts }`

Configura en Railway/Render el healthcheck a `/health` cada 30s.

## Backups

Neon hace **point-in-time recovery automático** en el plan free (7 días).
Para backups adicionales, agendar un job semanal con `pg_dump`.

## Monitoreo

- **Sentry**: agregar SDK en `apps/api/src/main.ts` y `apps/web/src/app/layout.tsx`
- **PostHog**: agregar `posthog-js` en frontend para analytics

## Checklist pre-producción

- [ ] `JWT_SECRET` cambiado (no usar el default)
- [ ] `SEED_SUPERADMIN_PASSWORD` cambiado o seed manual
- [ ] Cookies `secure: true` si HTTPS
- [ ] CORS `origin` apunta al dominio real (no `*`)
- [ ] Variables de SMTP configuradas y probadas
- [ ] R2 bucket creado y permisos correctos
- [ ] Migraciones aplicadas
- [ ] `ENABLE_CRON=true`
- [ ] DNS configurado y SSL activo
- [ ] Healthcheck respondiendo
- [ ] Sentry/PostHog configurados
