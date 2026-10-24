import type { ReactNode } from 'react';
import { getGetProofQueryKey, useGetProof } from '@workspace/api-client-react';
import { Download, FileJson } from 'lucide-react';
import { EmptyState, ErrorState, ListSkeleton, PageHead } from '@/components/bits';
import { download, errMsg, fmt, toCsv } from '@/lib/lw';

function Table({ title, id, heads, rows }: { title: string; id: string; heads: string[]; rows: ReactNode[][] }) {
  return (
    <section data-testid={`table-${id}`} className="mt-8">
      <h2 className="mb-2 font-display text-2xl font-extrabold text-navy">{title} <span className="font-mono text-sm text-muted-foreground">({rows.length})</span></h2>
      {rows.length === 0 ? (
        <EmptyState title="Nothing logged yet" body="Rows appear here as real activity is recorded." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-navy font-mono text-[11px] uppercase tracking-wider text-white"><tr>{heads.map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i} className="border-t even:bg-muted/40">{r.map((c, j) => <td key={j} className="px-3 py-2 align-top">{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Proof() {
  const q = useGetProof({ query: { queryKey: getGetProofQueryKey(), refetchInterval: 5000 } });
  const p = q.data;

  function exportCsv() {
    if (!p) return;
    const rows = [
      ...p.learners.map((l) => ({ event_type: 'signup', event_id: l.id, learner_id: l.id, subject: l.name, status: l.status, timestamp: l.timestamp, details: JSON.stringify(l) })),
      ...p.simulations.map(({ track, ...s }) => ({ event_type: 'simulation', event_id: s.id, learner_id: s.learnerId, subject: s.trackTitle, status: s.status, timestamp: s.completedAt ?? s.timestamp, details: JSON.stringify({ ...s, trackSteps: track.steps.length }) })),
      ...p.runs.map((r) => ({ event_type: 'agent_run', event_id: r.id, learner_id: r.learnerName, subject: r.trackTitle, status: r.status, timestamp: r.timestamp, details: JSON.stringify(r) })),
      ...p.audits.map((a) => ({ event_type: 'human_review', event_id: a.id, learner_id: '', subject: a.proposal, status: a.action, timestamp: a.timestamp, details: JSON.stringify(a) })),
      ...p.payments.map((x) => ({ event_type: 'test_payment', event_id: x.id, learner_id: x.learnerId, subject: x.currency + ' ' + x.amount, status: x.status, timestamp: x.verifiedAt ?? x.timestamp, details: JSON.stringify(x) })),
    ];
    download('lifewise-proof.csv', toCsv(rows), 'text/csv');
  }
  const kpis = p ? [['Signups', p.signups, 'target 20'], ['Paying users', p.payingUsers, 'target 5, real payments only'], ['Test payments', p.testPayments, 'not counted as paying'], ['Agent runs', p.agentRuns, ''], ['Approvals', p.approvals, ''], ['Completed sims', p.completedSimulations, '']] : [];

  return (
    <div>
      <PageHead kicker="Live telemetry" title="Proof of life">Everything below is read from the server. Learner contacts are never included.</PageHead>
      <div className="flex flex-wrap gap-3">
        <button data-testid="button-export-csv" disabled={!p} onClick={exportCsv} className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2 font-bold text-white disabled:opacity-50"><Download className="h-4 w-4" /> Export CSV</button>
        <button data-testid="button-export-json" disabled={!p} onClick={() => p && download('lifewise-proof.json', JSON.stringify(p, null, 2), 'application/json')} className="flex items-center gap-2 rounded-lg border border-navy px-4 py-2 font-bold text-navy disabled:opacity-50"><FileJson className="h-4 w-4" /> Export JSON</button>
      </div>
      {q.isLoading && <div className="mt-6"><ListSkeleton /></div>}
      {q.isError && <div className="mt-6"><ErrorState message={errMsg(q.error)} onRetry={() => void q.refetch()} /></div>}
      {p && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {kpis.map(([k, v, s]) => (
              <div key={String(k)} data-testid={`kpi-${String(k).toLowerCase().replace(/\s+/g, '-')}`} className="rounded-2xl bg-navy p-4 text-white">
                <p className="font-display text-5xl font-extrabold tabular-nums text-amber">{v}</p>
                <p className="font-semibold">{k}</p>
                <p className="font-mono text-[10px] text-white/50">{s}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 font-mono text-xs">
            {Object.entries(p.integrations).map(([k, v]) => <span key={k} className="rounded-full bg-muted px-3 py-1">{k}: {v}</span>)}
          </div>
          <Table id="learners" title="Signups (unverified)" heads={['Learner', 'Age group', 'Language', 'Status', 'Registered']} rows={p.learners.map((l) => [l.name, l.ageGroup, l.language, l.status, <span key="t" className="font-mono text-xs">{fmt(l.timestamp)}</span>])} />
          <Table id="simulations" title="Simulations" heads={['Track', 'Step', 'Mastery', 'Status', 'Started', 'Completed']} rows={p.simulations.map((s) => [s.trackTitle, s.currentStep + '/3', s.mastery, s.status, fmt(s.timestamp), fmt(s.completedAt)])} />
          <Table id="runs" title="Agent activity" heads={['Agent / Role', 'Provider', 'Input / Output', 'Tools', 'Status', 'Time']} rows={p.runs.map((r) => [r.agentName + ' (' + r.learnerName + ') · ' + r.role, r.provider, r.trackTitle + ' → ' + r.actions.join(' | '), r.toolsCalled.join(', '), r.status, fmt(r.timestamp)])} />
          <Table id="audits" title="Approval audit trail" heads={['Decision', 'Proposal', 'Action', 'Approver', 'Note', 'Time']} rows={p.audits.map((a) => [<span key="i" className="font-mono text-xs">{a.id}</span>, a.proposal, a.action, a.approver, a.note || '-', fmt(a.timestamp)])} />
          <Table id="payments" title="Payment logs (test only)" heads={['Order', 'Learner', 'Amount', 'Mode', 'Status', 'UTR', 'Time']} rows={p.payments.map((x) => [<span key="i" className="font-mono text-xs">{x.id}</span>, x.learnerId.slice(-6).toUpperCase(), x.currency + ' ' + x.amount, x.mode, x.status, x.utr ?? '-', fmt(x.verifiedAt ?? x.timestamp)])} />
        </>
      )}
    </div>
  );
}
