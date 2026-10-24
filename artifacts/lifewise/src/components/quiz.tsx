import { useRef, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { getGetLearningProgressQueryKey, useSubmitLearningQuiz, type LearningAchievement, type LearningQuestion, type LearningQuizInput, type LearningResult } from '@workspace/api-client-react';
import { Award, Check, Loader2, RotateCcw, Trophy, X, Zap } from 'lucide-react';
import { useLearner } from '@/hooks/use-learner';
import { errMsg } from '@/lib/lw';

export const day = (d: string) => new Date(d.length === 10 ? d + 'T00:00:00+05:30' : d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

function Achievements({ list }: { list: LearningAchievement[] }) {
  return (
    <div role="status" aria-live="polite" data-testid="status-achievements">
      {list.map((a) => (
        <div key={a.days} className="pop mt-4 flex items-center gap-3 rounded-2xl bg-sun p-4 text-ink">
          <Award className="h-10 w-10 shrink-0" />
          <div>
            <p className="text-xl font-bold">New badge: {a.title}</p>
            <p className="text-sm font-bold">{a.days} learning days in a row, awarded {day(a.awardedAt)}. A digital badge with no monetary value.</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultView({ r, onRetake, saved, footer }: { r: LearningResult; onRetake: () => void; saved: boolean; footer?: ReactNode }) {
  const xpEarned = r.xpEarned;
  return (
    <section className="rise" data-testid="section-result" aria-labelledby="result-h">
      <div className="pane overflow-hidden text-center">
        <div className="bg-leaf p-6">
          <Trophy className="pop mx-auto h-14 w-14 text-white" />
          <p className="mt-1 text-xs font-black uppercase tracking-widest text-white/80">{saved ? 'Saved result' : 'Lesson complete'} / {day(r.completedAt)}</p>
          <h2 id="result-h" className="text-4xl font-bold text-white" data-testid="text-score">{r.score} of {r.total} correct</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          <div className="rounded-2xl border-2 border-sun p-3"><p className="text-xs font-black uppercase text-sun-d">XP earned</p><p className="flex items-center justify-center gap-1 text-3xl font-bold text-ink" data-testid="text-xp-earned"><Zap className="h-6 w-6 text-sun-d" />{xpEarned === undefined ? '—' : '+' + xpEarned}</p></div>
          <div className="rounded-2xl border-2 border-leaf p-3"><p className="text-xs font-black uppercase text-leaf-d">Accuracy</p><p className="text-3xl font-bold text-ink">{r.total ? Math.round((r.score / r.total) * 100) : 0}%</p></div>
        </div>
        {!saved && <div className="px-4 pb-4 text-left"><Achievements list={r.newAchievements} /></div>}
      </div>
      <h3 className="mb-2 mt-6 text-2xl font-bold text-ink">Review</h3>
      <ol className="space-y-3">
        {r.review.map((v, i) => {
          const ok = v.selected === v.correct;
          return (
            <li key={v.questionId} data-testid={`review-${i}`} className={`pane p-4 ${ok ? 'bg-leaf/10' : 'bg-berry/10'}`} style={{ borderColor: ok ? '#58cc02' : '#f0455a', boxShadow: 'none' }}>
              <p className="flex items-start gap-2 font-bold text-ink">{ok ? <Check className="mt-1 h-5 w-5 shrink-0 text-leaf-d" /> : <X className="mt-1 h-5 w-5 shrink-0 text-berry-d" />}{v.prompt}</p>
              <p className="mt-1 text-sm"><span className="font-black">{ok ? 'Correct:' : 'You chose:'}</span> {v.selected}</p>
              {!ok && <p className="text-sm"><span className="font-black">Right answer:</span> {v.correct}</p>}
              <p className="mt-1 text-sm text-mute">{v.explanation}</p>
            </li>
          );
        })}
      </ol>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button data-testid="button-retake" onClick={onRetake} className="chunk chunk-ghost"><RotateCcw className="h-4 w-4" /> Practice again</button>
        {footer}
      </div>
    </section>
  );
}

export function Quiz({ kind, sourceId, questions, saved, footer }: { kind: 'lesson' | 'daily'; sourceId: string; questions: LearningQuestion[]; saved?: LearningResult; footer?: ReactNode }) {
  const qc = useQueryClient();
  const { requireLearner } = useLearner();
  const submit = useSubmitLearningQuiz();
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<LearningResult | null>(null);
  const [retaking, setRetaking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
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
  function next(e: React.FormEvent) {
    e.preventDefault();
    if (answers[idx] === null) return;
    if (idx < questions.length - 1) return setIdx(idx + 1);
    if (answers.some((a) => a === null)) return;
    requireLearner(run);
  }
  function retake() {
    reqId.current = crypto.randomUUID();
    payload.current = null;
    setLocked(false);
    setAnswers(questions.map(() => null));
    setIdx(0);
    setResult(null);
    setRetaking(true);
    setErr(null);
  }

  if (shown) return <ResultView r={shown} saved={!result} onRetake={retake} footer={footer} />;
  const q = questions[idx]!;
  const last = idx === questions.length - 1;
  return (
    <form onSubmit={next} className="rise" data-testid="form-quiz" noValidate>
      <div className="mb-5 flex items-center gap-3">
        <div role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={idx} className="h-4 flex-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-leaf transition-[width] duration-500" style={{ width: (idx / questions.length) * 100 + '%' }} />
        </div>
        <span className="text-sm font-black text-mute">{idx + 1}/{questions.length}</span>
      </div>
      <fieldset key={q.id} disabled={locked} className="rise">
        <legend className="mb-4 text-2xl font-bold leading-snug text-ink sm:text-3xl">{q.prompt}</legend>
        <div className="grid gap-3">
          {q.options.map((o, oi) => (
            <label key={oi} className="group relative block cursor-pointer">
              <input type="radio" className="peer sr-only" name={`${sourceId}-${q.id}`} data-testid={`radio-${idx}-${oi}`} checked={answers[idx] === oi} onChange={() => setAnswers((a) => a.map((x, i) => (i === idx ? oi : x)))} />
              <span className="flex items-center gap-3 rounded-2xl border-2 border-line bg-white p-4 text-base font-bold text-ink transition-all peer-checked:border-sky peer-checked:bg-sky/10 peer-checked:text-sky-d peer-checked:shadow-[0_3px_0_#1cb0f6] peer-focus-visible:ring-4 peer-focus-visible:ring-sky/40 group-hover:bg-cream" style={{ boxShadow: undefined }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-line text-sm font-black text-mute">{oi + 1}</span>
                {o}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {err && (
        <div role="alert" data-testid="text-quiz-error" className="mt-4 rounded-2xl bg-berry/10 p-3 text-sm font-bold text-berry-d">{err} Your answers are kept. Retrying will not double count.</div>
      )}
      <div className="mt-6 flex items-center gap-3 border-t-2 border-line pt-4">
        {idx > 0 && !locked && <button type="button" data-testid="button-quiz-back" onClick={() => setIdx(idx - 1)} className="chunk chunk-ghost">Back</button>}
        <button data-testid={last ? 'button-submit-quiz' : 'button-quiz-next'} disabled={answers[idx] === null || submit.isPending} className="chunk chunk-green ml-auto min-w-40">
          {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />} {last ? (err ? 'Retry submit' : 'Finish') : 'Continue'}
        </button>
      </div>
      <Link href="/learn" className="sr-only">Leave quiz</Link>
    </form>
  );
}
