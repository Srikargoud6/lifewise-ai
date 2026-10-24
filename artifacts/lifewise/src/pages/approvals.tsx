import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAgentRunsQueryKey,
  getGetApprovalsQueryKey,
  getGetProofQueryKey,
  useGetApprovals,
  useReviewApproval,
  type AgentRun,
} from '@workspace/api-client-react';
import { CheckCircle2, Loader2, MessageSquarePlus, ShieldAlert, XCircle } from 'lucide-react';
import { EmptyState, ErrorState, ListSkeleton, PageHead, StatusPill } from '@/components/bits';
import { errMsg, fmt, isPending } from '@/lib/lw';

type Action = 'approve' | 'approve_with_note' | 'reject';

function Card({ run, approver }: { run: AgentRun; approver: string }) {
  const review = useReviewApproval();
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState<Action | null>(null);

  async function go(action: Action) {
    setErr(null);
    if (approver.trim().length < 2) return setErr('Enter your reviewer name above (2+ characters).');
    if (action !== 'approve' && !note.trim()) return setErr('A note is required for this action.');
    setPending(action);
    try {
      await review.mutateAsync({ id: run.id, data: { action, approver: approver.trim(), note: note.trim() || undefined } });
      await Promise.all([getGetApprovalsQueryKey, getGetAgentRunsQueryKey, getGetProofQueryKey].map((k) => qc.invalidateQueries({ queryKey: k() })));
    } catch (e) { setErr(errMsg(e)); }
    setPending(null);
  }
  const open = isPending(run);
  return (
    <article data-testid={`card-approval-${run.id}`} className="rise rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-xl font-extrabold text-navy">{run.learnerName}</p>
          <p className="text-sm text-muted-foreground">{run.trackTitle}</p>
        </div>
        <StatusPill status={run.status} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-xs">
        {[['Mastery', run.mastery], ['Impact', run.impact], ['Agent confidence', run.confidenceScore]].map(([k, v]) => <div key={String(k)} className="rounded-lg bg-muted p-2"><p className="text-base font-bold text-navy">{v}</p>{k}</div>)}
      </div>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-teal">Proposed action kit</p>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">{run.actions.map((a, i) => <li key={i}>{a}</li>)}</ol>
      {open ? (
        <div className="mt-4 space-y-3 border-t pt-4">
          <textarea data-testid={`input-note-${run.id}`} rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Mentor note (required for note or reject)" className="w-full rounded-lg border border-input bg-paper p-2 text-sm outline-none focus:border-teal" />
          <div className="grid gap-2 sm:grid-cols-3">
            <button data-testid={`button-approve-${run.id}`} disabled={!!pending} onClick={() => void go('approve')} className="flex items-center justify-center gap-2 rounded-lg bg-teal px-3 py-2.5 text-sm font-bold text-white disabled:opacity-60">{pending === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve</button>
            <button data-testid={`button-approve-note-${run.id}`} disabled={!!pending} onClick={() => void go('approve_with_note')} className="flex items-center justify-center gap-2 rounded-lg bg-navy px-3 py-2.5 text-sm font-bold text-white disabled:opacity-60">{pending === 'approve_with_note' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />} Approve with note</button>
            <button data-testid={`button-reject-${run.id}`} disabled={!!pending} onClick={() => void go('reject')} className="flex items-center justify-center gap-2 rounded-lg border border-destructive px-3 py-2.5 text-sm font-bold text-destructive disabled:opacity-60">{pending === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Reject</button>
          </div>
          {err && <p role="alert" data-testid={`text-approval-error-${run.id}`} className="text-sm font-medium text-destructive">{err}</p>}
        </div>
      ) : (
        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">Reviewed by {run.approver ?? '-'} at {fmt(run.approvedAt)}{run.mentorNote ? '. Note: ' + run.mentorNote : ''}</p>
      )}
    </article>
  );
}

export default function Approvals() {
  const q = useGetApprovals({ query: { queryKey: getGetApprovalsQueryKey(), refetchInterval: 5000 } });
  const [approver, setApprover] = useState('');
  const pend = q.data?.filter(isPending) ?? [];
  const done = q.data?.filter((r) => !isPending(r)) ?? [];
  return (
    <div>
      <PageHead kicker="Human in the loop" title="Mentor queue">Review the agent's proposed action kit before the learner can claim a badge.</PageHead>
      <div data-testid="banner-demo" className="mb-6 flex gap-3 rounded-xl border-2 border-amber bg-amber/10 p-4 text-sm">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
        <p><strong>Demo human review.</strong> This console has no login or role checks. Anyone can act as a mentor here. It is not secure certification.</p>
      </div>
      <label className="mb-6 block max-w-sm text-sm font-semibold">Reviewer name
        <input data-testid="input-approver" value={approver} maxLength={80} onChange={(e) => setApprover(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 font-normal outline-none focus:border-teal" />
      </label>
      {q.isLoading && <ListSkeleton />}
      {q.isError && <ErrorState message={errMsg(q.error)} onRetry={() => void q.refetch()} />}
      {q.data && q.data.length === 0 && <EmptyState title="Queue is clear" body="No agent runs yet. They appear here when a learner finishes a simulation." />}
      {pend.length > 0 && <h2 className="mb-3 font-display text-2xl font-extrabold text-navy">Awaiting review ({pend.length})</h2>}
      <div className="space-y-4">{pend.map((r) => <Card key={r.id} run={r} approver={approver} />)}</div>
      {done.length > 0 && <h2 className="mb-3 mt-10 font-display text-2xl font-extrabold text-navy">Reviewed</h2>}
      <div className="space-y-4">{done.map((r) => <Card key={r.id} run={r} approver={approver} />)}</div>
    </div>
  );
}
