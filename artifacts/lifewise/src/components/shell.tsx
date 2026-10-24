import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { getHealthCheckQueryKey, useHealthCheck } from '@workspace/api-client-react';
import { BookOpen, Compass, Eye, FileBarChart, GraduationCap, UserRound, UserCheck } from 'lucide-react';
import { useLearner } from '@/hooks/use-learner';

const NAV = [
  { href: '/', label: 'Simulations', short: 'Simulate', icon: GraduationCap },
  { href: '/learn', label: 'Learn', short: 'Learn', icon: BookOpen },
  { href: '/approvals', label: 'Mentor Queue', short: 'Mentor', icon: UserCheck },
  { href: '/observatory', label: 'Observatory', short: 'Traces', icon: Eye },
  { href: '/proof', label: 'Proof of Life', short: 'Proof', icon: FileBarChart },
];

export function Shell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const { state, requireLearner } = useLearner();
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), refetchInterval: 15000, retry: false } });
  const active = (h: string) => (h === '/' ? loc === '/' || loc.startsWith('/simulation') : loc.startsWith(h));
  return (
    <div className="min-h-[100dvh] pb-20 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2" data-testid="link-logo">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-amber text-navy">
              <Compass className="sweep h-5 w-5" />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">Lifewise<span className="text-amber">.</span></span>
          </Link>
          <nav className="ml-2 hidden gap-1 lg:flex" aria-label="Primary">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined} data-testid={`link-nav-${n.short.toLowerCase()}`} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active(n.href) ? 'bg-white text-navy' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span data-testid="status-health" title="API health" className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white/60 sm:flex">
              <span className={`h-2 w-2 rounded-full ${health.isError ? 'bg-destructive' : health.data ? 'bg-teal' : 'bg-white/30'}`} />
              {health.isError ? 'API down' : health.data ? 'API live' : 'checking'}
            </span>
            <button data-testid="button-profile" onClick={() => requireLearner()} className="flex items-center gap-2 rounded-full border border-white/25 px-3 py-1.5 text-sm font-semibold hover:bg-white/10">
              <UserRound className="h-4 w-4" />
              <span className="max-w-[8rem] truncate">{state?.learner ? state.learner.name : 'Register'}</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/10 bg-navy pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Mobile">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined} data-testid={`link-tab-${n.short.toLowerCase()}`} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${active(n.href) ? 'text-amber' : 'text-white/75'}`}>
            <n.icon className="h-5 w-5" />
            {n.short}
          </Link>
        ))}
      </nav>
    </div>
  );
}
