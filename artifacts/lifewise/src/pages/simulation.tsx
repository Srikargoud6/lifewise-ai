import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import QRCode from 'qrcode';
import {
  getGetAgentRunsQueryKey,
  getGetApprovalsQueryKey,
  getGetCoachingVoicesQueryKey,
  getGetLearnerQueryKey,
  getGetProofQueryKey,
  getGetSimulationQueryKey,
  useGetCoachingVoices,
  useCreatePayment,
  useGetAgentRuns,
  useGetProof,
  useGetSimulation,
  useMakeDecision,
  useRunAgent,
  speakCoaching,
  useTranslateCoaching,
  useVerifyPayment,
  type AgentRun,
  type Payment,
  type Simulation,
  type CoachingSpeechInputLanguage,
} from '@workspace/api-client-react';
import { AlertTriangle, Award, BadgeCheck, Download, Hourglass, Loader2, Printer, Square, Volume2, XCircle } from 'lucide-react';
import { useLearner } from '@/hooks/use-learner';
import { ErrorState, ListSkeleton, Meter } from '@/components/bits';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LANGS, SPEECH_LANG, download, errMsg, fmt, isApproved, isComplete, isRejected } from '@/lib/lw';

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
    <div className="mt-4 rounded-xl bg-navy/5 p-4" data-testid="panel-coach">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {LANGS.map((l) => (
          <button key={l} data-testid={`button-coach-lang-${l}`} onClick={() => setLang(l)} className={`rounded-full px-3 py-1 text-xs font-semibold ${l === lang ? 'bg-teal text-white' : 'bg-card ring-1 ring-input'}`}>{l}</button>
        ))}
      </div>
      {busy && !shown && <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div>}
      {shown && <p data-testid="text-coaching" lang={SPEECH_LANG[lang]} className="text-base leading-relaxed text-navy">{shown}</p>}
      {err && (
        <p role="alert" className="text-sm text-destructive">{err} <button className="font-semibold underline" onClick={() => void load()}>Retry</button></p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {speaking ? (
          <button data-testid="button-voice-stop" onClick={stop} className="flex items-center gap-2 rounded-lg bg-amber px-4 py-2 text-sm font-bold text-white"><Square className="h-4 w-4" /> Stop</button>
        ) : (
          <button data-testid="button-voice-listen" disabled={!shown || voiceBusy} onClick={() => void speak()} className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {voiceBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
            {voiceBusy ? 'Preparing voice…' : 'Listen to voice coach'}
          </button>
        )}
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Voice
          <select aria-label="ElevenLabs voice" value={voiceId ?? ''} disabled={voicesQuery.isLoading || voices.length === 0 || voiceBusy} onChange={(e) => setSelectedVoiceId(e.target.value)} className="max-w-44 rounded-md border bg-card px-2 py-1 text-foreground">
            {voices.length === 0 && <option value="">{voicesQuery.isLoading ? 'Loading…' : 'Device voice fallback'}</option>}
            {voices.map((voice) => <option key={voice.id} value={voice.id}>{voice.name}</option>)}
          </select>
        </label>
        {voiceErr && <p role="alert" data-testid="text-voice-error" className="text-xs text-destructive">{voiceErr}</p>}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">AI-generated audio may use your ElevenLabs account credits. If unavailable, your device voice is used.</p>
    </div>
  );
}

function kitText(sim: Simulation, run: AgentRun) {
  return ['LIFEWISE SURVIVAL ACTION KIT', sim.trackTitle, 'Mentor-approved (demo review): ' + fmt(run.approvedAt), run.mentorNote ? 'Mentor note: ' + run.mentorNote : '', '', ...run.actions.map((a, i) => (i + 1) + '. ' + a), '', 'Mastery ' + sim.mastery + '/100, Confidence ' + sim.confidence + '/100'].filter((l, i) => l !== '' || i > 0).join('\n');
}

function PaymentPanel({ sim, run, paid, onPaid }: { sim: Simulation; run: AgentRun; paid: boolean; onPaid: () => void }) {
  const create = useCreatePayment();
  const verify = useVerifyPayment();
  const qc = useQueryClient();
  const [order, setOrder] = useState<Payment | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  async function open() {
    setErr(null);
    try {
      const p = await create.mutateAsync({ data: { simulationId: sim.id } });
      setOrder(p);
      setQr(await QRCode.toDataURL(p.upiIntent, { margin: 1, width: 220, color: { dark: '#0F2942', light: '#FBF8F1' } }));
      setCheckoutOpen(true);
    } catch (e) { setErr(errMsg(e)); }
  }
  async function simulate() {
    if (!order) return;
    setErr(null);
    try {
      await verify.mutateAsync({ data: { orderId: order.id, mode: 'test' } });
      setCheckoutOpen(false);
      await qc.invalidateQueries({ queryKey: getGetProofQueryKey() });
      onPaid();
    } catch (e) { setErr(errMsg(e)); }
  }

  if (paid) {
    return (
      <div data-testid="panel-unlocked" className="rounded-2xl bg-teal/10 p-5 ring-1 ring-teal/40">
        <p className="flex items-center gap-2 font-display text-xl font-bold text-navy"><BadgeCheck className="h-5 w-5 text-teal" /> Kit unlocked (test mode)</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button data-testid="button-download-kit" onClick={() => download('lifewise-action-kit.txt', kitText(sim, run), 'text/plain')} className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2 font-bold text-white"><Download className="h-4 w-4" /> Download</button>
          <button data-testid="button-print-kit" onClick={() => window.print()} className="flex items-center gap-2 rounded-lg border border-navy px-4 py-2 font-bold text-navy"><Printer className="h-4 w-4" /> Print</button>
        </div>
      </div>
    );
  }
  return (
    <div data-testid="panel-payment" className="rounded-2xl border-2 border-navy bg-card p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-amber">Test checkout / not live</p>
      <h3 className="font-display text-xl font-bold text-navy">Full Action Kit & Pro Pass — ₹9</h3>
      <p className="mt-1 text-sm text-muted-foreground">Pine Labs is not connected. This is a local demo checkout. No money moves, and a test verification never counts as a paying user.</p>
      <button data-testid="button-open-checkout" disabled={create.isPending} onClick={() => order ? setCheckoutOpen(true) : void open()} className="mt-4 flex items-center gap-2 rounded-xl bg-amber px-5 py-3 font-bold text-white disabled:opacity-60">
        {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Open ₹9 test checkout
      </button>
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto bg-paper sm:max-w-xl">
          <DialogTitle className="font-display text-2xl text-navy">Pine Labs checkout demo — ₹9</DialogTitle>
          <DialogDescription>This is a local demonstration, not a connected Pine Labs transaction. No payment will be collected.</DialogDescription>
          {order && (
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative">
            {qr && <img data-testid="img-demo-qr" src={qr} alt="Demo UPI QR code, do not pay" className="h-[220px] w-[220px] rounded-lg opacity-60 ring-2 ring-destructive" />}
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 -rotate-12 bg-destructive py-1 text-center font-mono text-xs font-bold uppercase tracking-widest text-white">Demo only, do not pay</span>
          </div>
          <div className="flex-1 space-y-2 text-sm">
            <p className="font-mono text-xs">Order <span data-testid="text-order-id">{order.id}</span></p>
            <p>Amount: {order.currency} {order.amount} ({order.mode})</p>
            <p className="rounded-lg bg-destructive/10 p-2 font-semibold text-destructive">DO NOT PAY. Do not scan with a real UPI app.</p>
            <button data-testid="button-simulate-verify" disabled={verify.isPending} onClick={simulate} className="flex items-center gap-2 rounded-xl bg-navy px-5 py-3 font-bold text-white disabled:opacity-60">
              {verify.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Simulate test verification
            </button>
          </div>
        </div>
          )}
          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        </DialogContent>
      </Dialog>
      {err && <p role="alert" data-testid="text-payment-error" className="mt-3 text-sm font-medium text-destructive">{err}</p>}
    </div>
  );
}

export default function SimulationPage() {
  const { id = '' } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { state } = useLearner();
  const simQ = useGetSimulation(id, { query: { queryKey: getGetSimulationQueryKey(id), refetchInterval: 5000, retry: false } });
  const sim = simQ.data;
  const done = isComplete(sim);
  const decide = useMakeDecision();
  const agent = useRunAgent();
  const [decErr, setDecErr] = useState<string | null>(null);
  const [agentErr, setAgentErr] = useState<string | null>(null);
  const [localRun, setLocalRun] = useState<AgentRun | null>(null);
  const [paidLocal, setPaidLocal] = useState(false);
  const ran = useRef<string | null>(null);
  const agentRef = useRef(agent.mutateAsync);
  agentRef.current = agent.mutateAsync;

  const runs = useGetAgentRuns({ query: { queryKey: getGetAgentRunsQueryKey(), enabled: done, refetchInterval: 5000 } });
  const proof = useGetProof({ query: { queryKey: getGetProofQueryKey(), enabled: done, refetchInterval: 5000 } });
  const run = runs.data?.find((r) => r.simulationId === id) ?? localRun;
  const paid = paidLocal || !!proof.data?.payments.some((p) => p.simulationId === id && /verified/i.test(p.status) && !/unverified/i.test(p.status));

  const fire = useCallback(async () => {
    setAgentErr(null);
    try {
      const r = await agentRef.current({ data: { simulationId: id } });
      setLocalRun(r);
      await Promise.all([qc.invalidateQueries({ queryKey: getGetAgentRunsQueryKey() }), qc.invalidateQueries({ queryKey: getGetApprovalsQueryKey() })]);
    } catch (e) { setAgentErr(errMsg(e)); ran.current = null; }
  }, [id, qc]);

  useEffect(() => {
    if (done && ran.current !== id) { ran.current = id; void fire(); }
  }, [done, id, fire]);

  async function choose(choiceId: string) {
    if (!sim || decide.isPending) return;
    setDecErr(null);
    try {
      const next = await decide.mutateAsync({ id, data: { step: sim.currentStep, choiceId } });
      qc.setQueryData(getGetSimulationQueryKey(id), next);
      await qc.invalidateQueries({ queryKey: getGetLearnerQueryKey() });
    } catch (e) {
      setDecErr(errMsg(e));
      void simQ.refetch();
    }
  }

  if (simQ.isLoading) return <ListSkeleton rows={3} />;
  if (simQ.isError || !sim) return <ErrorState message={errMsg(simQ.error)} onRetry={() => void simQ.refetch()} />;

  const step = sim.track.steps[sim.currentStep];
  const lang = state?.learner?.language ?? 'English';
  const approved = isApproved(run);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rise rounded-3xl bg-navy p-5 text-white shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-teal">{done ? 'Simulation complete' : 'Decision ' + (sim.currentStep + 1) + ' of 3'}</p>
            <h1 data-testid="text-sim-title" className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">{sim.trackTitle}</h1>
          </div>
          <div className="flex gap-1.5" aria-hidden>
            {[0, 1, 2].map((i) => <span key={i} className={`h-2 w-8 rounded-full ${i < sim.currentStep || done ? 'bg-teal' : i === sim.currentStep ? 'bg-amber' : 'bg-white/15'}`} />)}
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div data-testid="meter-impact" className="sm:col-span-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">Real-world impact</span>
            <p className="font-display text-3xl font-extrabold tabular-nums text-amber">{sim.impact.toLocaleString('en-IN')}</p>
            <p className="text-xs text-white/60">{sim.impactLabel}</p>
          </div>
          <Meter label="Mastery" value={sim.mastery} tone="teal" />
          <Meter label="Confidence" value={sim.confidence} tone="navy" />
        </div>
      </div>

      {sim.feedback && sim.choices.length > 0 && (
        <section data-testid="section-feedback" className="rise rounded-2xl border bg-card p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-amber">Why this matters in the real world</p>
          <p data-testid="text-feedback" className="mt-1 font-semibold text-navy">{sim.feedback}</p>
          <Coach text={sim.feedback} simulationId={sim.id} defaultLang={lang} />
        </section>
      )}

      {!done && step && (
        <section className="rise rounded-2xl border-2 border-navy bg-card p-5 sm:p-6" key={sim.currentStep}>
          <h2 className="font-display text-2xl font-extrabold text-navy">{step.title}</h2>
          <p data-testid="text-situation" className="mt-2 leading-relaxed text-foreground/85">{step.situation}</p>
          <div className="mt-5 space-y-3">
            {step.choices.map((c, i) => (
              <button key={c.id} data-testid={`button-choice-${c.id}`} disabled={decide.isPending} onClick={() => void choose(c.id)} className="group flex w-full items-start gap-3 rounded-xl border border-input bg-paper p-4 text-left transition-all hover:border-teal hover:shadow-md active:scale-[.99] disabled:opacity-60">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy font-mono text-sm font-bold text-amber group-hover:bg-teal group-hover:text-white">{String.fromCharCode(65 + i)}</span>
                <span className="pt-1 text-sm font-medium sm:text-base">{c.text}</span>
                {decide.isPending && decide.variables?.data.choiceId === c.id && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
              </button>
            ))}
          </div>
          {decErr && <p role="alert" data-testid="text-decision-error" className="mt-3 text-sm font-medium text-destructive">{decErr}</p>}
        </section>
      )}

      {done && (
        <>
          <section data-testid="card-iq" className="rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal to-navy p-6 text-white">
            <Award className="absolute -right-4 -top-4 h-32 w-32 text-white/10" />
            <p className="font-mono text-[11px] uppercase tracking-widest text-white/70">Lifewise Survival IQ Card / free</p>
            <p className="mt-1 font-display text-3xl font-extrabold">{state?.learner?.name ?? 'Learner'}</p>
            <p className="text-sm text-white/80">{sim.trackTitle}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[['Mastery', sim.mastery + '/100'], ['Confidence', sim.confidence + '/100'], [sim.impactLabel, sim.impact.toLocaleString('en-IN')]].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white/10 p-3"><p className="font-display text-xl font-extrabold">{v}</p><p className="text-[11px] text-white/70">{k}</p></div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[10px] text-white/60">Completed {fmt(sim.completedAt)}</p>
          </section>

          <section className="rise space-y-4" data-testid="section-kit">
            {!run && !agentErr && <div className="space-y-2"><p className="flex items-center gap-2 text-sm font-semibold text-navy"><Loader2 className="h-4 w-4 animate-spin" /> Chanakya is evaluating your run...</p><Skeleton className="h-28 w-full rounded-xl" /></div>}
            {agentErr && <ErrorState message={agentErr} onRetry={() => { ran.current = id; void fire(); }} />}
            {run && !approved && !isRejected(run) && (
              <div data-testid="status-awaiting" className="rounded-2xl border-2 border-dashed border-amber bg-amber/10 p-5">
                <p className="flex items-center gap-2 font-display text-xl font-bold text-navy"><Hourglass className="h-5 w-5 text-amber" /> Awaiting mentor review</p>
                <p className="mt-1 text-sm text-muted-foreground">Your badge and action kit unlock after a human reviews your plan. This is a demo review, not a certification. Open the mentor queue in another tab; this page updates by itself.</p>
                <Link href="/approvals" data-testid="link-mentor-queue" className="mt-3 inline-block text-sm font-bold text-teal underline">Go to mentor queue</Link>
              </div>
            )}
            {run && isRejected(run) && (
              <div data-testid="status-rejected" className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
                <p className="flex items-center gap-2 font-display text-xl font-bold text-destructive"><XCircle className="h-5 w-5" /> Mentor asked for a revision</p>
                {run.mentorNote && <p className="mt-1 text-sm">{run.mentorNote}</p>}
                <Link href="/" className="mt-3 inline-block text-sm font-bold text-teal underline">Try another simulation</Link>
              </div>
            )}
            {run && approved && (
              <>
                <div id="print-kit" data-testid="card-action-kit" className="rounded-2xl border-2 border-teal bg-card p-5">
                  <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-teal"><BadgeCheck className="h-4 w-4" /> Lifewise Readiness Badge / mentor-approved (demo review)</p>
                  <h3 className="font-display text-2xl font-extrabold text-navy">Your Survival Action Kit</h3>
                  <p className="text-xs text-muted-foreground print:block">{sim.trackTitle}. Approved by {run.approver} on {fmt(run.approvedAt)}</p>
                  <ol className="mt-3 space-y-2">
                    {run.actions.map((a, i) => <li key={i} data-testid={`text-action-${i}`} className="flex gap-3"><span className="font-display text-xl font-extrabold text-amber">{i + 1}</span><span>{a}</span></li>)}
                  </ol>
                  {run.mentorNote && <p data-testid="text-mentor-note" className="mt-3 rounded-lg bg-secondary p-3 text-sm"><strong>Mentor note:</strong> {run.mentorNote}</p>}
                </div>
                <PaymentPanel sim={sim} run={run} paid={paid} onPaid={() => setPaidLocal(true)} />
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
