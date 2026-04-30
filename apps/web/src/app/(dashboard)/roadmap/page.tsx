import {
  Globe, Cloud, Lock, ShieldCheck, Activity, Smartphone, FileSpreadsheet,
  MapPin, Bot, Languages, MessageCircle, Zap, Users, Database, Receipt,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Item = {
  icon: LucideIcon;
  title: string;
  desc: string;
  status: 'planned' | 'considering';
};

const SECTIONS: { title: string; subtitle: string; items: Item[] }[] = [
  {
    title: 'Producción',
    subtitle: 'Cuando estés listo para abrir Nexo al mundo',
    items: [
      { icon: Globe, title: 'Dominio propio', desc: 'Comprar dominio (~$10/año) y conectarlo a la app.', status: 'planned' },
      { icon: Cloud, title: 'Hosting gratuito', desc: 'Vercel + Railway + Neon + Cloudflare R2 — todos con tier free.', status: 'planned' },
      { icon: Activity, title: 'Monitoreo de errores', desc: 'Sentry (5K errores/mes gratis) + Posthog para analytics.', status: 'planned' },
    ],
  },
  {
    title: 'Seguridad',
    subtitle: 'Capa extra de protección a medida que crezca',
    items: [
      { icon: Lock, title: 'Doble factor (2FA)', desc: 'Código TOTP en una app autenticadora para super-admin.', status: 'planned' },
      { icon: ShieldCheck, title: 'Auditoría completa', desc: 'Vista de quién creó, modificó y eliminó cada cosa.', status: 'planned' },
      { icon: Zap, title: 'Rate limiting', desc: 'Limita intentos de login/registro para frenar bots.', status: 'planned' },
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
      { icon: MessageCircle, title: 'WhatsApp Business', desc: 'Notificaciones por WhatsApp además del correo.', status: 'considering' },
      { icon: Users, title: 'Roles propietario y conductor', desc: 'Que ellos vean sus pagos, vehículos y documentos.', status: 'considering' },
      { icon: Database, title: 'Backups automáticos', desc: 'Respaldos diarios de la base de datos.', status: 'planned' },
      { icon: Languages, title: 'Multi-idioma', desc: 'Inglés y portugués para expandirse a otros mercados.', status: 'considering' },
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Próximamente</h1>
        <p className="text-sm text-muted">Lo que estamos construyendo y considerando para Nexo.</p>
      </header>

      {SECTIONS.map((s) => (
        <section key={s.title}>
          <div className="mb-3">
            <h2 className="font-semibold">{s.title}</h2>
            <p className="text-xs text-muted">{s.subtitle}</p>
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
                        it.status === 'planned'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-slate-100 text-slate-600'
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

      <div className="card p-5 bg-primary/5 border-primary/20">
        <p className="text-sm">
          <strong>¿Te falta algo en esta lista?</strong> Tu feedback decide qué construimos primero. Escríbenos.
        </p>
      </div>
    </div>
  );
}
