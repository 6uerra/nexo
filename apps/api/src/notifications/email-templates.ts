interface BaseVars {
  appName: string;
  webUrl: string;
  supportEmail: string;
}

export function layout(content: string, vars: BaseVars): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${vars.appName}</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#1E293B;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.06);">
        <tr><td style="padding:24px 28px;border-bottom:1px solid #E2E8F0;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:10px;">
                <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#2563EB,#3B82F6);"></div>
              </td>
              <td>
                <span style="font-size:20px;font-weight:800;color:#1E293B;letter-spacing:-0.5px;">${vars.appName}</span>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:32px 28px;font-size:15px;line-height:1.65;">
          ${content}
        </td></tr>
        <tr><td style="padding:18px 28px;background:#F8FAFC;font-size:12px;color:#64748B;border-top:1px solid #E2E8F0;">
          ¿Problemas? Escríbenos a <a href="mailto:${vars.supportEmail}" style="color:#2563EB;text-decoration:none;">${vars.supportEmail}</a><br>
          Este correo fue enviado por ${vars.appName} desde ${vars.webUrl}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function btn(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td>
    <a href="${href}" style="display:inline-block;background:#2563EB;color:#FFFFFF;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">${label}</a>
  </td></tr></table>`;
}

interface WelcomeClientVars extends BaseVars {
  adminName: string;
  tenantName: string;
  activationUrl: string;
  trialDays: number;
  modulesCount: number;
}

export const templates = {
  welcomeClient(v: WelcomeClientVars) {
    const subject = `Bienvenido a ${v.appName} 🎉`;
    const html = layout(
      `<h1 style="margin:0 0 12px;font-size:22px;font-weight:800;">Hola ${v.adminName},</h1>
       <p>Tu cuenta de <strong>${v.tenantName}</strong> en ${v.appName} ya está creada.</p>
       <p>Tienes <strong>${v.trialDays} días gratis</strong> con <strong>${v.modulesCount} módulos activos</strong>. Sin tarjeta. Sin compromiso.</p>
       ${btn(v.activationUrl, 'Activar mi cuenta')}
       <p style="font-size:13px;color:#64748B;">El link expira en 48 horas. Si no fuiste tú, ignora este correo.</p>
       <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;">
       <p style="font-size:13px;color:#475569;">¿Qué viene? Mira lo que estamos construyendo en <a href="${v.webUrl}/roadmap" style="color:#2563EB;">${v.webUrl}/roadmap</a></p>`,
      v,
    );
    return { subject, html };
  },

  passwordReset(v: BaseVars & { name: string; resetUrl: string }) {
    const subject = `Restablece tu contraseña — ${v.appName}`;
    const html = layout(
      `<h1 style="margin:0 0 12px;font-size:22px;font-weight:800;">Hola ${v.name},</h1>
       <p>Recibimos una solicitud para restablecer tu contraseña.</p>
       ${btn(v.resetUrl, 'Crear nueva contraseña')}
       <p style="font-size:13px;color:#64748B;">El link expira en 1 hora. Si no fuiste tú, ignora este correo — tu contraseña actual sigue vigente.</p>`,
      v,
    );
    return { subject, html };
  },

  subscriptionExpiring(v: BaseVars & { name: string; daysLeft: number; expiresAt: string }) {
    const subject = `Tu suscripción vence en ${v.daysLeft} días`;
    const html = layout(
      `<h1 style="margin:0 0 12px;font-size:22px;font-weight:800;">Hola ${v.name},</h1>
       <p>Tu suscripción de ${v.appName} vence el <strong>${v.expiresAt}</strong>.</p>
       <p>Para evitar interrupciones, realiza el pago antes de la fecha de vencimiento.</p>
       ${btn(v.webUrl + '/settings/subscription', 'Ver opciones de pago')}`,
      v,
    );
    return { subject, html };
  },

  subscriptionBlocked(v: BaseVars & { name: string }) {
    const subject = `Acceso suspendido — ${v.appName}`;
    const html = layout(
      `<h1 style="margin:0 0 12px;font-size:22px;font-weight:800;">Hola ${v.name},</h1>
       <p>Por falta de pago durante más de 90 días, el acceso a tu cuenta quedó <strong>bloqueado</strong>.</p>
       <p>Realiza un pago para reactivarlo.</p>
       ${btn(v.webUrl + '/settings/subscription', 'Reactivar mi cuenta')}`,
      v,
    );
    return { subject, html };
  },

  paymentVerified(v: BaseVars & { name: string; amount: string; coversTo: string }) {
    const subject = `Pago verificado ✓ — ${v.appName}`;
    const html = layout(
      `<h1 style="margin:0 0 12px;font-size:22px;font-weight:800;">¡Gracias ${v.name}!</h1>
       <p>Verificamos tu pago de <strong>${v.amount}</strong>.</p>
       <p>Tu suscripción quedó cubierta hasta el <strong>${v.coversTo}</strong>.</p>
       ${btn(v.webUrl + '/dashboard', 'Ir al dashboard')}`,
      v,
    );
    return { subject, html };
  },

  paymentRejected(v: BaseVars & { name: string; reason: string }) {
    const subject = `Pago rechazado — ${v.appName}`;
    const html = layout(
      `<h1 style="margin:0 0 12px;font-size:22px;font-weight:800;">Hola ${v.name},</h1>
       <p>Lamentablemente no pudimos verificar tu pago.</p>
       <p><strong>Motivo:</strong> ${v.reason || 'No se proporcionó'}</p>
       <p>Por favor, registra el pago nuevamente con un comprobante claro.</p>
       ${btn(v.webUrl + '/settings/subscription', 'Volver a registrar')}`,
      v,
    );
    return { subject, html };
  },
};

export type TemplateName = keyof typeof templates;
