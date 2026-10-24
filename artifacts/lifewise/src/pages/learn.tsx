import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetLearnerQueryKey,
  getGetDailyChallengeQueryKey,
  useGetDailyChallenge,
  useGetLearningLibrary,
  useStartSimulation,
  type LearningLesson,
} from '@workspace/api-client-react';
import { ExternalLink, Languages, Loader2, Play, X } from 'lucide-react';
import { useLearner } from '@/hooks/use-learner';
import { useProgress } from '@/hooks/use-progress';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/bits';
import { subjectHref } from '@/pages/learn-tracks';
import { Quiz, day } from '@/components/quiz';
import { errMsg } from '@/lib/lw';
import { useLearningTitle as useTitle } from '@/hooks/use-learning-title';

function EnglishNote() {
  return (
    <p className="flex items-center gap-2 text-xs font-bold text-mute" data-testid="text-english-note">
      <Languages className="h-4 w-4 text-sky" /> Lessons are in English. Your simulation coaching language is unchanged.
    </p>
  );
}

function Block({ h, tone, children }: { h: string; tone?: string; children: ReactNode }) {
  return <section className={`pane mt-4 p-5 ${tone ?? ''}`}><h2 className="mb-2 text-xl font-bold text-ink">{h}</h2>{children}</section>;
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
    <div className="pane mt-4 p-5" data-testid="section-practice">
      <p className="text-xs font-black uppercase tracking-widest text-grape">Try it for real</p>
      <p className="mt-1 text-mute">Try this idea in a three-decision simulation. Simulations do not award XP.</p>
      <button data-testid="button-start-simulation" disabled={busy} onClick={() => requireLearner(() => void ref.current())} className="chunk chunk-sky mt-3">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Practice in a simulation
      </button>
      {err && <p role="alert" className="mt-2 text-sm font-bold text-berry-d">{err}</p>}
    </div>
  );
}

function CloseBar({ label, href = '/learn', testid = 'link-back-library' }: { label: string; href?: string; testid?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <Link href={href} data-testid={testid} aria-label="Back to lessons" className="rounded-xl p-2 text-mute hover:bg-line/60"><X className="h-7 w-7" /></Link>
      <span className="text-xs font-black uppercase tracking-widest text-mute">{label}</span>
    </div>
  );
}

export function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const lib = useGetLearningLibrary();
  const prog = useProgress();
  const lesson = lib.data?.find((l) => l.id === id);
  const [started, setStarted] = useState(false);
  useTitle(lesson ? `${lesson.title} | Lifewise Lesson` : 'Lesson | Lifewise Learn');
  const saved = prog.data?.lessons.find((c) => c.lessonId === id)?.lastResult;
  const showQuiz = started || !!saved;
  return (
    <div className="mx-auto max-w-2xl">
      <CloseBar label={lesson?.subject ?? 'Lesson'} href={lesson ? subjectHref(lesson.subject) : '/learn'} />
      {lib.isLoading && <ListSkeleton rows={4} />}
      {lib.isError && <ErrorState message={errMsg(lib.error)} onRetry={() => void lib.refetch()} />}
      {lib.data && !lesson && <EmptyState title="Lesson not found" body="This lesson does not exist in the library."><Link href="/learn" className="chunk chunk-green">Back to lessons</Link></EmptyState>}
      {lesson && (
        <article>
          {showQuiz ? (
            <>
              <h1 className="mb-4 text-3xl font-bold text-ink" data-testid="text-lesson-title">{lesson.title}</h1>
              <Quiz key={lesson.id} kind="lesson" sourceId={lesson.id} questions={lesson.questions} saved={saved} footer={<Link href={subjectHref(lesson.subject)} className="chunk chunk-green">Continue</Link>} />
              <Practice l={lesson} />
              <button onClick={() => setStarted(false)} className="mt-6 text-sm font-black uppercase text-sky-d underline" data-testid="button-reread">Read the lesson again</button>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold leading-tight text-ink sm:text-5xl" data-testid="text-lesson-title">{lesson.title}</h1>
              <div className="mt-2"><EnglishNote /></div>
              <div lang="en" className="text-base leading-relaxed">
                <Block h="Your goal" tone="!border-sky bg-sky/10"><p>{lesson.goal}</p></Block>
                <Block h="The idea">{lesson.explanation.map((p, i) => <p key={i} className="mb-3 last:mb-0">{p}</p>)}</Block>
                <Block h="An Indian example" tone="bg-sun/20"><p>{lesson.example}</p></Block>
                <Block h="Takeaways"><ul className="list-disc space-y-1 pl-5">{lesson.takeaways.map((t, i) => <li key={i}>{t}</li>)}</ul></Block>
                <Block h="Next step"><p>{lesson.nextStep}</p></Block>
                <Block h="Keep in mind"><p className="text-sm text-mute" data-testid="text-caveat">{lesson.caveat}</p></Block>
                <Block h="References">
                  <ul className="space-y-1 text-sm">{lesson.references.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-sky-d underline">{r.title}<ExternalLink className="h-3 w-3" /></a></li>)}</ul>
                  <p className="mt-2 text-xs font-bold text-mute" data-testid="text-reviewed">Reviewed on {day(lesson.reviewedOn)}</p>
                </Block>
              </div>
              <div className="sticky bottom-20 mt-6 lg:bottom-4">
                <button data-testid="button-start-quiz" onClick={() => { setStarted(true); window.scrollTo({ top: 0 }); }} className="chunk chunk-green chunk-block !py-4 !text-base">Start quiz</button>
              </div>
            </>
          )}
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
    <div className="mx-auto max-w-2xl">
      <CloseBar label="Daily 5" />
      {q.isLoading && <ListSkeleton rows={4} />}
      {q.isError && <ErrorState message={errMsg(q.error)} onRetry={() => void q.refetch()} />}
      {d && (
        <>
          <p className="mb-1 text-xs font-black uppercase tracking-widest text-mute" data-testid="text-daily-day">{day(d.day)} / {d.timezone}</p>
          <p className="mb-5 text-sm text-mute">Five questions from different subjects. Finish all five to credit a learning day, whatever your score.</p>
          {d.questions.length === 0 ? <EmptyState title="No questions today" body="Check back soon." /> : <Quiz key={d.id} kind="daily" sourceId={d.id} questions={d.questions} saved={saved} footer={<Link href="/learn" className="chunk chunk-green">Continue</Link>} />}
        </>
      )}
    </div>
  );
}
