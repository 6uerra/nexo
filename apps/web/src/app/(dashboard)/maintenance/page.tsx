import { Wrench } from 'lucide-react';
import { ComingSoon } from '@/components/coming-soon';

export default function MaintenancePage() {
  return (
    <ComingSoon
      icon={Wrench}
      sprint={4}
      title="Mantenimientos"
      description="Aceite, llantas, alineación, lavado de motor y extintores. Por fecha y kilometraje. Deducciones automáticas. Disponible en el Sprint 4."
    />
  );
}
