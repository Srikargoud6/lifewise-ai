import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetLearnerQueryKey,
  getGetTracksQueryKey,
  useCreateScenario,
  useGetTracks,
  useStartSimulation,
  type Track,
} from '@workspace/api-client-react';
import { ArrowRight, Clock, Compass, HeartPulse, Landmark, Loader2, Play, RotateCcw, Scale, Sparkles, TrendingUp, Wand2 } from 'lucide-react';
import { useLearner } from '@/hooks/use-learner';
import { EmptyState, ErrorState, ListSkeleton, Meter, StatusPill } from '@/components/bits';
import { errMsg, isComplete } from '@/lib/lw';

function trackIcon(t: Track) {
  const k = (t.name + ' ' + t.title).toLowerCase();
  if (/financ|bank|upi|money/.test(k)) return Landmark;
  if (/econom|inflat/.test(k)) return TrendingUp;
  if (/health|hospital|insur/.test(k)) return HeartPulse;
  if (/polit|civic|ward|rti/.test(k)) return Scale;
  if (/ethic|moral/.test(k)) return Compass;
  return Sparkles;
}
const TONES = ['border-t-teal', 'border-t-amber', 'border-t-navy'];

export default function Home() {
  const [, setLoc] = useLocation();
  const qc = useQueryClient();
  const tracks = useGetTracks({ query: { queryKey: getGetTracksQueryKey() } });
  const { state, requireLearner } = useLearner();
  const start = useStartSimulation();
  const create = useCreateScenario();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [custom, setCustom] = useState<Track[]>([]);
  const [customErr, setCustomErr] = useState<string | null>(null);
  const startRef = useRef<(id: string) => Promise<void>>(async () => {});

  startRef.current = async (trackId: string) => {
    setErr(null);
    setBusy(trackId);
    try {
      const sim = await start.mutateAsync({ data: { trackId } });
      await qc.invalidateQueries({ queryKey: getGetLearnerQueryKey() });
      setLoc('/simulation/' + sim.id);
    } catch (e) {
      setErr(errMsg(e));
      setBusy(null);
    }
  };
  const begin = (trackId: string) => requireLearner(() => void startRef.current(trackId));

  useEffect(() => {
    document.title = 'Lifewise AI | Learn and Practice Real-World Skills';
  }, []);

  async function build(e: React.FormEvent) {
    e.preventDefault();
    const dilemma = prompt.trim();
    if (dilemma.length < 10) return setCustomErr('Describe your dilemma in at least 10 characters.');
    setCustomErr(null);
    requireLearner(() => {
      void (async () => {
        try {
          const t = await create.mutateAsync({ data: { prompt: dilemma } });
          setCustom((c) => [t, ...c]);
          setPrompt('');
          await startRef.current(t.id);
        } catch (e2) {
          setCustomErr(errMsg(e2));
        }
      })();
    });
  }

  const sims = state?.simulations ?? [];
  const savedCustom = [...new Map([...custom, ...sims.filter((s) => s.trackId.startsWith('custom_')).map((s) => s.track)].map((t) => [t.id, t])).values()];
  const all = [...(tracks.data ?? []), ...savedCustom];

  return (
    <div>
      <section className="rise relative -mx-4 -mt-8 mb-10 overflow-hidden bg-navy px-4 pb-12 pt-10 text-white sm:mx-0 sm:mt-0 sm:rounded-3xl sm:px-10 sm:pt-14">
        <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-teal/40" />
        <div aria-hidden className="absolute -right-10 -top-10 h-44 w-44 rounded-full border border-amber/40" />
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal">Lessons, quizzes, and real-world practice</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl font-extrabold leading-[0.95] sm:text-7xl">
          Learn for life.<br /><span className="text-amber">Decide with confidence.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-white/75 sm:text-lg">
          Understand finance, the economy, health, politics, government, and ethics through bite-sized lessons, daily quizzes, and practical simulations. Build your streak, track your progress, and earn milestone badges as you learn.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#tracks" data-testid="link-start-tracks" className="inline-flex items-center gap-2 rounded-xl bg-amber px-5 py-3 font-bold text-white transition-transform hover:-translate-y-0.5">
            Explore simulations <ArrowRight className="h-4 w-4" />
          </a>
          {!state?.learner && (
            <button data-testid="button-hero-register" onClick={() => requireLearner()} className="rounded-xl border border-white/30 px-5 py-3 font-semibold hover:bg-white/10">
              Create your learning profile
            </button>
          )}
        </div>
        <div className="mt-10 grid max-w-2xl gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 sm:grid-cols-3" aria-label="Example simulation scores">
          <Meter label="Impact" value={70} tone="amber" suffix="" />
          <Meter label="Mastery" value={45} tone="teal" />
          <Meter label="Confidence" value={60} tone="navy" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/40 sm:col-span-3">Example scores. Complete a simulation to see your own results.</p>
        </div>
      </section>

      {sims.length > 0 && (
        <section className="mb-10" data-testid="section-your-flights">
          <h2 className="mb-3 font-display text-2xl font-extrabold text-navy">Your simulations</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {sims.map((s) => (
              <button key={s.id} data-testid={`card-flight-${s.id}`} onClick={() => setLoc('/simulation/' + s.id)} className="min-w-[15rem] rounded-xl border bg-card p-4 text-left transition-shadow hover:shadow-lg">
                <StatusPill status={isComplete(s) ? 'completed' : 'step ' + (s.currentStep + 1) + ' of 3'} />
                <p className="mt-2 font-display font-bold text-navy">{s.trackTitle}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-teal">
                  {isComplete(s) ? 'View result' : 'Resume'} <RotateCcw className="h-3 w-3" />
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section id="tracks" className="scroll-mt-24">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-display text-3xl font-extrabold text-navy">Practice real-world decisions</h2>
          <span className="font-mono text-xs text-muted-foreground">3 decisions each</span>
        </div>
        {err && <p role="alert" data-testid="text-home-error" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{err}</p>}
        {tracks.isLoading && <ListSkeleton rows={4} />}
        {tracks.isError && <ErrorState message={errMsg(tracks.error)} onRetry={() => void tracks.refetch()} />}
        {tracks.data && all.length === 0 && <EmptyState title="No tracks yet" body="The server returned no simulations. Build your own below." />}
        <div className="grid gap-5 md:grid-cols-6">
          {all.map((t, i) => {
            const Icon = trackIcon(t);
            const wide = i % 5 === 0 || i % 5 === 3;
            const inProg = sims.find((s) => s.trackId === t.id && !isComplete(s));
            return (
              <article key={t.id} data-testid={`card-track-${t.id}`} style={{ animationDelay: i * 70 + 'ms' }} className={`rise flex flex-col rounded-2xl border border-t-4 bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${TONES[i % 3]} ${wide ? 'md:col-span-4' : 'md:col-span-2'}`}>
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-amber"><Icon className="h-5 w-5" /></span>
                  <span className="flex items-center gap-1 font-mono text-[11px] uppercase text-muted-foreground"><Clock className="h-3 w-3" />{t.duration} / {t.difficulty}</span>
                </div>
                <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-teal">{t.name}</p>
                <h3 className="font-display text-2xl font-extrabold leading-tight text-navy">{t.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{t.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.skills.map((s) => <span key={s} className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{s}</span>)}
                </div>
                <p className="mt-3 text-xs font-semibold text-amber">Measures: {t.impactLabel}</p>
                <button data-testid={`button-start-${t.id}`} disabled={busy !== null} onClick={() => inProg ? setLoc('/simulation/' + inProg.id) : begin(t.id)} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 font-bold text-white transition-transform active:scale-[.98] disabled:opacity-60">
                  {busy === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {inProg ? 'Resume simulation' : 'Start simulation'}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-12 rounded-3xl bg-amber/10 p-6 ring-1 ring-amber/30 sm:p-8" data-testid="section-custom">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-amber"><Wand2 className="h-4 w-4" /> Custom scenario builder</div>
        <h2 className="mt-1 font-display text-3xl font-extrabold text-navy">Practice a situation from your life</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">Describe a challenge. AI turns it into a three-decision simulation with feedback to help you think through your choices.</p>
        <p className="mt-2 text-xs text-muted-foreground">An active AI connection is required. The five preloaded tracks work without one. Do not include private or identifying information.</p>
        <form onSubmit={build} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <textarea data-testid="input-scenario" rows={3} maxLength={1000} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="My landlord wants 6 months deposit in cash and no receipt..." className="flex-1 rounded-xl border border-input bg-card p-3 outline-none focus:border-teal focus:ring-2 focus:ring-teal/30" />
          <button data-testid="button-build-scenario" disabled={create.isPending} className="flex items-center justify-center gap-2 self-stretch rounded-xl bg-amber px-6 py-3 font-bold text-white disabled:opacity-60 sm:self-end">
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Build and play
          </button>
        </form>
        {customErr && <p role="alert" className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{customErr}</p>}
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-3">
        {[['01', 'Learn the essentials', 'Explore lessons in finance, the economy, health, politics, government, and ethics.'], ['02', 'Put knowledge into practice', 'Test your choices in simulations and get feedback in your preferred language.'], ['03', 'Keep making progress', 'Take daily quizzes, build your streak, and unlock badges at 50 and 100 days.']].map(([n, h, b]) => (
          <div key={n} className="border-l-4 border-teal pl-4">
            <span className="font-mono text-sm text-teal">{n}</span>
            <h3 className="font-display text-xl font-bold text-navy">{h}</h3>
            <p className="text-sm text-muted-foreground">{b}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
