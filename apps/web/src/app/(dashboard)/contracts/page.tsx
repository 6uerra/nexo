import { FileText } from 'lucide-react';
import { ComingSoon } from '@/components/coming-soon';

export default function ContractsPage() {
  return (
    <ComingSoon
      icon={FileText}
      sprint={3}
      title="Contratos"
      description="Generación automática de contratos PDF (indefinidos o por término fijo). Disponible en el Sprint 3."
    />
  );
}
