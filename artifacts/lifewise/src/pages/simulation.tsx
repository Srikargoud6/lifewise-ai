import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetCoachingVoicesQueryKey,
  getGetLearnerQueryKey,
  getGetSimulationQueryKey,
  useGetCoachingVoices,
  useGetSimulation,
  useMakeDecision,
  speakCoaching,
  useTranslateCoaching,
  type CoachingSpeechInputLanguage,
} from '@workspace/api-client-react';
import { Loader2, Square, Trophy, Volume2, X } from 'lucide-react';
import { useLearner } from '@/hooks/use-learner';
import { ErrorState, ListSkeleton, Meter } from '@/components/bits';
import { Skeleton } from '@/components/ui/skeleton';
import { LANGS, SPEECH_LANG, errMsg, fmt, isComplete } from '@/lib/lw';

function Coach({ text, simulationId, defaultLang }: { text: string; simulationId: string; defaultLang: string }) {
  const [lang, setLang] = useState<string>(defaultLang);
  const [cache, setCache] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [voiceErr, setVoiceErr] = useState<string | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const voicesQuery = useGetCoachingVoices({ query: { queryKey: getGetCoachingVoicesQueryKey(), staleTime: 5 * 60 * 1000, retry: false } });
  const voices = voicesQuery.data?.voices ?? [];
  const voiceId = voices.some((voice) => voice.id === selectedVoiceId) ? selectedVoiceId : voices[0]?.id;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const translate = useTranslateCoaching();
  const tRef = useRef(translate.mutateAsync);
  tRef.current = translate.mutateAsync;
  const key = lang + '::' + text;
  const shown = cache[key];
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  const load = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await tRef.current({ data: { text, language: lang as (typeof LANGS)[number] } });
      setCache((c) => ({ ...c, [lang + '::' + text]: r.text }));
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  }, [text, lang]);

  useEffect(() => {
    if (!cache[key]) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const releaseAudio = useCallback(() => {
    const player = audioRef.current;
    if (player) {
      player.pause();
      player.removeAttribute('src');
      player.load();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  useEffect(() => {
    releaseAudio();
    setVoiceErr(null);
    return releaseAudio;
  }, [key, releaseAudio]);

  function speakWithDevice(): boolean {
    if (!supported || !shown) return false;
    const u = new SpeechSynthesisUtterance(shown);
    u.lang = SPEECH_LANG[lang] ?? 'en-IN';
    const prefix = u.lang.split('-')[0];
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    if (voices.length && !match) setVoiceErr('This device has no ' + lang + ' voice installed. Audio may be silent or use a default voice.');
    if (match) u.voice = match;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = (ev) => { setSpeaking(false); setVoiceErr('Voice playback failed (' + ev.error + ').'); };
    window.speechSynthesis.speak(u);
    return true;
  }

  async function speak() {
    if (!shown || voiceBusy) return;
    setVoiceErr(null);
    releaseAudio();
    setVoiceBusy(true);
    try {
      if (!voiceId) {
        await voicesQuery.refetch();
        throw new Error('No ElevenLabs voices are available for this account.');
      }
      const audio = await speakCoaching(
        { simulationId, language: lang as CoachingSpeechInputLanguage, voiceId },
        { responseType: 'blob' },
      );
      const url = URL.createObjectURL(audio);
      audioUrlRef.current = url;
      const player = new Audio(url);
      audioRef.current = player;
      player.onended = () => {
        if (audioRef.current === player) {
          audioRef.current = null;
          if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
          setSpeaking(false);
        }
      };
      player.onerror = () => setVoiceErr('ElevenLabs audio could not be played on this device.');
      await player.play();
      setSpeaking(true);
    } catch (e) {
      releaseAudio();
      const started = speakWithDevice();
      setVoiceErr(started
        ? 'ElevenLabs voice is unavailable; playing your device voice instead.'
        : 'Voice playback is unavailable. Check the connection and try again.');
    } finally {
      setVoiceBusy(false);
    }
  }

  function stop() { releaseAudio(); }

  return (
    <div className="mt-4 rounded-xl bg-sky/10 rounded-2xl p-4" data-testid="panel-coach">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {LANGS.map((l) => (
          <button key={l} data-testid={`button-coach-lang-${l}`} onClick={() => setLang(l)} className={`rounded-full px-3 py-1 text-xs font-semibold ${l === lang ? 'bg-sky text-white' : 'bg-white ring-2 ring-line'}`}>{l}</button>
        ))}
      </div>
      {busy && !shown && <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div>}
      {shown && <p data-testid="text-coaching" lang={SPEECH_LANG[lang]} className="text-base leading-relaxed text-ink">{shown}</p>}
      {err && (
        <p role="alert" className="text-sm text-berry-d">{err} <button className="font-semibold underline" onClick={() => void load()}>Retry</button></p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {speaking ? (
          <button data-testid="button-voice-stop" onClick={stop} className="flex items-center gap-2 chunk chunk-berry !py-2"><Square className="h-4 w-4" /> Stop</button>
        ) : (
          <button data-testid="button-voice-listen" disabled={!shown || voiceBusy} onClick={() => void speak()} className="chunk chunk-ink !py-2">
            {voiceBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
            {voiceBusy ? 'Preparing voice…' : 'Listen to voice coach'}
          </button>
        )}
        <label className="flex items-center gap-2 text-xs text-mute">
          Voice
          <select aria-label="ElevenLabs voice" value={voiceId ?? ''} disabled={voicesQuery.isLoading || voices.length === 0 || voiceBusy} onChange={(e) => setSelectedVoiceId(e.target.value)} className="max-w-44 rounded-lg border bg-white px-2 py-1 text-foreground">
            {voices.length === 0 && <option value="">{voicesQuery.isLoading ? 'Loading…' : 'Device voice fallback'}</option>}
            {voices.map((voice) => <option key={voice.id} value={voice.id}>{voice.name}</option>)}
          </select>
        </label>
        {voiceErr && <p role="alert" data-testid="text-voice-error" className="text-xs text-berry-d">{voiceErr}</p>}
      </div>
      <p className="mt-2 text-xs text-mute">AI-generated audio may use your ElevenLabs account credits. If unavailable, your device voice is used.</p>
    </div>
  );
}

export default function SimulationPage() {
  const { id = '' } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { state } = useLearner();
  const decide = useMakeDecision();
  const simQ = useGetSimulation(id, { query: {
    queryKey: getGetSimulationQueryKey(id),
    refetchInterval: decide.isPending ? false : 5000,
    retry: (failureCount, error) => failureCount < 2 && error instanceof TypeError,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  } });
  const sim = simQ.data;
  const done = isComplete(sim);
  const [decErr, setDecErr] = useState<string | null>(null);

  async function choose(choiceId: string) {
    if (!sim || decide.isPending || simQ.isError) return;
    setDecErr(null);
    try {
      // A polling response for the old step must not overwrite the saved answer.
      await qc.cancelQueries({ queryKey: getGetSimulationQueryKey(id) });
      const next = await decide.mutateAsync({ id, data: { step: sim.currentStep, choiceId } });
      qc.setQueryData(getGetSimulationQueryKey(id), next);
      await qc.invalidateQueries({ queryKey: getGetLearnerQueryKey() });
    } catch (e) {
      setDecErr(errMsg(e));
      void simQ.refetch();
    }
  }

  if (simQ.isLoading && !sim) return <ListSkeleton rows={3} />;
  // A background network failure must not unmount an existing simulation.
  if (!sim) return <ErrorState message={errMsg(simQ.error)} onRetry={() => void simQ.refetch()} />;

  const step = sim.track.steps[sim.currentStep];
  const lang = state?.learner?.language ?? 'English';

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {simQ.isError && (
        <div role="status" data-testid="banner-simulation-connection" className="pane border-sun bg-sun/20 p-4 text-sm">
          <p className="font-black text-ink">Connection interrupted</p>
          <p className="mt-1">Showing your last saved progress. Reconnect before choosing your next answer.</p>
          <button data-testid="button-simulation-reconnect" disabled={simQ.isFetching} onClick={() => void simQ.refetch()} className="chunk chunk-ink mt-3 !py-2">{simQ.isFetching ? 'Reconnecting…' : 'Reconnect'}</button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <Link href="/practice" aria-label="Leave simulation. Progress is saved." data-testid="link-leave-simulation" className="rounded-xl p-2 text-mute hover:bg-line/60"><X className="h-7 w-7" /></Link>
        <div className="flex flex-1 gap-1.5" role="progressbar" aria-label="Simulation progress" aria-valuemin={0} aria-valuemax={3} aria-valuenow={done ? 3 : sim.currentStep}>
          {[0, 1, 2].map((i) => <span key={i} className={`h-4 flex-1 rounded-full transition-colors ${i < sim.currentStep || done ? 'bg-leaf' : i === sim.currentStep ? 'bg-sun' : 'bg-line'}`} />)}
        </div>
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-sky-d">{done ? 'Simulation complete' : 'Decision ' + (sim.currentStep + 1) + ' of 3'}</p>
        <h1 data-testid="text-sim-title" className="text-3xl font-bold leading-tight text-ink">{sim.trackTitle}</h1>
      </div>

      {sim.feedback && sim.choices.length > 0 && (
        <section data-testid="section-feedback" className="pane rise p-5">
          <p className="text-xs font-black uppercase tracking-widest text-grape">Why this matters in the real world</p>
          <p data-testid="text-feedback" className="mt-1 font-bold text-ink">{sim.feedback}</p>
          <Coach text={sim.feedback} simulationId={sim.id} defaultLang={lang} />
        </section>
      )}

      {!done && step && (
        <section className="rise" key={sim.currentStep}>
          <h2 className="text-2xl font-bold text-ink">{step.title}</h2>
          <p data-testid="text-situation" className="mt-2 text-base leading-relaxed text-ink/85">{step.situation}</p>
          <div className="mt-5 space-y-3">
            {step.choices.map((c, i) => (
              <button key={c.id} data-testid={`button-choice-${c.id}`} disabled={decide.isPending || simQ.isError} onClick={() => void choose(c.id)} className="flex w-full items-start gap-3 rounded-2xl border-2 border-line bg-white p-4 text-left transition-all hover:border-sky hover:bg-sky/5 active:translate-y-0.5 disabled:opacity-60" style={{ boxShadow: '0 3px 0 #eadfc8' }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-line text-sm font-black text-mute">{String.fromCharCode(65 + i)}</span>
                <span className="pt-0.5 text-base font-bold text-ink">{c.text}</span>
                {decide.isPending && decide.variables?.data.choiceId === c.id && <Loader2 className="ml-auto h-5 w-5 animate-spin" />}
              </button>
            ))}
          </div>
          {decErr && <p role="alert" data-testid="text-decision-error" className="mt-3 text-sm font-bold text-berry-d">{decErr}</p>}
        </section>
      )}

      {done && (
        <section data-testid="card-iq" className="pane rise overflow-hidden text-center">
          <div className="bg-leaf p-6 text-white">
            <Trophy className="pop mx-auto h-14 w-14" />
            <h2 className="text-3xl font-bold">Simulation complete</h2>
            <p className="font-bold text-white/90">{state?.learner?.name ?? 'Learner'} / {sim.trackTitle}</p>
          </div>
          <div className="grid gap-4 p-5 text-left sm:grid-cols-3">
            <div data-testid="meter-impact">
              <span className="text-xs font-black uppercase tracking-widest text-mute">Real-world impact</span>
              <p className="text-3xl font-bold tabular-nums text-ink">{sim.impact.toLocaleString('en-IN')}</p>
              <p className="text-xs font-bold text-mute">{sim.impactLabel}</p>
            </div>
            <Meter label="Mastery" value={sim.mastery} color="#58cc02" />
            <Meter label="Confidence" value={sim.confidence} color="#1cb0f6" />
          </div>
          <p className="pb-3 text-xs font-bold text-mute">Completed {fmt(sim.completedAt)}. Simulations do not award XP.</p>
          <div className="flex flex-col gap-3 border-t-2 border-line p-4 sm:flex-row sm:justify-center">
            <Link href="/practice" data-testid="link-more-practice" className="chunk chunk-sky">More practice</Link>
            <Link href="/learn" data-testid="link-keep-learning" className="chunk chunk-green">Keep learning</Link>
          </div>
        </section>
      )}
    </div>
  );
}
