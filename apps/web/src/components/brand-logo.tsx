import { cn } from '@/lib/utils';

type Kind = 'bancolombia' | 'mercado_pago' | 'bank' | 'qr';

/**
 * Logos de marca renderizados inline. Sin dependencias externas.
 * Versiones simplificadas — usar solo para identificación visual interna.
 */
export function BrandLogo({ kind, className }: { kind: Kind; className?: string }) {
  if (kind === 'bancolombia') {
    return (
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shadow-sm', className)}
           style={{ background: '#FCD000' }} aria-label="Bancolombia">
        <svg viewBox="0 0 32 32" className="h-7 w-7">
          <text x="16" y="22" textAnchor="middle" fontSize="20" fontWeight="900"
            fontFamily="system-ui" fill="#1F2937">B</text>
          <circle cx="24" cy="9" r="2" fill="#1F2937" />
        </svg>
      </div>
    );
  }
  if (kind === 'mercado_pago') {
    return (
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shadow-sm', className)}
           style={{ background: '#00B1EA' }} aria-label="Mercado Pago">
        <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none">
          <path d="M5 16c1.5-3 4.5-5 8-5l3 2 3-2c3.5 0 6.5 2 8 5-2 4-6 7-11 7s-9-3-11-7z"
            fill="#fff" />
          <circle cx="13" cy="15" r="1.4" fill="#00B1EA" />
          <circle cx="19" cy="15" r="1.4" fill="#00B1EA" />
        </svg>
      </div>
    );
  }
  if (kind === 'qr') {
    return (
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900', className)}
           aria-label="QR">
        <svg viewBox="0 0 32 32" className="h-6 w-6" fill="#fff">
          <rect x="4" y="4" width="9" height="9" rx="1" />
          <rect x="6" y="6" width="5" height="5" rx="0.5" fill="#0F172A" />
          <rect x="19" y="4" width="9" height="9" rx="1" />
          <rect x="21" y="6" width="5" height="5" rx="0.5" fill="#0F172A" />
          <rect x="4" y="19" width="9" height="9" rx="1" />
          <rect x="6" y="21" width="5" height="5" rx="0.5" fill="#0F172A" />
          <rect x="17" y="17" width="3" height="3" />
          <rect x="22" y="17" width="3" height="3" />
          <rect x="17" y="22" width="3" height="3" />
          <rect x="22" y="22" width="3" height="3" />
          <rect x="25" y="25" width="3" height="3" />
        </svg>
      </div>
    );
  }
  // generic bank
  return (
    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-sm', className)}
         aria-label="Banco">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M12 2L2 7v2h20V7L12 2zm-7 9v7H3v2h18v-2h-2v-7h-2v7h-3v-7h-2v7h-2v-7H7v7H5v-7z"/>
      </svg>
    </div>
  );
}

export function brandLabelFor(kind: string): { brand: Kind; label: string } {
  if (kind === 'mercado_pago') return { brand: 'mercado_pago', label: 'Mercado Pago' };
  if (kind === 'bank') return { brand: 'bancolombia', label: 'Bancolombia' };
  if (kind === 'qr') return { brand: 'qr', label: 'Pago con QR' };
  return { brand: 'bank', label: 'Banco' };
}
