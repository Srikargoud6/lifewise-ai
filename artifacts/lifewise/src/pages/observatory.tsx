import { useState } from 'react';
import { getGetAgentRunsQueryKey, getGetProofQueryKey, useGetAgentRuns, useGetProof } from '@workspace/api-client-react';
import { ChevronDown, Cpu, Wrench } from 'lucide-react';
import { EmptyState, ErrorState, ListSkeleton, PageHead, StatusPill } from '@/components/bits';
import { errMsg, fmt } from '@/lib/lw';

export default function Observatory() {
  const q = useGetAgentRuns({ query: { queryKey: getGetAgentRunsQueryKey(), refetchInterval: 5000 } });
  const proof = useGetProof({ query: { queryKey: getGetProofQueryKey(), refetchInterval: 5000 } });
  const [open, setOpen] = useState<string | null>(null);
  const ints = proof.data?.integrations;
  return (
    <div>
      <PageHead kicker="Agent traces" title="Observatory">Each run lists the tools called and a public decision summary. These are summaries, not private model reasoning.</PageHead>
      <div data-testid="panel-integrations" className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(ints ? Object.entries(ints) : []).map(([k, v]) => (
          <div key={k} className="rounded-xl bg-navy p-3 text-white"><p className="font-mono text-[10px] uppercase tracking-widest text-teal">{k}</p><p className="text-sm font-semibold">{v}</p></div>
        ))}
        {!ints && <p className="col-span-full text-sm text-muted-foreground">{proof.isError ? 'Integration status unavailable.' : 'Loading integration status...'}</p>}
      </div>
      {q.isLoading && <ListSkeleton />}
      {q.isError && <ErrorState message={errMsg(q.error)} onRetry={() => void q.refetch()} />}
      {q.data && q.data.length === 0 && <EmptyState icon={<Cpu className="h-6 w-6" />} title="No traces yet" body="Finish a simulation and request an AgenticOrg evaluation to see its trace here." />}
      <div className="space-y-3">
        {q.data?.map((r) => (
          <article key={r.id} data-testid={`card-run-${r.id}`} className="rounded-2xl border bg-card">
            <button data-testid={`button-toggle-run-${r.id}`} onClick={() => setOpen(open === r.id ? null : r.id)} className="flex w-full items-center gap-3 p-4 text-left">
              <div className="flex-1">
                <p className="font-mono text-[11px] text-teal">{r.agentName} / {r.provider}</p>
                <p className="font-display text-lg font-bold text-navy">{r.learnerName}: {r.trackTitle}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{fmt(r.timestamp)}</p>
              </div>
              <StatusPill status={r.status} />
              <ChevronDown className={`h-5 w-5 transition-transform ${open === r.id ? 'rotate-180' : ''}`} />
            </button>
            {open === r.id && (
              <div className="space-y-4 border-t p-4 text-sm">
                <p className="text-muted-foreground">{r.role}. Confidence {r.confidenceScore}</p>
                <div>
                  <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-amber">Tools called</p>
                  <div className="flex flex-wrap gap-1.5">{r.toolsCalled.map((t, i) => <span key={i} className="flex items-center gap-1 rounded-md bg-navy px-2 py-1 font-mono text-xs text-white"><Wrench className="h-3 w-3 text-amber" />{t}</span>)}</div>
                </div>
                <div>
                  <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-amber">Decision summary</p>
                  <ol className="space-y-1 border-l-2 border-teal pl-4">{r.reasoningSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                </div>
                <div>
                  <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-amber">Proposed actions</p>
                  <ul className="list-disc pl-5">{r.actions.map((a, i) => <li key={i}>{a}</li>)}</ul>
                </div>
                {!!r.riskFlags?.length && <div className="rounded-lg bg-amber/10 p-3"><p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-amber">Risk flags</p><ul className="list-disc pl-5">{r.riskFlags.map((flag, i) => <li key={i}>{flag}</li>)}</ul></div>}
                {r.externalRunId && <p className="font-mono text-xs text-muted-foreground">AgenticOrg run: {r.externalRunId}</p>}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
