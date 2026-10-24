import type { AgentRun } from '@workspace/api-client-react';

export const LANGS = ['English', 'Hinglish', 'Hindi', 'Kannada', 'Telugu', 'Tamil'] as const;
export const AGE_GROUPS = ['School Student', 'College Student', 'First Job'] as const;

export const SPEECH_LANG: Record<string, string> = {
  English: 'en-IN',
  Hinglish: 'en-IN',
  Hindi: 'hi-IN',
  Kannada: 'kn-IN',
  Telugu: 'te-IN',
  Tamil: 'ta-IN',
};

export const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' }) : '-';

export const isRejected = (r?: AgentRun | null) => !!r && /reject/i.test(r.status);
export const isApproved = (r?: AgentRun | null) => !!r && !isRejected(r) && /approved/i.test(r.status);
export const isPending = (r?: AgentRun | null) => !!r && !isApproved(r) && !isRejected(r);

export const isComplete = (s?: { status: string; currentStep: number } | null) =>
  !!s && (/complete/i.test(s.status) || s.currentStep >= 3);

export function errMsg(e: unknown): string {
  if (e && typeof e === 'object') {
    const o = e as { data?: { error?: string; message?: string }; message?: string };
    return o.data?.error ?? o.data?.message ?? o.message ?? 'Something went wrong.';
  }
  return 'Something went wrong.';
}

export function download(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toCsv(input: object[]): string {
  const rows = input as Record<string, unknown>[];
  if (!rows.length) return '';
  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const cell = (v: unknown) => {
    const s = v == null ? '' : Array.isArray(v) ? v.join(' | ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
    const safe = /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
    return '"' + safe.replace(/"/g, '""') + '"';
  };
  return [keys.join(','), ...rows.map((r) => keys.map((k) => cell(r[k])).join(','))].join('\n');
}
