import { cn } from '@/lib/utils';

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden="true">
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2563EB" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <circle cx="14" cy="32" r="9" fill="url(#logo-grad)" />
        <circle cx="50" cy="32" r="9" fill="#F97316" />
        <path d="M14 32 C 24 8, 40 56, 50 32" stroke="url(#logo-grad)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <circle cx="14" cy="32" r="3" fill="#fff" />
        <circle cx="50" cy="32" r="3" fill="#fff" />
      </svg>
      {withText && (
        <span className="text-xl font-bold tracking-tight text-ink">
          Nexo
        </span>
      )}
    </div>
  );
}
