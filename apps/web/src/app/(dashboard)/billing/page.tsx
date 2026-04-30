'use client';
import { useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';
import { MediaCapture, type MediaItem } from '@/components/media-capture';
import { api } from '@/lib/api';

/**
 * Sprint 1 incluye demo funcional de captura de facturas (foto/PDF).
 * Facturación cruzada completa en Sprint 4.
 */
export default function BillingPage() {
  const [items, setItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await api<{ media: MediaItem[] }>('/media?entityType=invoice-demo');
        setItems(r.media);
      } catch {}
    })();
  }, []);

  return (
    <div className="max-w-3xl space-y-6">
      <header className="flex items-center gap-3">
        <div className="rounded-lg bg-accent/10 p-2.5 text-accent">
          <Receipt className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturación cruzada</h1>
          <p className="text-sm text-muted">CRUD completo en Sprint 4 · Captura de comprobantes disponible aquí.</p>
        </div>
      </header>

      <section className="card p-6">
        <h2 className="font-semibold">Adjuntar facturas / comprobantes</h2>
        <p className="mt-1 text-sm text-muted">
          Tomale foto a la factura del taller, recibo de pago o comprobante de transferencia. También aceptamos PDFs.
        </p>
        <div className="mt-4">
          <MediaCapture
            entityType="invoice-demo"
            kinds={['image', 'document']}
            label="Demo factura"
            initial={items}
            onChange={setItems}
          />
        </div>
      </section>
    </div>
  );
}
