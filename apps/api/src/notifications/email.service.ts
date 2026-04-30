import nodemailer from 'nodemailer';
import { config } from '../config.js';

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
