import { useMemo } from 'react';
import { Link, useParams } from 'wouter';
import { useGetLearningLibrary, type LearningLesson } from '@workspace/api-client-react';
import { ArrowLeft, Building2, Check, ChevronRight, HeartPulse, Landmark, Scale, TrendingUp, Vote, type LucideIcon } from 'lucide-react';
import { useProgress } from '@/hooks/use-progress';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/bits';
import { QuestRail } from '@/components/rail';
import { errMsg } from '@/lib/lw';
import { useLearningTitle as useDocTitle } from '@/hooks/use-learning-title';

const SUBJECTS: { slug: string; name: string; icon: LucideIcon; c: string; cd: string; blurb: string }[] = [
  { slug: 'finance', name: 'Finance', icon: Landmark, c: '#58cc02', cd: '#43a102', blurb: 'Money, UPI, tax and scams' },
  { slug: 'economy', name: 'Economy', icon: TrendingUp, c: '#1cb0f6', cd: '#1899d6', blurb: 'Prices, jobs and growth' },
  { slug: 'health', name: 'Health', icon: HeartPulse, c: '#f0455a', cd: '#c42a40', blurb: 'Body, mind and insurance' },
  { slug: 'politics', name: 'Politics', icon: Vote, c: '#8b5cf6', cd: '#6a3fd0', blurb: 'Votes, parties and power' },
  { slug: 'government', name: 'Government', icon: Building2, c: '#e8741a', cd: '#b95510', blurb: 'Rights, schemes and offices' },
  { slug: 'ethics', name: 'Ethics', icon: Scale, c: '#14a39a', cd: '#0c7d76', blurb: 'Choices when nobody is looking' },
];

export const subjectHref = (name: string) => `/learn/track/${name.toLowerCase()}`;

function useData() {
  const lib = useGetLearningLibrary();
  const prog = useProgress();
  const best = useMemo(() => new Map((prog.data?.lessons ?? []).map((l) => [l.lessonId, l])), [prog.data]);
  return { lib, best };
}

export function LearnHome() {
  useDocTitle('Learn | Lifewise Free Life-Skills Lessons');
  const { lib, best } = useData();
  const lessons: LearningLesson[] = lib.data ?? [];
  return (
    <div>
      <h1 className="text-3xl font-bold text-ink sm:text-4xl">Pick a subject</h1>
      <p className="mb-5 text-sm font-bold text-mute">Six subjects, three lessons each. Lessons are in English.</p>
      {lib.isLoading && <ListSkeleton rows={4} />}
      {lib.isError && <ErrorState message={errMsg(lib.error)} onRetry={() => void lib.refetch()} />}
      {lib.data && lessons.length === 0 && <EmptyState title="No lessons yet" body="The library returned nothing. Try again shortly." />}
      {lib.data && lessons.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {SUBJECTS.map((s, i) => {
            const ls = lessons.filter((l) => l.subject === s.name);
            const done = ls.filter((l) => best.has(l.id)).length;
            return (
              <Link key={s.slug} href={`/learn/track/${s.slug}`} data-testid={`card-track-${s.slug}`} aria-label={`${s.name}, ${done} of ${ls.length} lessons done`}
                className="rise group flex min-h-[10.5rem] flex-col justify-between gap-3 rounded-3xl p-4 text-white transition-transform duration-150 hover:-translate-y-1 focus-visible:-translate-y-1 sm:p-5"
                style={{ background: s.c, boxShadow: `0 5px 0 ${s.cd}`, animationDelay: i * 40 + 'ms' }}>
                <div className="flex flex-col-reverse items-start gap-2 lg:flex-row lg:justify-between">
                  <h2 className="text-xl font-bold sm:text-2xl xl:text-3xl">{s.name}</h2>
                  <s.icon className="h-8 w-8 shrink-0 text-white/85 transition-transform duration-150 group-hover:scale-110 lg:h-11 lg:w-11" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-bold text-white/90">{s.blurb}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/30"><div className="h-full rounded-full bg-white" style={{ width: ls.length ? `${(done / ls.length) * 100}%` : 0 }} /></div>
                    <span className="text-xs font-black uppercase tracking-wider">{done}/{ls.length}</span>
                    <ChevronRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <div className="mt-6"><QuestRail /></div>
    </div>
  );
}

export function TrackPage() {
  const { subject } = useParams<{ subject: string }>();
  const s = SUBJECTS.find((x) => x.slug === (subject ?? '').toLowerCase());
  useDocTitle(s ? `${s.name} | Lifewise Learn` : 'Subject | Lifewise Learn');
  const { lib, best } = useData();
  const back = (
    <Link href="/learn" data-testid="link-back-tracks" className="mb-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black uppercase tracking-wider text-sky-d transition-colors hover:bg-sky/10">
      <ArrowLeft className="h-5 w-5" /> All subjects
    </Link>
  );
  if (!s) {
    return (
      <div>{back}<EmptyState title="Subject not found" body="Pick one of the six subjects: Finance, Economy, Health, Politics, Government or Ethics."><Link href="/learn" className="chunk chunk-green">Back to subjects</Link></EmptyState></div>
    );
  }
  const ls = (lib.data ?? []).filter((l) => l.subject === s.name);
  const done = ls.filter((l) => best.has(l.id)).length;
  return (
    <div>
      {back}
      <div className="flex items-center justify-between gap-3 rounded-3xl p-5 text-white sm:p-7" style={{ background: s.c, boxShadow: `0 5px 0 ${s.cd}` }}>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-white/80" data-testid="text-track-progress">{done} of {ls.length} done</p>
          <h1 className="text-4xl font-bold sm:text-5xl">{s.name}</h1>
          <p className="text-sm font-bold text-white/90">{s.blurb}</p>
        </div>
        <s.icon className="h-14 w-14 shrink-0 text-white/80" aria-hidden />
      </div>
      {lib.isLoading && <div className="mt-5"><ListSkeleton rows={3} /></div>}
      {lib.isError && <div className="mt-5"><ErrorState message={errMsg(lib.error)} onRetry={() => void lib.refetch()} /></div>}
      {lib.data && ls.length === 0 && <div className="mt-5"><EmptyState title="No lessons here yet" body="This subject has no lessons right now." /></div>}
      <ol className="mt-5 grid gap-4 md:grid-cols-3">
        {ls.map((l, i) => {
          const b = best.get(l.id);
          return (
            <li key={l.id} className="rise" style={{ animationDelay: i * 50 + 'ms' }}>
              <Link href={`/learn/lesson/${l.id}`} data-testid={`card-lesson-${l.id}`} aria-label={`${l.title}. ${b ? `Best ${b.bestScore} of ${l.questions.length}` : 'Not attempted'}`}
                className="pane group flex h-full flex-col gap-3 p-5 transition-transform duration-150 hover:-translate-y-1 focus-visible:-translate-y-1">
                <span className="flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: b ? '#ffc21a' : s.c, boxShadow: `0 5px 0 ${b ? '#d99a00' : s.cd}` }}>
                  {b ? <Check className="h-7 w-7 text-ink" strokeWidth={3.5} /> : <s.icon className="h-7 w-7" />}
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-mute">Lesson {i + 1}</span>
                <span className="text-xl font-bold leading-tight text-ink">{l.title}</span>
                <span className="mt-auto text-sm font-bold text-mute">{b ? `Best ${b.bestScore}/${l.questions.length} / ${b.attempts} ${b.attempts === 1 ? 'try' : 'tries'}` : 'Start'}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
