import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function PageHead({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <header className="rise mb-8 border-b-2 border-navy pb-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal">{kicker}</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold leading-[1.05] text-navy sm:text-5xl">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{children}</div>}
    </header>
  );
}

export function ErrorState({ message, onRetry, testid = 'error-state' }: { message: string; onRetry?: () => void; testid?: string }) {
  return (
    <div data-testid={testid} role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-5">
      <div className="flex items-center gap-2 font-semibold text-destructive">
        <AlertTriangle className="h-5 w-5" /> Could not load this
      </div>
      <p className="text-sm text-foreground/80">{message}</p>
      {onRetry && (
        <button data-testid="button-retry" onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, body, children, icon }: { title: string; body: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div data-testid="empty-state" className="rounded-2xl border-2 border-dashed border-navy/25 bg-card/60 p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy text-amber">{icon ?? <Inbox className="h-6 w-6" />}</div>
      <h3 className="font-display text-xl font-bold text-navy">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" data-testid="loading-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function Meter({ label, value, max = 100, tone, suffix }: { label: string; value: number; max?: number; tone: 'teal' | 'amber' | 'navy'; suffix?: string }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const bar = tone === 'teal' ? 'bg-teal' : tone === 'amber' ? 'bg-amber' : 'bg-white';
  return (
    <div data-testid={`meter-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">{label}</span>
        <span className="font-display text-2xl font-extrabold tabular-nums text-white">
          {Math.round(value)}
          <span className="text-sm text-white/50">{suffix ?? '/' + max}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full origin-left rounded-full transition-transform duration-700 ease-out ${bar}`} style={{ transform: `scaleX(${pct})`, width: '100%' }} />
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls = /reject/.test(s) ? 'bg-destructive/10 text-destructive' : /approved|verified|complete/.test(s) ? 'bg-teal/15 text-teal' : 'bg-amber/15 text-amber';
  return <span data-testid="pill-status" className={`inline-block rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${cls}`}>{status.replace(/_/g, ' ')}</span>;
}
