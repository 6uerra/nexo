'use client';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Barra de progreso superior cuando cambia la ruta. Aparece sólo cuando
 * Next está navegando para evitar la sensación de "click sin respuesta".
 */
export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // El cambio de pathname ya completó; ocultar progress
    setVisible(true);
    setProgress(80);
    const t1 = setTimeout(() => setProgress(100), 80);
    const t2 = setTimeout(() => { setVisible(false); setProgress(0); }, 280);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pathname, search]);

  return (
    <div className="fixed top-0 inset-x-0 z-[60] pointer-events-none" aria-hidden>
      <div
        className="h-0.5 bg-primary transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}
