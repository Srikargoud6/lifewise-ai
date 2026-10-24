import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetLearnerQueryKey,
  useGetLearner,
  useRegisterLearner,
  type LearnerState,
} from '@workspace/api-client-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { AGE_GROUPS, LANGS, errMsg } from '@/lib/lw';
import { Loader2, ShieldAlert } from 'lucide-react';

interface Ctx {
  state: LearnerState | undefined;
  isLoading: boolean;
  requireLearner: (after?: () => void) => void;
  refresh: () => Promise<unknown>;
}
const LearnerCtx = createContext<Ctx | null>(null);

export function useLearner() {
  const c = useContext(LearnerCtx);
  if (!c) throw new Error('LearnerProvider missing');
  return c;
}

export function LearnerProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data, isLoading } = useGetLearner({ query: { queryKey: getGetLearnerQueryKey(), refetchInterval: 5000, retry: false } });
  const register = useRegisterLearner();
  const [open, setOpen] = useState(false);
  const after = useRef<(() => void) | undefined>(undefined);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [ageGroup, setAgeGroup] = useState<(typeof AGE_GROUPS)[number]>('College Student');
  const [language, setLanguage] = useState<(typeof LANGS)[number]>('English');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: getGetLearnerQueryKey() }), [qc]);
  const requireLearner = useCallback(
    (cb?: () => void) => {
      if (data?.learner) return cb?.();
      after.current = cb;
      setOpen(true);
    },
    [data?.learner],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || contact.trim().length < 5) return setError('Add your name and an email or phone (5+ characters).');
    try {
      await register.mutateAsync({ data: { name: name.trim(), contact: contact.trim(), ageGroup, language } });
      await refresh();
      setOpen(false);
      const cb = after.current;
      after.current = undefined;
      cb?.();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  const chip = (active: boolean) =>
    `rounded-2xl border-2 px-3 py-2 text-sm font-bold transition-colors ${active ? 'border-sky bg-sky/10 text-sky-d shadow-[0_3px_0_#1cb0f6]' : 'border-line bg-white text-ink hover:bg-cream'}`;
  const field = 'mt-1 w-full rounded-2xl border-2 border-line bg-white px-3 py-3 font-semibold outline-none focus:border-sky';

  return (
    <LearnerCtx.Provider value={{ state: data, isLoading, requireLearner, refresh }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto border-2 border-line bg-cream sm:max-w-md" data-testid="dialog-onboarding">
          <DialogTitle className="text-3xl font-bold text-ink">Save your progress</DialogTitle>
          <DialogDescription className="text-sm">Five seconds. Your XP, streak and badges stay with this browser.</DialogDescription>
          <div className="flex gap-2 rounded-lg bg-sun/25 p-3 text-xs font-bold text-ink/80">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-sun-d" />
            <span>Unverified profile. No password, no login, and your contact is never shown publicly.</span>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-black">
              Name
              <input data-testid="input-name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={field} />
            </label>
            <label className="block text-sm font-black">
              Email or phone
              <input data-testid="input-contact" maxLength={120} value={contact} onChange={(e) => setContact(e.target.value)} className={field} />
            </label>
            <fieldset>
              <legend className="mb-1 text-sm font-black">Where are you in life</legend>
              <div className="flex flex-wrap gap-2">
                {AGE_GROUPS.map((a) => (
                  <button type="button" key={a} data-testid={`chip-age-${a.replace(/\s/g, '-')}`} onClick={() => setAgeGroup(a)} className={chip(a === ageGroup)}>{a}</button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-1 text-sm font-black">Coaching language</legend>
              <div className="flex flex-wrap gap-2">
                {LANGS.map((l) => (
                  <button type="button" key={l} data-testid={`chip-lang-${l}`} onClick={() => setLanguage(l)} className={chip(l === language)}>{l}</button>
                ))}
              </div>
            </fieldset>
            {error && <p role="alert" data-testid="text-onboarding-error" className="text-sm font-bold text-berry-d">{error}</p>}
            <button data-testid="button-register" disabled={register.isPending} className="chunk chunk-green chunk-block">
              {register.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Start practising
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </LearnerCtx.Provider>
  );
}
