import { getGetLearningProgressQueryKey, useGetLearningProgress, type LearningProgress } from '@workspace/api-client-react';
import { useLearner } from '@/hooks/use-learner';

export function useProgress() {
  const { state } = useLearner();
  return useGetLearningProgress({ query: { queryKey: getGetLearningProgressQueryKey(), enabled: !!state?.learner, refetchOnMount: 'always', refetchInterval: 60000, retry: false } });
}

type XpFields = { totalXp?: number; todayXp?: number; dailyGoalXp?: number };

export function xpOf(p?: LearningProgress) {
  const x = (p ?? {}) as XpFields;
  const totalXp = x.totalXp ?? 0;
  const goal = x.dailyGoalXp ?? 30;
  return { totalXp, todayXp: x.todayXp ?? 0, goal, level: 1 + Math.floor(totalXp / 100), intoLevel: totalXp % 100 };
}
