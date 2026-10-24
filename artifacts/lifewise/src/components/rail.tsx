import { Link } from 'wouter';
import { CalendarCheck, Flame, Zap } from 'lucide-react';
import { useLearner } from '@/hooks/use-learner';
import { useProgress, xpOf } from '@/hooks/use-progress';
import { GoalRing } from '@/components/bits';

export function QuestRail() {
  const { state, requireLearner } = useLearner();
  const prog = useProgress();
  const p = prog.data;
  const x = xpOf(p);
  if (!state?.learner) {
    return (
      <aside className="pane p-5" data-testid="rail-guest">
        <h2 className="text-2xl font-bold text-ink">Make it count</h2>
        <p className="mt-1 text-sm text-mute">Create a quick profile on this browser to save XP, streaks and badges. No password.</p>
        <button data-testid="button-rail-register" onClick={() => requireLearner()} className="chunk chunk-green chunk-block mt-4">Create profile</button>
      </aside>
    );
  }
  return (
    <aside className="space-y-4" data-testid="rail-quests">
      <section className="pane flex items-center gap-4 p-4" aria-label="Daily goal">
        <GoalRing value={x.todayXp} goal={x.goal} />
        <div>
          <h2 className="text-xl font-bold text-ink">Daily goal</h2>
          <p className="text-sm text-mute" data-testid="text-daily-goal">{x.todayXp >= x.goal ? 'Goal reached today.' : `${Math.max(0, x.goal - x.todayXp)} XP to go (${x.goal} XP goal).`}</p>
        </div>
      </section>
      <section className="pane p-4" aria-label="Streak">
        <div className="flex items-center gap-3">
          <Flame className={`h-10 w-10 text-[#e8741a] ${p?.todayCompleted ? 'flick' : ''}`} />
          <div>
            <p className="text-3xl font-bold leading-none text-ink" data-testid="text-streak-mini">{p?.currentStreak ?? 0} day streak</p>
            <p className="text-xs font-bold text-mute">Best {p?.bestStreak ?? 0}. Badges at 50 and 100 days.</p>
          </div>
        </div>
      </section>
      <section className="pane p-4" aria-label="Daily quest">
        <div className="flex items-center gap-2 text-lg font-bold text-ink"><CalendarCheck className="h-5 w-5 text-sky" /> Daily 5</div>
        <p className="mt-1 text-sm text-mute">
          {p?.todayCompleted ? 'Today is credited. Come back tomorrow to keep the streak.' : (
            <>Five questions, one learning day. Quizzes earn <span className="inline-flex items-center gap-0.5 font-black text-sun-d"><Zap className="h-3.5 w-3.5" />XP</span>.</>
          )}
        </p>
        <Link href="/learn/daily" data-testid="link-rail-daily" className="chunk chunk-sky chunk-block mt-3">{p?.todayCompleted ? 'Review today' : 'Start Daily 5'}</Link>
      </section>
    </aside>
  );
}
