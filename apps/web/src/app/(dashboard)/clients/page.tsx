import { Building2 } from 'lucide-react';
import { ComingSoon } from '@/components/coming-soon';

export default function ClientsPage() {
  return (
    <ComingSoon
      icon={Building2}
      sprint={3}
      title="Empresas Clientes"
      description="Empresas que alquilan vehículos: contacto, NIT, contratos asociados. Disponible en el Sprint 3."
    />
  );
}
