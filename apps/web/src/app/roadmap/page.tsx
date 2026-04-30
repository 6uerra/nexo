import {
  Globe, Cloud, Lock, ShieldCheck, Activity, Smartphone, FileSpreadsheet,
  MapPin, Bot, Languages, MessageCircle, Zap, Users, Database, Receipt,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PublicShell } from '@/components/public-shell';

type Item = { icon: LucideIcon; title: string; desc: string; status: 'planned' | 'considering' };

const SECTIONS: { title: string; subtitle: string; items: Item[] }[] = [
  {
    title: 'Producción y operación',
    subtitle: 'Cuando estés listo para abrir Nexo a más clientes',
    items: [
      { icon: Globe, title: 'Dominio propio', desc: 'Conecta tu dominio para presentar Nexo con tu marca.', status: 'planned' },
      { icon: Cloud, title: 'Despliegue en la nube', desc: 'Vercel + Railway + Neon — todos con tier gratuito.', status: 'planned' },
      { icon: Activity, title: 'Monitoreo de errores', desc: 'Sentry y analytics gratuitos para detectar problemas.', status: 'planned' },
    ],
  },
  {
    title: 'Seguridad',
    subtitle: 'Capa extra de protección a medida que crezcas',
    items: [
      { icon: Lock, title: 'Doble factor (2FA)', desc: 'Código TOTP en una app autenticadora para super-admin.', status: 'planned' },
      { icon: ShieldCheck, title: 'Auditoría completa', desc: 'Vista de quién creó, modificó y eliminó cada cosa.', status: 'planned' },
      { icon: Zap, title: 'Rate limiting', desc: 'Limita intentos de login para frenar bots.', status: 'planned' },
    ],
  },
  {
    title: 'Productividad',
    subtitle: 'Funciones que harán todo más fluido',
    items: [
      { icon: Smartphone, title: 'App PWA instalable', desc: 'Que se vea como app nativa en el celular y funcione sin conexión.', status: 'planned' },
      { icon: FileSpreadsheet, title: 'Exportar a Excel y PDF', desc: 'Estados de cuenta, reportes y datos descargables.', status: 'planned' },
      { icon: MapPin, title: 'Mapas y rutas', desc: 'Ver dónde operan tus vehículos con OpenStreetMap (gratis).', status: 'planned' },
      { icon: Bot, title: 'OCR de placas', desc: 'Extraer texto de la foto de la matrícula automáticamente.', status: 'planned' },
      { icon: Receipt, title: 'Facturación electrónica DIAN', desc: 'Integración con Alegra/Siigo cuando sea obligatorio.', status: 'considering' },
    ],
  },
  {
    title: 'Crecimiento',
    subtitle: 'Cosas que evaluamos a futuro',
    items: [
      { icon: MessageCircle, title: 'WhatsApp Business', desc: 'Notificaciones por WhatsApp además del correo. (Requiere herramienta paga.)', status: 'considering' },
      { icon: Users, title: 'Roles propietario y conductor', desc: 'Que ellos vean sus pagos, vehículos y documentos.', status: 'considering' },
      { icon: Database, title: 'Backups automáticos', desc: 'Respaldos diarios de la base de datos.', status: 'planned' },
      { icon: Languages, title: 'Multi-idioma', desc: 'Inglés y portugués para expandirse a otros mercados.', status: 'considering' },
    ],
  },
];

export default function PublicRoadmapPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-5xl px-4 lg:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            Roadmap público
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Lo que viene en Nexo</h1>
          <p className="mt-3 text-muted">Construido al ritmo de las empresas que lo usan. Tu feedback decide qué hacemos primero.</p>
        </div>

        <div className="mt-12 space-y-10">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <div className="mb-4">
                <h2 className="text-lg font-bold">{s.title}</h2>
                <p className="text-sm text-muted">{s.subtitle}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {s.items.map((it) => (
                  <div key={it.title} className="card p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                        <it.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold leading-tight">{it.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            it.status === 'planned' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {it.status === 'planned' ? 'Planeado' : 'Evaluando'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted leading-snug">{it.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}

export const metadata = {
  title: 'Próximamente — Nexo',
  description: 'Lo que estamos construyendo y considerando para Nexo.',
};
