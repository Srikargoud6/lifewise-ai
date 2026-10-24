import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { getGetLearnerQueryKey, getGetTracksQueryKey, useCreateScenario, useGetTracks, useStartSimulation, type Track } from '@workspace/api-client-react';
import { Clock, Compass, HeartPulse, Landmark, Loader2, Play, RotateCcw, Scale, Sparkles, TrendingUp, Wand2, type LucideIcon } from 'lucide-react';
import { useLearner } from '@/hooks/use-learner';
import { EmptyState, ErrorState, ListSkeleton, PageHead } from '@/components/bits';
import { errMsg, isComplete } from '@/lib/lw';

function trackIcon(t: Track): LucideIcon {
  const k = (t.name + ' ' + t.title).toLowerCase();
  if (/financ|bank|upi|money/.test(k)) return Landmark;
  if (/econom|inflat/.test(k)) return TrendingUp;
  if (/health|hospital|insur/.test(k)) return HeartPulse;
  if (/polit|civic|ward|rti/.test(k)) return Scale;
  if (/ethic|moral/.test(k)) return Compass;
  return Sparkles;
}
const TONES = [['#58cc02', '#43a102'], ['#1cb0f6', '#1899d6'], ['#8b5cf6', '#6a3fd0'], ['#e8741a', '#b95510'], ['#f0455a', '#c42a40']];

export default function Practice() {
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

  useEffect(() => { document.title = 'Practice | Lifewise Real-World Simulations'; }, []);

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
      <PageHead kicker="Practice" title="Make the call">Three decisions, real consequences, coaching in your language. Simulations show your own result and do not award XP.</PageHead>

      {sims.length > 0 && (
        <section className="mb-8" data-testid="section-your-flights">
          <h2 className="mb-3 text-2xl font-bold text-ink">Your simulations</h2>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {sims.map((s) => (
              <button key={s.id} data-testid={`card-flight-${s.id}`} onClick={() => setLoc('/simulation/' + s.id)} className="pane min-w-[14rem] p-4 text-left transition-transform active:translate-y-0.5">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase ${isComplete(s) ? 'bg-leaf/20 text-leaf-d' : 'bg-sun/30 text-sun-d'}`} data-testid="pill-status">{isComplete(s) ? 'completed' : 'step ' + (s.currentStep + 1) + ' of 3'}</span>
                <p className="mt-2 font-display text-lg font-bold text-ink">{s.trackTitle}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-black uppercase text-sky-d">{isComplete(s) ? 'View result' : 'Resume'} <RotateCcw className="h-3 w-3" /></p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section id="tracks">
        {err && <p role="alert" data-testid="text-home-error" className="mb-4 rounded-2xl bg-berry/10 p-3 text-sm font-bold text-berry-d">{err}</p>}
        {tracks.isLoading && <ListSkeleton rows={4} />}
        {tracks.isError && <ErrorState message={errMsg(tracks.error)} onRetry={() => void tracks.refetch()} />}
        {tracks.data && all.length === 0 && <EmptyState title="No simulations yet" body="The server returned none. Build your own below." />}
        <div className="grid gap-5 sm:grid-cols-2">
          {all.map((t, i) => {
            const Icon = trackIcon(t);
            const [c, cd] = TONES[i % TONES.length]!;
            const inProg = sims.find((s) => s.trackId === t.id && !isComplete(s));
            return (
              <article key={t.id} data-testid={`card-track-${t.id}`} style={{ animationDelay: i * 60 + 'ms' }} className="pane rise flex flex-col p-5">
                <div className="flex items-start justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ background: c, boxShadow: `0 4px 0 ${cd}` }}><Icon className="h-7 w-7" /></span>
                  <span className="flex items-center gap-1 text-xs font-black uppercase text-mute"><Clock className="h-3.5 w-3.5" />{t.duration} / {t.difficulty}</span>
                </div>
                <p className="mt-4 text-xs font-black uppercase tracking-widest" style={{ color: cd }}>{t.name}</p>
                <h3 className="text-2xl font-bold leading-tight text-ink">{t.title}</h3>
                <p className="mt-2 flex-1 text-sm text-mute">{t.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.skills.map((s) => <span key={s} className="rounded-full bg-line/60 px-2.5 py-0.5 text-xs font-bold text-ink">{s}</span>)}
                </div>
                <p className="mt-3 text-xs font-black text-mute">Measures: {t.impactLabel}</p>
                <button data-testid={`button-start-${t.id}`} disabled={busy !== null} onClick={() => inProg ? setLoc('/simulation/' + inProg.id) : begin(t.id)} className="chunk chunk-block mt-4" style={{ '--c': c, '--cd': cd, '--t': '#fff' } as React.CSSProperties}>
                  {busy === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {inProg ? 'Resume' : 'Start'}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="pane mt-10 bg-sky/10 p-6" style={{ borderColor: '#1cb0f6', boxShadow: '0 3px 0 #1899d6' }} data-testid="section-custom">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-sky-d"><Wand2 className="h-4 w-4" /> Custom scenario builder</div>
        <h2 className="mt-1 text-3xl font-bold text-ink">Practice a situation from your life</h2>
        <p className="mt-1 max-w-xl text-sm text-ink/80">Describe a challenge. AI turns it into a three-decision simulation with feedback.</p>
        <p className="mt-2 text-xs text-mute">An active AI connection is required. The preloaded tracks work without one. Do not include private or identifying information.</p>
        <form onSubmit={build} className="mt-4 flex flex-col gap-3">
          <textarea data-testid="input-scenario" aria-label="Describe your situation" rows={3} maxLength={1000} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="My landlord wants 6 months deposit in cash and no receipt..." className="rounded-2xl border-2 border-line bg-white p-3 font-semibold outline-none focus:border-sky" />
          <button data-testid="button-build-scenario" disabled={create.isPending} className="chunk chunk-ink self-end">
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Build and play
          </button>
        </form>
        {customErr && <p role="alert" className="mt-3 rounded-2xl bg-berry/10 p-3 text-sm font-bold text-berry-d">{customErr}</p>}
      </section>
    </div>
  );
}
