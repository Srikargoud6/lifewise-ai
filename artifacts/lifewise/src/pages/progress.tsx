import { useEffect } from 'react';
import { Link } from 'wouter';
import { useGetLearningLibrary } from '@workspace/api-client-react';
import { Award, Flame, Lock, Star, Zap } from 'lucide-react';
import { useLearner } from '@/hooks/use-learner';
import { useProgress, xpOf } from '@/hooks/use-progress';
import { EmptyState, ErrorState, GoalRing, ListSkeleton } from '@/components/bits';
import { day } from '@/components/quiz';
import { errMsg } from '@/lib/lw';

const MILES = [[50, '50-Day Learning Champion'], [100, '100-Day Life Skills Master']] as const;
function lastDays(today: string, n: number) {
  const base = new Date(today + 'T00:00:00Z').getTime();
  return Array.from({ length: n }, (_, i) => new Date(base - (n - 1 - i) * 864e5).toISOString().slice(0, 10));
}

export function ProgressPage() {
  useEffect(() => { document.title = 'My Progress | Lifewise Learn'; }, []);
  const { state, isLoading, requireLearner } = useLearner();
  const prog = useProgress();
  const lib = useGetLearningLibrary();
  const p = prog.data;
  const x = xpOf(p);
  const titles = new Map((lib.data ?? []).map((l) => [l.id, l.title]));
  const set = new Set(p?.learningDays ?? []);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-4xl font-bold text-ink">Your progress</h1>
      <p className="mb-5 text-sm text-mute">Finish a lesson quiz or Daily 5 to complete a learning day. Reading alone does not count. One day is credited per Asia/Kolkata date. A missed day resets your current streak; best streak and badges stay. Badges have no monetary value.</p>
      {isLoading && <ListSkeleton rows={4} />}
      {!state?.learner && !isLoading && (
        <EmptyState title="Nothing earned yet" body="Create a profile on this browser and your XP, streaks and badges are saved here.">
          <button data-testid="button-progress-register" onClick={() => requireLearner()} className="chunk chunk-green">Create profile</button>
          <Link href="/learn" className="chunk chunk-ghost">Browse lessons</Link>
        </EmptyState>
      )}
      {state?.learner && prog.isLoading && <ListSkeleton rows={4} />}
      {prog.isError && <ErrorState message={errMsg(prog.error)} onRetry={() => void prog.refetch()} />}
      {p && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Current streak', p.currentStreak + ' days', <Flame key="f" className="h-6 w-6 text-[#e8741a]" />],
              ['Best streak', p.bestStreak + ' days', <Star key="s" className="h-6 w-6 text-sun-d" />],
              ['Total XP', String(x.totalXp), <Zap key="z" className="h-6 w-6 text-sun-d" />],
              ['Level', String(x.level), <Award key="a" className="h-6 w-6 text-grape" />],
            ].map(([k, v, ic]) => (
              <div key={k as string} className="pane p-3" data-testid={`stat-${(k as string).toLowerCase().replace(/\s/g, '-')}`}>
                <p className="flex items-center gap-1.5 text-xs font-black uppercase text-mute">{ic}{k}</p>
                <p className="text-2xl font-bold text-ink">{v}</p>
              </div>
            ))}
          </div>
          <section className="pane flex flex-col gap-4 p-5 sm:flex-row sm:items-center" aria-label="Level and daily goal">
            <GoalRing value={x.todayXp} goal={x.goal} size={110} />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-ink">Daily goal: {x.todayXp} of {x.goal} XP</h2>
              <p className="text-sm text-mute">{p.todayCompleted ? 'Today is credited as a learning day.' : 'No learning day credited yet today.'}</p>
              <div className="mt-3 flex justify-between text-xs font-black uppercase text-mute"><span>Level {x.level}</span><span>{x.intoLevel} / 100 XP</span></div>
              <div role="progressbar" aria-label="Level progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={x.intoLevel} className="mt-1 h-4 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-grape" style={{ width: x.intoLevel + '%' }} /></div>
              <p className="mt-2 text-xs text-mute">First completion earns 20 XP plus 10 per correct answer. Retakes earn 10 XP per improved best correct answer.</p>
            </div>
          </section>
          <section aria-labelledby="cal-h" className="pane p-5">
            <h2 id="cal-h" className="mb-3 text-xl font-bold text-ink">Last 28 days</h2>
            <ul className="grid grid-cols-7 gap-1.5 sm:max-w-md" data-testid="calendar">
              {lastDays(p.today, 28).map((d) => (
                <li key={d} aria-label={`${day(d)}: ${set.has(d) ? 'learned' : 'no learning'}${d === p.today ? ', today' : ''}`} className={`flex aspect-square items-center justify-center rounded-xl text-xs font-black ${set.has(d) ? 'bg-sun text-ink' : 'bg-line/60 text-mute'} ${d === p.today ? 'ring-2 ring-sky ring-offset-1' : ''}`}>{Number(d.slice(8))}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="badge-h">
            <h2 id="badge-h" className="mb-2 text-xl font-bold text-ink">Streak badges</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {MILES.map(([n, t]) => {
                const a = p.achievements.find((y) => y.days === n);
                const count = a ? n : Math.min(p.currentStreak, n);
                return (
                  <div key={n} data-testid={`badge-${n}`} className={`pane p-4 ${a ? '!bg-sun/25 !border-sun' : ''}`}>
                    <div className="flex items-center gap-3">
                      {a ? <Award className="pop h-12 w-12 text-sun-d" /> : <Lock className="h-12 w-12 text-mute/60" />}
                      <div><p className="text-lg font-bold text-ink">{a?.title ?? t}</p><p className="text-xs font-bold text-mute">{a ? `Awarded ${day(a.awardedAt)}` : 'Locked'}</p></div>
                    </div>
                    <div data-testid={`milestone-${n}`} role="progressbar" aria-label={t} aria-valuemin={0} aria-valuemax={n} aria-valuenow={count} className="mt-3 h-3 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-sun" style={{ width: (count / n) * 100 + '%' }} /></div>
                    <p className="mt-1 text-right text-xs font-black text-mute">{count} / {n}</p>
                  </div>
                );
              })}
            </div>
          </section>
          <section aria-labelledby="les-h">
            <h2 id="les-h" className="mb-1 text-xl font-bold text-ink">Lessons</h2>
            <p className="mb-3 text-sm text-mute">{p.lessons.length} of {lib.data?.length ?? 18} lesson quizzes completed. Retakes can improve your best score.</p>
            {p.lessons.length === 0 ? <EmptyState title="No lessons completed" body="Finish a lesson quiz to see your best scores here."><Link href="/learn" className="chunk chunk-green">Open lessons</Link></EmptyState> : (
              <ul className="pane divide-y-2 divide-line overflow-hidden">
                {p.lessons.map((c) => (
                  <li key={c.lessonId} data-testid={`row-lesson-${c.lessonId}`}>
                    <Link href={`/learn/lesson/${c.lessonId}`} className="flex items-center justify-between gap-3 p-4 hover:bg-cream">
                      <span className="font-bold text-ink">{titles.get(c.lessonId) ?? c.lessonId}</span>
                      <span className="whitespace-nowrap text-xs font-black text-mute">Best {c.bestScore}/{c.lastResult.total} / {c.attempts} tries</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {p.dailyResult && <p className="text-sm font-bold" data-testid="text-daily-saved">Latest daily: {p.dailyResult.score} of {p.dailyResult.total} on {day(p.dailyResult.day)}. <Link href="/learn/daily" className="text-sky-d underline">View review</Link></p>}
        </div>
      )}
    </div>
  );
}
