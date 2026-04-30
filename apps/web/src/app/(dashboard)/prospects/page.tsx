import { Sparkles } from 'lucide-react';
import { PendingFeatureBanner } from '@/components/pending-feature-banner';

export default function ProspectsPage() {
  return (
    <div className="max-w-4xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Prospectos
        </h1>
        <p className="text-sm text-muted">Vehículos y conductores disponibles para ofertar a nuevos clientes.</p>
      </header>

      <PendingFeatureBanner
        status="pending"
        title="Módulo de Prospectos"
        sprint={3}
        whatPending={[
          'Listado de vehículos no asignados a contrato',
          'Listado de conductores libres',
          'Filtros por tipo de vehículo, ciudad, disponibilidad',
          'Botón "Generar oferta" que crea un contrato borrador',
        ]}
      />

      <div className="card p-8 text-center text-muted">
        <Sparkles className="mx-auto h-10 w-10 mb-3" />
        <p className="font-medium">Sin prospectos por ahora</p>
        <p className="text-sm">Cuando termine el Sprint 3 verás aquí los recursos disponibles para ofertar.</p>
      </div>
    </div>
  );
}
