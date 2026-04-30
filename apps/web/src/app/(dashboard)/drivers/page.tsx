import { Users } from 'lucide-react';
import { ComingSoon } from '@/components/coming-soon';

export default function DriversPage() {
  return (
    <ComingSoon
      icon={Users}
      sprint={2}
      title="Conductores"
      description="Perfil completo con licencia, EPS, ARL, pensión, exámenes médicos y dotación. Disponible en el Sprint 2."
    />
  );
}
