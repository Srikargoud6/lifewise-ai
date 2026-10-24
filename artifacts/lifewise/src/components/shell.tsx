import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { BookOpen, Dumbbell, Flame, Sprout, Trophy, UserRound, Zap } from 'lucide-react';
import { useLearner } from '@/hooks/use-learner';
import { useProgress, xpOf } from '@/hooks/use-progress';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const NAV = [
  { href: '/learn', label: 'Learn', icon: BookOpen, test: 'learn' },
  { href: '/practice', label: 'Practice', icon: Dumbbell, test: 'practice' },
  { href: '/learn/progress', label: 'Progress', icon: Trophy, test: 'progress' },
];

export function Shell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const { state, requireLearner: requestRegistration } = useLearner();
  const [profileOpen, setProfileOpen] = useState(false);
  const requireLearner = () => {
    if (state?.learner) setProfileOpen(true);
    else requestRegistration();
  };
  const prog = useProgress();
  const x = xpOf(prog.data);
  const active = (h: string) => {
    if (h === '/learn') return loc === '/' || loc === '/learn' || loc.startsWith('/learn/lesson') || loc.startsWith('/learn/daily');
    if (h === '/practice') return loc.startsWith('/practice') || loc.startsWith('/simulation');
    return loc.startsWith(h);
  };
  const quiet = loc.startsWith('/simulation') || loc.startsWith('/learn/lesson') || loc.startsWith('/learn/daily');
  const Logo = (
    <Link href="/" className="flex items-center gap-2" data-testid="link-logo">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf text-white" style={{ boxShadow: "0 3px 0 #43a102" }}><Sprout className="h-6 w-6" /></span>
      <span className="text-2xl font-bold text-ink">Lifewise</span>
    </Link>
  );
  return (
    <div className="min-h-[100dvh] bg-cream pb-24 lg:pb-0 lg:pl-60">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col gap-6 border-r-2 border-line bg-cream p-4 lg:flex">
        <div className="px-2 pt-2">{Logo}</div>
        <nav aria-label="Primary" className="flex flex-col gap-2">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined} data-testid={`link-nav-${n.test}`} className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-black uppercase tracking-wider transition-colors ${active(n.href) ? 'border-sky bg-sky/10 text-sky-d' : 'border-transparent text-mute hover:bg-line/50'}`}>
              <n.icon className="h-6 w-6" /> {n.label}
            </Link>
          ))}
          <button data-testid="button-profile" onClick={() => requireLearner()} className="flex items-center gap-3 rounded-2xl border-2 border-transparent px-4 py-3 text-left text-sm font-black uppercase tracking-wider text-mute hover:bg-line/50">
            <UserRound className="h-6 w-6" /> <span className="truncate">{state?.learner ? state.learner.name : 'Profile'}</span>
          </button>
        </nav>
      </aside>
      <header className="sticky top-0 z-20 border-b-2 border-line bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
          <div className="lg:hidden">{Logo}</div>
          <div className="ml-auto flex items-center gap-2 text-sm font-black" data-testid="status-chips">
            {state?.learner ? (
              <>
                <span title="Current streak" data-testid="chip-streak" className="flex items-center gap-1 rounded-xl px-2 py-1 text-[#e8741a]"><Flame className="h-5 w-5" />{prog.data?.currentStreak ?? 0}</span>
                <span title="Total XP" data-testid="chip-xp" className="flex items-center gap-1 rounded-xl px-2 py-1 text-sun-d"><Zap className="h-5 w-5" />{x.totalXp}</span>
                <span title="Level" data-testid="chip-level" className="rounded-xl bg-grape px-2.5 py-1 text-white">Lv {x.level}</span>
              </>
            ) : !quiet && (
              <button data-testid="button-register-top" onClick={() => requireLearner()} className="chunk chunk-sky !px-4 !py-2 !text-xs">Save my progress</button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t-2 border-line bg-cream pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Mobile">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined} data-testid={`link-tab-${n.test}`} className={`m-1 flex flex-col items-center gap-0.5 rounded-xl border-2 py-2 text-[11px] font-black uppercase ${active(n.href) ? 'border-sky bg-sky/10 text-sky-d' : 'border-transparent text-mute'}`}>
            <n.icon className="h-6 w-6" /> {n.label}
          </Link>
        ))}
        <button data-testid="button-profile-mobile" onClick={() => requireLearner()} className="m-1 flex flex-col items-center gap-0.5 rounded-xl border-2 border-transparent py-2 text-[11px] font-black uppercase text-mute">
          <UserRound className="h-6 w-6" /> {state?.learner ? 'Me' : 'Join'}
        </button>
      </nav>
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent data-testid="dialog-profile" className="rounded-3xl border-2 border-line bg-cream sm:max-w-md">
          <DialogTitle className="text-2xl font-bold text-ink">Your learning profile</DialogTitle>
          <DialogDescription>This profile saves your learning progress in this browser. It is not a verified account or a cross-device login.</DialogDescription>
          <dl className="space-y-3 rounded-2xl border-2 border-line bg-white p-4 text-sm">
            <div><dt className="font-black text-mute">Name</dt><dd className="font-bold text-ink">{state?.learner?.name}</dd></div>
            <div><dt className="font-black text-mute">Learning group</dt><dd className="font-bold text-ink">{state?.learner?.ageGroup}</dd></div>
            <div><dt className="font-black text-mute">Coaching language</dt><dd className="font-bold text-ink">{state?.learner?.language}</dd></div>
          </dl>
          <Link href="/learn/progress" onClick={() => setProfileOpen(false)} className="chunk chunk-green">View my progress</Link>
        </DialogContent>
      </Dialog>
    </div>
  );
}
