import type { FastifyInstance } from 'fastify';
import { registerAuthRoutes } from '../auth/auth.routes.js';
import { registerTenantRoutes } from '../tenants/tenants.routes.js';
import { registerModuleRoutes } from '../modules-toggle/modules.routes.js';
import { registerSubscriptionRoutes } from '../subscriptions/subscriptions.routes.js';
import { registerNotificationRoutes } from '../notifications/notifications.routes.js';
import { registerDashboardRoutes } from '../dashboard/dashboard.routes.js';
import { registerMediaRoutes } from '../media/media.routes.js';
import { registerAdminPaymentMethodRoutes } from '../admin/payment-methods.routes.js';
import { registerAdminClientsRoutes } from '../admin/clients.routes.js';
import { registerAdminEmailsRoutes } from '../admin/emails.routes.js';
import { registerPlansRoutes } from '../admin/plans.routes.js';
import { registerViewRoutes } from '../views/views.routes.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(
    async (api) => {
      await registerAuthRoutes(api);
      await registerTenantRoutes(api);
      await registerModuleRoutes(api);
      await registerSubscriptionRoutes(api);
      await registerNotificationRoutes(api);
      await registerDashboardRoutes(api);
      await registerMediaRoutes(api);
      await registerAdminPaymentMethodRoutes(api);
      await registerAdminClientsRoutes(api);
      await registerAdminEmailsRoutes(api);
      await registerPlansRoutes(api);
      await registerViewRoutes(api);
    },
    { prefix: '/api/v1' },
  );
}
