import Link from 'next/link';
import { Check, Sparkles, Brain } from 'lucide-react';

interface PlanRow {
  id: string;
  key: string;
  name: string;
  tagline: string | null;
  priceCop: number | null;
  priceLabel: string | null;
  showPrice: boolean;
  vehicleLimit: number | null;
  modules: string[];
  highlights: string[];
  highlighted: boolean;
  sortOrder: number;
  isActive: boolean;
}

async function loadPlans(): Promise<PlanRow[]> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  try {
    const r = await fetch(`${apiUrl}/api/v1/plans`, { cache: 'no-store' });
    if (!r.ok) return [];
    const data = await r.json();
    return data.plans as PlanRow[];
  } catch {
    return [];
  }
}

function formatPrice(p: PlanRow): string {
  if (!p.showPrice) return p.priceLabel ?? 'Consultar';
  if (p.priceCop === 0) return p.priceLabel ?? 'Gratis';
  if (p.priceCop !== null && p.priceCop !== undefined) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p.priceCop);
  }
  return p.priceLabel ?? 'Consultar';
}

export async function LandingPlans() {
  const plans = await loadPlans();
  if (plans.length === 0) return null;

  const enterprisePlan = plans.find((p) => p.key === 'enterprise');

  return (
    <section id="planes" className="py-20 bg-surface border-y border-border">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            Planes
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Empieza gratis. Crece a tu ritmo.</h2>
          <p className="mt-4 text-muted">El trial gratuito no requiere tarjeta. Los precios se ajustan a la cantidad de vehículos y módulos que uses.</p>
        </div>

        <div className={`mt-12 grid gap-6 ${plans.length === 4 ? 'lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {plans.map((p) => {
            const hasAi = p.key === 'enterprise' || p.highlights.some((h) => /\bIA\b/i.test(h));
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border bg-white p-6 flex flex-col ${
                  p.highlighted ? 'border-primary shadow-card scale-[1.02]' : 'border-border shadow-soft'
                }`}
              >
                {p.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    Más popular
                  </span>
                )}
                {hasAi && p.key === 'enterprise' && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                    <Brain className="h-3 w-3" /> Con IA
                  </span>
                )}
                <div>
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  {p.tagline && <p className="mt-1 text-sm text-muted">{p.tagline}</p>}
                  <p className="mt-4 text-2xl font-extrabold text-ink">
                    {formatPrice(p)}
                    {p.showPrice && p.priceCop && p.priceCop > 0 ? <span className="text-sm font-medium text-muted"> /mes</span> : null}
                  </p>
                  {p.vehicleLimit && (
                    <p className="mt-1 text-xs text-muted">Hasta {p.vehicleLimit} vehículos</p>
                  )}
                  {p.vehicleLimit === null && (
                    <p className="mt-1 text-xs text-muted">Vehículos ilimitados</p>
                  )}
                </div>
                <ul className="mt-6 space-y-2 flex-1">
                  {p.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {h.startsWith('(') ? (
                        <span className="text-xs italic text-muted ml-6">{h}</span>
                      ) : (
                        <>
                          <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-ink">{h}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {p.key === 'free_trial' ? (
                    <Link href="/register" className="btn-primary w-full text-sm">
                      Solicitar trial
                    </Link>
                  ) : p.key === 'enterprise' ? (
                    <Link href="/register" className="btn-outline w-full text-sm">
                      <Sparkles className="h-4 w-4" /> Cotizar
                    </Link>
                  ) : (
                    <Link href="/register" className="btn-outline w-full text-sm">
                      Solicitar acceso
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {enterprisePlan && (
          <div className="mx-auto max-w-3xl mt-12 rounded-xl bg-gradient-to-br from-purple-50 to-primary/5 border border-purple-200 p-5 text-sm text-ink">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-purple-100 p-2 text-purple-700 shrink-0">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold mb-1">Enterprise con Inteligencia Artificial</p>
                <p className="text-muted leading-relaxed">
                  Reportes con IA, informes automáticos con tendencias y análisis predictivo de gastos.
                  Incluye también integraciones a herramientas externas (WhatsApp Business, dominios, OCR avanzado, etc.) — el costo de esas integraciones se cobra adicional según uso real.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
