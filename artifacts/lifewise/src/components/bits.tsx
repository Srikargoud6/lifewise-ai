import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Sprout } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function PageHead({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <header className="rise mb-6">
      <p className="text-xs font-black uppercase tracking-widest text-sky">{kicker}</p>
      <h1 className="mt-1 text-4xl font-bold leading-tight text-ink sm:text-5xl">{title}</h1>
      {children && <div className="mt-2 max-w-2xl text-base text-mute">{children}</div>}
    </header>
  );
}

export function ErrorState({ message, onRetry, testid = 'error-state' }: { message: string; onRetry?: () => void; testid?: string }) {
  return (
    <div data-testid={testid} role="alert" className="pane flex flex-col items-start gap-3 border-berry p-5" style={{ boxShadow: '0 3px 0 #f0455a' }}>
      <div className="flex items-center gap-2 text-lg font-bold text-berry-d"><AlertTriangle className="h-5 w-5" /> That did not load</div>
      <p className="text-sm text-ink/80">{message}</p>
      {onRetry && (
        <button data-testid="button-retry" onClick={onRetry} className="chunk chunk-berry"><RefreshCw className="h-4 w-4" /> Try again</button>
      )}
    </div>
  );
}

export function EmptyState({ title, body, children, icon }: { title: string; body: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div data-testid="empty-state" className="pane border-dashed p-8 text-center">
      <div className="pop mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-leaf text-white" style={{ boxShadow: '0 4px 0 #43a102' }}>{icon ?? <Sprout className="h-8 w-8" />}</div>
      <h3 className="text-2xl font-bold text-ink">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-mute">{body}</p>
      {children && <div className="mt-4 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" data-testid="loading-skeleton">
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl bg-line/60" />)}
    </div>
  );
}

export function Meter({ label, value, max = 100, color, suffix }: { label: string; value: number; max?: number; color: string; suffix?: string }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div data-testid={`meter-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-mute">{label}</span>
        <span className="text-2xl font-bold tabular-nums text-ink">{Math.round(value)}<span className="text-sm text-mute">{suffix ?? '/' + max}</span></span>
      </div>
      <div className="mt-1 h-4 overflow-hidden rounded-full bg-line/70">
        <div className="h-full origin-left rounded-full transition-transform duration-700 ease-out" style={{ transform: `scaleX(${pct})`, width: '100%', background: color }} />
      </div>
    </div>
  );
}

export function GoalRing({ value, goal, size = 96 }: { value: number; goal: number; size?: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${value} of ${goal} XP today`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#eadfc8" strokeWidth="12" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={pct >= 1 ? '#58cc02' : '#ffc21a'} strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset .8s ease-out' }} />
      <text x="50" y="56" textAnchor="middle" fontSize="22" fontWeight="700" fill="#2b1b3d" fontFamily="Fredoka">{value}</text>
    </svg>
  );
}
