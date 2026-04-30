import { Construction } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function ComingSoon({
  title,
  description,
  sprint,
  icon: Icon = Construction,
}: {
  title: string;
  description: string;
  sprint: 2 | 3 | 4;
  icon?: LucideIcon;
}) {
  return (
    <div className="max-w-2xl">
      <div className="card p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <span className="mt-6 inline-block rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent">
          En desarrollo · Sprint {sprint}
        </span>
      </div>
    </div>
  );
}
