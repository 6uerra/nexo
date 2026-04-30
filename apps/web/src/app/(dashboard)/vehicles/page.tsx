'use client';
import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
import { MediaCapture, type MediaItem } from '@/components/media-capture';
import { api } from '@/lib/api';

/**
 * Sprint 1 incluye un demo funcional de captura de fotos/videos.
 * El CRUD completo de vehículos llega en Sprint 2.
 */
export default function VehiclesPage() {
  const [items, setItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await api<{ media: MediaItem[] }>('/media?entityType=vehicle-demo');
        setItems(r.media);
      } catch {}
    })();
  }, []);

  return (
    <div className="max-w-3xl space-y-6">
      <header className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
          <Truck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehículos</h1>
          <p className="text-sm text-muted">CRUD completo en Sprint 2 · Captura de fotos y videos disponible aquí.</p>
        </div>
      </header>

      <section className="card p-6">
        <h2 className="font-semibold">Captura de evidencia</h2>
        <p className="mt-1 text-sm text-muted">
          Tomate fotos del vehículo o sube desde tu galería. Para vehículos puedes también grabar/importar videos.
        </p>
        <div className="mt-4">
          <MediaCapture
            entityType="vehicle-demo"
            kinds={['image', 'video']}
            label="Demo vehículo"
            initial={items}
            onChange={setItems}
          />
        </div>
      </section>

      <section className="card p-6 bg-primary/5 border-primary/20">
        <p className="text-sm">
          <strong>¿Cómo se ve en el celular?</strong> Abre <code className="rounded bg-white px-1.5 py-0.5 text-xs">http://&lt;tu-ip&gt;:3000/vehicles</code> desde tu teléfono y los botones de cámara abrirán la cámara nativa.
        </p>
      </section>
    </div>
  );
}
