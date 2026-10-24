import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetLearnerQueryKey,
  getGetLearningProgressQueryKey,
  getGetDailyChallengeQueryKey,
  useGetDailyChallenge,
  useGetLearningLibrary,
  useGetLearningProgress,
  useStartSimulation,
  useSubmitLearningQuiz,
  type LearningAchievement,
  type LearningLesson,
  type LearningQuestion,
  type LearningResult,
  type LearningQuizInput,
} from '@workspace/api-client-react';
import { Award, BookOpen, CalendarCheck, Check, ExternalLink, Flame, Languages, Loader2, Lock, Play, RotateCcw, X } from 'lucide-react';
import { useLearner } from '@/hooks/use-learner';
import { EmptyState, ErrorState, ListSkeleton, PageHead } from '@/components/bits';
import { errMsg } from '@/lib/lw';

const SUBJECTS = ['Politics', 'Government', 'Ethics', 'Economy', 'Health', 'Finance'] as const;
const day = (d: string) => new Date(d.length === 10 ? d + 'T00:00:00+05:30' : d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

function useTitle(t: string) {
  useEffect(() => {
    document.title = t;
    const description = `${t}. Free, authored life-skills learning for Indian learners, with practice quizzes and saved learning habits.`;
    for (const [attribute, name, content] of [
      ['name', 'description', description],
      ['property', 'og:title', t],
      ['property', 'og:description', description],
    ]) {
      let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
      if (!tag) { tag = document.createElement('meta'); tag.setAttribute(attribute!, name!); document.head.append(tag); }
      tag.content = content!;
    }
  }, [t]);
}

function useProgress() {
  const { state } = useLearner();
  return useGetLearningProgress({ query: { queryKey: getGetLearningProgressQueryKey(), enabled: !!state?.learner, refetchOnMount: 'always', refetchInterval: 60000, retry: false } });
}

function LearnTabs({ active }: { active: string }) {
  const tabs = [['/learn', 'Library'], ['/learn/daily', 'Daily 5'], ['/learn/progress', 'Progress']];
  return (
    <nav aria-label="Learn sections" className="mb-6 flex gap-2 overflow-x-auto">
      {tabs.map(([h, l]) => (
        <Link key={h} href={h} data-testid={`link-learn-${l.toLowerCase().replace(/\s/g, '-')}`} aria-current={active === h ? 'page' : undefined} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${active === h ? 'bg-navy text-white' : 'border bg-card text-navy hover:border-teal'}`}>{l}</Link>
      ))}
    </nav>
  );
}

function EnglishNote() {
  return (
    <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground" data-testid="text-english-note">
      <Languages className="h-3.5 w-3.5 text-teal" /> This library is in English. Your simulation coaching language is unchanged.
    </p>
  );
}

function Achievements({ list }: { list: LearningAchievement[] }) {
  return (
    <div role="status" aria-live="polite" data-testid="status-achievements">
      {list.map((a) => (
        <div key={a.days} className="rise mt-4 flex items-center gap-3 rounded-2xl bg-amber/20 p-4 text-navy">
          <Award className="h-8 w-8 shrink-0" />
          <div>
            <p className="font-display text-xl font-extrabold">New badge: {a.title}</p>
            <p className="text-sm">{a.days} consecutive days of learning, awarded {day(a.awardedAt)}. A digital, non-monetary reward.</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultView({ r, onRetake, saved }: { r: LearningResult; onRetake: () => void; saved: boolean }) {
  return (
    <section className="rise rounded-3xl border bg-card p-5 sm:p-7" data-testid="section-result" aria-labelledby="result-h">
      <p className="font-mono text-[11px] uppercase tracking-widest text-teal">{saved ? 'Saved result' : 'Your result'} / {day(r.completedAt)}</p>
      <h2 id="result-h" className="font-display text-4xl font-extrabold text-navy" data-testid="text-score">{r.score} of {r.total} correct</h2>
      {!saved && <Achievements list={r.newAchievements} />}
      <ol className="mt-5 space-y-3">
        {r.review.map((v, i) => {
          const ok = v.selected === v.correct;
          return (
            <li key={v.questionId} data-testid={`review-${i}`} className={`rounded-xl border-l-4 bg-background p-4 ${ok ? 'border-l-teal' : 'border-l-destructive'}`}>
              <p className="flex items-start gap-2 font-semibold text-navy">{ok ? <Check className="mt-1 h-4 w-4 shrink-0 text-teal" /> : <X className="mt-1 h-4 w-4 shrink-0 text-destructive" />}{v.prompt}</p>
              <p className="mt-1 text-sm"><span className="font-semibold">{ok ? 'Correct:' : 'You chose:'}</span> {v.selected}</p>
              {!ok && <p className="text-sm"><span className="font-semibold">Right answer:</span> {v.correct}</p>}
              <p className="mt-1 text-sm text-muted-foreground">{v.explanation}</p>
            </li>
          );
        })}
      </ol>
      <button data-testid="button-retake" onClick={onRetake} className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-navy px-5 py-2.5 font-bold text-navy hover:bg-navy hover:text-white">
        <RotateCcw className="h-4 w-4" /> Practice again
      </button>
    </section>
  );
}

function Quiz({ kind, sourceId, questions, saved, children }: { kind: 'lesson' | 'daily'; sourceId: string; questions: LearningQuestion[]; saved?: LearningResult; children?: (r: LearningResult) => ReactNode }) {
  const qc = useQueryClient();
  const { requireLearner } = useLearner();
  const submit = useSubmitLearningQuiz();
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [result, setResult] = useState<LearningResult | null>(null);
  const [retaking, setRetaking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const reqId = useRef<string>(crypto.randomUUID());
  const payload = useRef<LearningQuizInput | null>(null);
  const [locked, setLocked] = useState(false);
  const shown = result ?? (saved && !retaking ? saved : null);

  function run() {
    if (submit.isPending) return;
    setErr(null);
    payload.current ??= { requestId: reqId.current, kind, sourceId, answers: answers as number[] };
    setLocked(true);
    submit.mutate(
      { data: payload.current },
      {
        onSuccess: (r) => {
          setResult(r);
          void qc.invalidateQueries({ queryKey: getGetLearningProgressQueryKey() });
        },
        onError: (e) => setErr(errMsg(e)),
      },
    );
  }
  function go(e: React.FormEvent) {
    e.preventDefault();
    if (answers.some((a) => a === null)) return setMissing(true);
    setMissing(false);
    requireLearner(run);
  }
  function retake() {
    reqId.current = crypto.randomUUID();
    payload.current = null;
    setLocked(false);
    setAnswers(questions.map(() => null));
    setResult(null);
    setRetaking(true);
    setErr(null);
  }

  if (shown) return <><ResultView r={shown} saved={!result} onRetake={retake} />{children?.(shown)}</>;
  return (
    <form onSubmit={go} className="space-y-5" data-testid="form-quiz" noValidate>
      {questions.map((q, qi) => (
        <fieldset key={q.id} disabled={locked} className="rounded-2xl border bg-card p-4 sm:p-5">
          <legend className="px-1 font-mono text-[11px] uppercase tracking-widest text-teal">Question {qi + 1} of {questions.length}</legend>
          <p className="mb-3 font-display text-lg font-bold text-navy">{q.prompt}</p>
          <div className="grid gap-2">
            {q.options.map((o, oi) => (
              <label key={oi} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal ${answers[qi] === oi ? 'border-navy bg-navy text-white' : 'bg-background hover:border-teal'}`}>
                <input type="radio" className="mt-1 accent-amber" name={`${sourceId}-${q.id}`} data-testid={`radio-${qi}-${oi}`} checked={answers[qi] === oi} onChange={() => setAnswers((a) => a.map((x, i) => (i === qi ? oi : x)))} />
                <span>{o}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {missing && <p role="alert" data-testid="text-quiz-missing" className="text-sm font-medium text-destructive">Answer every question before submitting.</p>}
      {err && (
        <div role="alert" data-testid="text-quiz-error" className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {err} Your answers are kept. Retrying will not double count.
        </div>
      )}
      <button data-testid="button-submit-quiz" disabled={submit.isPending} className="inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 font-bold text-white disabled:opacity-60">
        {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />} {err ? 'Retry submit' : 'Submit answers'}
      </button>
    </form>
  );
}

export function LearnHome() {
  useTitle('Learn | Lifewise Free Life-Skills Lessons');
  const lib = useGetLearningLibrary();
  const prog = useProgress();
  const { state } = useLearner();
  const best = useMemo(() => new Map((prog.data?.lessons ?? []).map((l) => [l.lessonId, l])), [prog.data]);
  const lessons = lib.data ?? [];
  return (
    <div className="learn-surface">
      <PageHead kicker="Learn / free reading" title="Read first. Then practise.">
        <EnglishNote />
      </PageHead>
      <LearnTabs active="/learn" />
      {prog.data && (
        <p className="mb-6 flex items-center gap-2 text-sm font-semibold text-navy" data-testid="text-streak-mini"><Flame className="h-4 w-4 text-amber" /> {prog.data.currentStreak} day streak. {prog.data.todayCompleted ? 'Today is done.' : 'Today is still open.'}</p>
      )}
      {!state?.learner && <p className="mb-6 rounded-lg bg-amber/10 p-3 text-sm">Reading is open to everyone. Register when you submit a quiz so your streak and badges are saved.</p>}
      {lib.isLoading && <ListSkeleton rows={4} />}
      {lib.isError && <ErrorState message={errMsg(lib.error)} onRetry={() => void lib.refetch()} />}
      {lib.data && lessons.length === 0 && <EmptyState title="No lessons yet" body="The library returned nothing. Try again shortly." />}
      <div className="space-y-10">
        {SUBJECTS.map((s) => {
          const ls = lessons.filter((l) => l.subject === s);
          if (!ls.length) return null;
          return (
            <section key={s} aria-labelledby={`h-${s}`}>
              <h2 id={`h-${s}`} className="mb-3 border-b-2 border-navy pb-1 font-display text-2xl font-extrabold text-navy">{s}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {ls.map((l) => {
                  const b = best.get(l.id);
                  return (
                    <Link key={l.id} href={`/learn/lesson/${l.id}`} data-testid={`card-lesson-${l.id}`} className="rise block rounded-2xl border border-t-4 border-t-teal bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-teal">
                      <p className="font-display text-xl font-extrabold leading-tight text-navy">{l.title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{l.goal}</p>
                      <p className="mt-3 font-mono text-[11px] uppercase text-amber">{b ? `Best ${b.bestScore} of ${l.questions.length} / ${b.attempts} tries` : 'Not attempted'}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Section({ h, children }: { h: string; children: ReactNode }) {
  return <section className="mt-7"><h2 className="mb-2 font-display text-xl font-extrabold text-navy">{h}</h2>{children}</section>;
}

function Practice({ l }: { l: LearningLesson }) {
  const qc = useQueryClient();
  const [, setLoc] = useLocation();
  const { requireLearner } = useLearner();
  const start = useStartSimulation();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<() => Promise<void>>(async () => {});
  ref.current = async () => {
    setErr(null);
    setBusy(true);
    try {
      const sim = await start.mutateAsync({ data: { trackId: l.simulationTrackId as string } });
      await qc.invalidateQueries({ queryKey: getGetLearnerQueryKey() });
      setLoc('/simulation/' + sim.id);
    } catch (e) {
      setErr(errMsg(e));
      setBusy(false);
    }
  };
  if (!l.simulationTrackId) return null;
  return (
    <div className="mt-6 rounded-2xl bg-navy p-5 text-white" data-testid="section-practice">
      <p className="font-mono text-[11px] uppercase tracking-widest text-white/75">Now practise</p>
      <p className="mt-1 text-white/80">Try this idea in a three-decision simulation.</p>
      <button data-testid="button-start-simulation" disabled={busy} onClick={() => requireLearner(() => void ref.current())} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-paper px-5 py-2.5 font-bold text-navy disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Practice this in a simulation
      </button>
      {err && <p role="alert" className="mt-2 text-sm text-red-200">{err}</p>}
    </div>
  );
}

export function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const lib = useGetLearningLibrary();
  const prog = useProgress();
  const lesson = lib.data?.find((l) => l.id === id);
  useTitle(lesson ? `${lesson.title} | Lifewise Lesson` : 'Lesson | Lifewise Learn');
  const saved = prog.data?.lessons.find((c) => c.lessonId === id)?.lastResult;
  return (
    <div className="learn-surface mx-auto max-w-3xl">
      <Link href="/learn" data-testid="link-back-library" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-teal"><BookOpen className="h-4 w-4" /> Library</Link>
      {lib.isLoading && <ListSkeleton rows={4} />}
      {lib.isError && <ErrorState message={errMsg(lib.error)} onRetry={() => void lib.refetch()} />}
      {lib.data && !lesson && <EmptyState title="Lesson not found" body="This lesson does not exist in the library."><Link href="/learn" className="font-semibold text-teal">Back to library</Link></EmptyState>}
      {lesson && (
        <article>
          <p className="font-mono text-[11px] uppercase tracking-widest text-teal">{lesson.subject}</p>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-navy sm:text-5xl" data-testid="text-lesson-title">{lesson.title}</h1>
          <div className="mt-2"><EnglishNote /></div>
          <div lang="en" className="text-base leading-relaxed">
            <Section h="Learning goal"><p className="rounded-xl border-l-4 border-teal bg-secondary p-4">{lesson.goal}</p></Section>
            <Section h="The idea">{lesson.explanation.map((p, i) => <p key={i} className="mb-3">{p}</p>)}</Section>
            <Section h="An Indian example"><p className="rounded-xl bg-amber/10 p-4 ring-1 ring-amber/30">{lesson.example}</p></Section>
            <Section h="Takeaways"><ul className="list-disc space-y-1 pl-5">{lesson.takeaways.map((t, i) => <li key={i}>{t}</li>)}</ul></Section>
            <Section h="Next step"><p>{lesson.nextStep}</p></Section>
            <Section h="Keep in mind"><p className="text-sm text-muted-foreground" data-testid="text-caveat">{lesson.caveat}</p></Section>
            <Section h="References">
              <ul className="space-y-1 text-sm">{lesson.references.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-teal underline">{r.title}<ExternalLink className="h-3 w-3" /></a></li>)}</ul>
              <p className="mt-2 font-mono text-[11px] uppercase text-muted-foreground" data-testid="text-reviewed">Reviewed on {day(lesson.reviewedOn)}</p>
            </Section>
          </div>
          <h2 className="mb-3 mt-10 font-display text-3xl font-extrabold text-navy">Check yourself</h2>
          <Quiz key={lesson.id} kind="lesson" sourceId={lesson.id} questions={lesson.questions} saved={saved}>{() => null}</Quiz>
          <Practice l={lesson} />
        </article>
      )}
    </div>
  );
}

export function DailyPage() {
  useTitle('Daily 5 | Lifewise Learn');
  const q = useGetDailyChallenge({ query: { queryKey: getGetDailyChallengeQueryKey(), refetchInterval: 60000 } });
  const prog = useProgress();
  const d = q.data;
  const saved = prog.data?.dailyResult && prog.data.dailyResult.sourceId === d?.id ? prog.data.dailyResult : undefined;
  return (
    <div className="learn-surface mx-auto max-w-3xl">
      <PageHead kicker="Learn / daily" title="Daily 5" />
      <LearnTabs active="/learn/daily" />
      <p className="mb-4 text-sm text-muted-foreground">Five questions from different subjects, fixed for the day. Submit all five to credit a learning day, whatever your score. No AI call needed.</p>
      <button onClick={() => void q.refetch()} className="mb-4 rounded-lg border bg-card px-3 py-2 text-sm font-semibold">Refresh today's challenge</button>
      {q.isLoading && <ListSkeleton rows={4} />}
      {q.isError && <ErrorState message={errMsg(q.error)} onRetry={() => void q.refetch()} />}
      {d && (
        <>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground" data-testid="text-daily-day">{day(d.day)} / {d.timezone}</p>
          {d.questions.length === 0 ? <EmptyState title="No questions today" body="Check back soon." /> : <Quiz key={d.id} kind="daily" sourceId={d.id} questions={d.questions} saved={saved} />}
        </>
      )}
    </div>
  );
}

function lastDays(today: string, n: number) {
  const base = new Date(today + 'T00:00:00Z').getTime();
  return Array.from({ length: n }, (_, i) => new Date(base - (n - 1 - i) * 864e5).toISOString().slice(0, 10));
}

export function ProgressPage() {
  useTitle('My Progress | Lifewise Learn');
  const { state, isLoading, requireLearner } = useLearner();
  const prog = useProgress();
  const lib = useGetLearningLibrary();
  const p = prog.data;
  const titles = new Map((lib.data ?? []).map((l) => [l.id, l.title]));
  const set = new Set(p?.learningDays ?? []);
  const MILES = [[50, '50-Day Learning Champion'], [100, '100-Day Life Skills Master']] as const;
  return (
    <div className="learn-surface">
      <PageHead kicker="Learn / progress" title="Your streak and badges" />
      <LearnTabs active="/learn/progress" />
      {isLoading && <ListSkeleton rows={4} />}
      <p className="mb-5 max-w-3xl text-sm text-muted-foreground">Submit every question in a lesson quiz or Daily 5 to complete a learning day. Reading alone does not count. Only one day is credited per Asia/Kolkata date. A missed day resets your current streak; your best streak and earned badges stay saved. Digital rewards have no monetary value.</p>
      {!state?.learner && !isLoading && (
        <EmptyState title="Register to track progress" body="Streaks, scores and badges are saved to your profile.">
          <button data-testid="button-progress-register" onClick={() => requireLearner()} className="rounded-xl bg-navy px-5 py-2.5 font-bold text-white">Register</button>
        </EmptyState>
      )}
      {state?.learner && prog.isLoading && <ListSkeleton rows={4} />}
      {prog.isError && <ErrorState message={errMsg(prog.error)} onRetry={() => void prog.refetch()} />}
      {p && (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-4">
            {[['Current streak', p.currentStreak + ' days'], ['Best streak', p.bestStreak + ' days'], ['Today', p.todayCompleted ? 'Done' : 'Open'], ['Timezone', p.timezone]].map(([k, v]) => (
              <div key={k} className="rounded-2xl border bg-card p-4" data-testid={`stat-${k.toLowerCase().replace(/\s/g, '-')}`}>
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{k}</p>
                <p className="font-display text-2xl font-extrabold text-navy">{v}</p>
              </div>
            ))}
          </div>
          <section aria-labelledby="cal-h">
            <h2 id="cal-h" className="mb-2 flex items-center gap-2 font-display text-2xl font-extrabold text-navy"><CalendarCheck className="h-5 w-5 text-teal" /> Last 28 days</h2>
            <ul className="grid grid-cols-7 gap-1.5 sm:max-w-md" data-testid="calendar">
              {lastDays(p.today, 28).map((d) => (
                <li key={d} aria-label={`${day(d)}: ${set.has(d) ? 'learned' : 'no learning'}${d === p.today ? ', today' : ''}`} className={`flex aspect-square items-center justify-center rounded-md text-[11px] font-mono ${set.has(d) ? 'bg-teal text-white' : 'bg-muted text-muted-foreground'} ${d === p.today ? 'ring-2 ring-amber' : ''}`}>{Number(d.slice(8))}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="mil-h">
            <h2 id="mil-h" className="mb-2 font-display text-2xl font-extrabold text-navy">Milestones</h2>
            <div className="space-y-3">
              {MILES.map(([n, t]) => {
                const count = p.achievements.some((a) => a.days === n) ? n : Math.min(p.currentStreak, n);
                const pct = (count / n) * 100;
                return (
                  <div key={n} data-testid={`milestone-${n}`}>
                    <div className="flex justify-between gap-2 text-sm font-semibold text-navy"><span>{t}</span><span className="whitespace-nowrap font-mono">{count} / {n}</span></div>
                    <div role="progressbar" aria-label={t} aria-valuemin={0} aria-valuemax={n} aria-valuenow={count} className="mt-1 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-amber" style={{ width: pct + '%' }} /></div>
                  </div>
                );
              })}
            </div>
          </section>
          <section aria-labelledby="badge-h">
            <h2 id="badge-h" className="mb-2 font-display text-2xl font-extrabold text-navy">Badge gallery</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {MILES.map(([n, t]) => {
                const a = p.achievements.find((x) => x.days === n);
                return (
                  <div key={n} data-testid={`badge-${n}`} className={`flex items-center gap-3 rounded-2xl border p-4 ${a ? 'bg-amber/10 ring-1 ring-amber/40' : 'bg-card'}`}>
                    {a ? <Award className="h-9 w-9 text-amber" /> : <Lock className="h-9 w-9 text-muted-foreground" />}
                    <div><p className="font-display font-bold text-navy">{a?.title ?? t}</p><p className="text-xs text-muted-foreground">{a ? `Awarded ${day(a.awardedAt)}` : 'Locked'}</p></div>
                  </div>
                );
              })}
            </div>
          </section>
          <section aria-labelledby="les-h">
            <h2 id="les-h" className="mb-2 font-display text-2xl font-extrabold text-navy">Lessons</h2>
            <p className="mb-3 text-sm text-muted-foreground">{p.lessons.length} of {lib.data?.length ?? 18} lesson quizzes completed. Any score counts; retakes can improve your best score.</p>
            {p.lessons.length === 0 ? <EmptyState title="No lessons completed" body="Finish a lesson quiz to see your best scores here."><Link href="/learn" className="font-semibold text-teal">Open library</Link></EmptyState> : (
              <ul className="divide-y rounded-2xl border bg-card">
                {p.lessons.map((c) => (
                  <li key={c.lessonId} data-testid={`row-lesson-${c.lessonId}`}>
                    <Link href={`/learn/lesson/${c.lessonId}`} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/50">
                      <span className="font-semibold text-navy">{titles.get(c.lessonId) ?? c.lessonId}</span>
                      <span className="font-mono text-xs text-muted-foreground">Best {c.bestScore} of {c.lastResult.total} / {c.attempts} tries</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {p.dailyResult && <p className="text-sm" data-testid="text-daily-saved">Latest daily: {p.dailyResult.score} of {p.dailyResult.total} on {day(p.dailyResult.day)}. <Link href="/learn/daily" className="font-semibold text-teal">View review</Link></p>}
        </div>
      )}
    </div>
  );
}
