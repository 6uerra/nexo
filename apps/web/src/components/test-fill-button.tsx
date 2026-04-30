'use client';
import { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';

interface Props {
  onFill: () => void;
  label?: string;
  className?: string;
}

/**
 * Botón visible solo en modo desarrollo (NEXT_PUBLIC_DEV_MODE=true).
 * Llama al handler `onFill` para que el formulario se autocomplete con datos de prueba.
 */
export function TestFillButton({ onFill, label = 'Datos de prueba', className }: Props) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(process.env.NEXT_PUBLIC_DEV_MODE === 'true');
  }, []);

  if (!enabled) return null;

  return (
    <button
      type="button"
      onClick={onFill}
      className={
        className ??
        'inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 cursor-pointer transition-colors'
      }
      title="Autocompletar con datos dummy (solo en dev)"
    >
      <FlaskConical className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
