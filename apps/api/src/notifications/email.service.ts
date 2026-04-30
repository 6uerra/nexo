import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { getDb, emailLog } from '@nexo/db';
import { templates, type TemplateName } from './email-templates.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user && config.smtp.pass ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
  return transporter;
}

interface SendOptions {
  to: string;
  template: TemplateName;
  vars: any;
  tenantId?: string | null;
}

const baseVars = () => ({
  appName: 'Nexo',
  webUrl: config.webUrl,
  supportEmail: process.env.SUPPORT_EMAIL ?? 'admin@nexo.local',
});

/**
 * Manda un email de forma asíncrona y registra el resultado.
 * No bloquea la respuesta HTTP — el caller no necesita esperar.
 */
export function sendTemplatedEmail(opts: SendOptions): Promise<void> {
  return queueEmail(opts).catch((e) => console.error('Email send error', e));
}

async function queueEmail(opts: SendOptions): Promise<void> {
  const allVars = { ...baseVars(), ...opts.vars };
  const tplFn = (templates as any)[opts.template];
  if (!tplFn) throw new Error(`Template no encontrado: ${opts.template}`);
  const { subject, html } = tplFn(allVars);

  const db = getDb();
  const [logRow] = await db.insert(emailLog).values({
    tenantId: opts.tenantId ?? null,
    toEmail: opts.to,
    subject,
    template: opts.template,
    status: 'pending',
  }).returning();

  // Envío async sin bloquear
  setImmediate(async () => {
    try {
      const t = getTransporter();
      await t.sendMail({
        from: config.smtp.from,
        to: opts.to,
        subject,
        html,
        text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      });
      await db.update(emailLog).set({ status: 'sent', sentAt: new Date() })
        .where((await import('drizzle-orm')).eq(emailLog.id, logRow!.id));
    } catch (e: any) {
      console.error('Email failed', e);
      await db.update(emailLog).set({ status: 'failed', errorMessage: String(e?.message ?? e) })
        .where((await import('drizzle-orm')).eq(emailLog.id, logRow!.id));
    }
  });
}

// Compat: legacy usage
export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  const t = getTransporter();
  return t.sendMail({
    from: config.smtp.from,
    to,
    subject,
    html,
    text: text ?? html.replace(/<[^>]+>/g, ''),
  });
}
