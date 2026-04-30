import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
// Cargar .env desde la raíz del monorepo y luego local (este último puede sobreescribir)
loadEnv({ path: resolve(process.cwd(), '../../.env') });
loadEnv();

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Falta variable de entorno: ${name}`);
  return v;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.API_PORT ?? 3001),
  webUrl: process.env.WEB_URL ?? 'http://localhost:3000',
  databaseUrl: required('DATABASE_URL', 'postgresql://nexo:nexo@localhost:5432/nexo'),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtSecret: required('JWT_SECRET', 'dev-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  cookieName: process.env.SESSION_COOKIE_NAME ?? 'nexo_session',
  smtp: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || undefined,
    pass: process.env.SMTP_PASS || undefined,
    from: process.env.SMTP_FROM ?? 'Nexo <noreply@nexo.local>',
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.S3_REGION ?? 'us-east-1',
    accessKey: process.env.S3_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY ?? 'minioadmin',
    bucket: process.env.S3_BUCKET ?? 'nexo',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
  },
} as const;
