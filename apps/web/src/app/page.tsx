import Link from 'next/link';
import { Logo } from '@/components/logo';
import {
  Truck, ShieldCheck, Bell, FileSignature, Wrench, Receipt, ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const FEATURES = [
  { icon: Truck, title: 'Gestión de vehículos', desc: 'Clasifica vehículos, sube documentos y controla SOAT, RTM y vencimientos en un calendario unificado.' },
  { icon: ShieldCheck, title: 'Propietarios y conductores', desc: 'Centraliza datos legales, seguridad social y licencias. Vincula conductores con vehículos al instante.' },
  { icon: FileSignature, title: 'Contratos y prospectos', desc: 'Genera contratos PDF en segundos. Lista vehículos disponibles para nuevas oportunidades.' },
  { icon: Wrench, title: 'Mantenimientos', desc: 'Registra fechas y kilometraje. Las deducciones se aplican automáticamente al pago del propietario.' },
  { icon: Receipt, title: 'Facturación cruzada', desc: 'Cobros a clientes y pagos a propietarios con deducciones automáticas. Reportes exportables.' },
  { icon: Bell, title: 'Alertas inteligentes', desc: 'Notificaciones por email e in-app antes de cada vencimiento. Tú decides los días de anticipación.' },
];

const BENEFITS = [
  'Multi-tenant: gestiona varios intermediarios desde una sola plataforma',
  'Diseñado mobile-first para usar desde cualquier celular',
  'Habeas Data y políticas de tratamiento conformes a la ley 1581/2012',
  'Stack moderno: Next.js, NestJS, PostgreSQL — open source y self-hosted',
  'Sin cargos por vehículo: paga una suscripción mensual fija',
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
            <a href="#features" className="hover:text-ink transition-colors">Funciones</a>
            <a href="#benefits" className="hover:text-ink transition-colors">Beneficios</a>
            <a href="#pricing" className="hover:text-ink transition-colors">Precios</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost text-sm">Ingresar</Link>
            <Link href="/register" className="btn-primary text-sm">Empezar gratis</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 lg:px-6 pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Nuevo · 30 días de prueba sin tarjeta
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Conecta tu flota. <br />
                <span className="text-primary">Simplifica</span> el negocio.
              </h1>
              <p className="mt-5 text-lg text-muted leading-relaxed max-w-xl">
                Nexo es la plataforma para administradores intermediarios de flotas:
                centraliza vehículos, propietarios, conductores y contratos.
                Factura, paga y notifica vencimientos sin esfuerzo.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="btn-accent text-base px-6 py-3">
                  Empezar gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="btn-outline text-base px-6 py-3">
                  Ya tengo cuenta
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted">
                Sin tarjeta · 30 días gratis · Cancela cuando quieras
              </p>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-8 -z-10 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 blur-2xl" />
              <div className="card p-6 shadow-card">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <Logo withText={false} />
                  <div>
                    <p className="text-sm font-semibold">Dashboard</p>
                    <p className="text-xs text-muted">Vista general</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Vehículos', value: '24' },
                    { label: 'Conductores', value: '31' },
                    { label: 'Activos', value: '18' },
                    { label: 'Por vencer', value: '3', alert: true },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted">{s.label}</p>
                      <p className={`mt-1 text-2xl font-bold ${s.alert ? 'text-accent' : 'text-ink'}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    { plate: 'ABC-123', status: 'Al día', color: 'bg-emerald-500' },
                    { plate: 'XYZ-789', status: 'SOAT por vencer', color: 'bg-amber-500' },
                    { plate: 'DEF-456', status: 'Vencido', color: 'bg-red-500' },
                  ].map((v) => (
                    <div key={v.plate} className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5">
                      <span className="text-sm font-semibold tabular-nums">{v.plate}</span>
                      <span className="flex items-center gap-2 text-xs text-muted">
                        <span className={`h-2 w-2 rounded-full ${v.color}`} />
                        {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-surface py-20 border-y border-border">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Todo lo que tu operación necesita</h2>
            <p className="mt-4 text-muted">Desde el primer vehículo hasta la facturación mensual, todo en un solo lugar.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6 hover:shadow-card transition-shadow duration-200">
                <div className="inline-flex items-center justify-center rounded-lg bg-primary/10 p-2.5 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20">
        <div className="mx-auto max-w-4xl px-4 lg:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-center">Construido para intermediarios serios</h2>
          <ul className="mt-10 space-y-3 max-w-2xl mx-auto">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 rounded-lg bg-surface border border-border p-4">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-ink">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="bg-primary py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 lg:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Empieza hoy. Tu flota lo agradecerá.</h2>
          <p className="mt-4 text-primary-100/90">30 días gratis. Sin tarjeta. Cancela cuando quieras.</p>
          <div className="mt-8 flex justify-center">
            <Link href="/register" className="btn-accent text-base px-8 py-3.5">
              Crear cuenta gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 lg:px-6">
          <Logo />
          <p className="text-xs text-muted">© {new Date().getFullYear()} Nexo · Hecho en Colombia</p>
        </div>
      </footer>
    </main>
  );
}
