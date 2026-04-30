import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { config } from './config.js';
import { registerRoutes } from './routes/index.js';
import { errorHandler } from './common/error-handler.js';
import { startNotificationsCron } from './jobs/notifications.cron.js';

async function bootstrap() {
  const app = Fastify({
    logger: {
      transport: config.env === 'development' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
    },
  });

  await app.register(cors, {
    // En dev permitimos cualquier origen de LAN (192.168.x.x / 10.x.x.x / localhost)
    // para acceso desde móviles en la misma red. En prod usar config.webUrl explícito.
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (config.env !== 'production') {
        if (
          origin === config.webUrl ||
          /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin)
        ) {
          return cb(null, true);
        }
      }
      if (origin === config.webUrl) return cb(null, true);
      return cb(new Error('CORS: origen no permitido'), false);
    },
    credentials: true,
  });
  await app.register(cookie);

  app.setErrorHandler(errorHandler);

  app.get('/health', async () => ({ ok: true, env: config.env, ts: new Date().toISOString() }));

  await registerRoutes(app);

  // Iniciar cron de notificaciones (sólo en producción o si flag)
  if (process.env.ENABLE_CRON === 'true' || config.env === 'production') {
    startNotificationsCron();
  }

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(`🚀 Nexo API escuchando en http://localhost:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
