import { ShieldCheck } from 'lucide-react';
import { ComingSoon } from '@/components/coming-soon';

export default function OwnersPage() {
  return (
    <ComingSoon
      icon={ShieldCheck}
      sprint={2}
      title="Propietarios"
      description="Registro de dueños de vehículos con datos bancarios para pagos. Disponible en el Sprint 2."
    />
  );
}
