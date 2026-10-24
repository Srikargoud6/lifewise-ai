import type { LearningProgress, LearningResult, LearningAchievement } from "@workspace/api-zod";
import type { AuthoredQuestion } from "./learning-content";
import { HttpError } from "./lifewise-store";

export const TIMEZONE = "Asia/Kolkata";
export function kolkataDay(instant: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
export function emptyProgress(today: string): LearningProgress {
  return { today, timezone: TIMEZONE, currentStreak: 0, bestStreak: 0, todayCompleted: false, learningDays: [], lessons: [], achievements: [] };
}
// The latest credited day is the final sorted entry; no client dates are accepted.
export function progressForDay(saved: LearningProgress, today: string): LearningProgress {
  const last = saved.learningDays.at(-1);
  return { ...saved, today, timezone: TIMEZONE, todayCompleted: last === today,
    currentStreak: last === today || last === shiftDay(today, -1) ? saved.currentStreak : 0,
    dailyResult: saved.dailyResult?.sourceId === `daily-v1-${today}` ? saved.dailyResult : undefined };
}
export function grade(questions: AuthoredQuestion[], answers: number[]) {
  if (answers.length !== questions.length || answers.some((a, i) => !Number.isInteger(a) || !questions[i]?.options[a])) {
    throw new HttpError(400, "Answer every question with a valid option before submitting.");
  }
  return {
    score: questions.reduce((score, q, i) => score + Number(q.answer === answers[i]), 0),
    total: questions.length,
    review: questions.map((q, i) => ({ questionId: q.id, prompt: q.prompt, selected: q.options[answers[i]!]!, correct: q.options[q.answer]!, explanation: q.explanation })),
  };
}
export function applyCompletion(saved: LearningProgress, result: LearningResult): { progress: LearningProgress; result: LearningResult } {
  const today = result.day;
  const progress = progressForDay(saved, today);
  if (!progress.todayCompleted) {
    const last = progress.learningDays.at(-1);
    progress.currentStreak = last === shiftDay(today, -1) ? progress.currentStreak + 1 : 1;
    progress.bestStreak = Math.max(progress.bestStreak, progress.currentStreak);
    progress.learningDays = [...progress.learningDays, today];
    progress.todayCompleted = true;
  }
  const newAchievements: LearningAchievement[] = [];
  for (const days of [50, 100]) {
    if (progress.currentStreak >= days && !progress.achievements.some((a) => a.days === days)) {
      newAchievements.push({ days, title: days === 50 ? "50-Day Learning Champion" : "100-Day Life Skills Master", awardedAt: result.completedAt });
    }
  }
  progress.achievements = [...progress.achievements, ...newAchievements];
  const finalResult = { ...result, newAchievements };
  if (result.kind === "lesson") {
    const previous = progress.lessons.find((l) => l.lessonId === result.sourceId);
    progress.lessons = [...progress.lessons.filter((l) => l.lessonId !== result.sourceId), {
      lessonId: result.sourceId, bestScore: Math.max(previous?.bestScore ?? 0, result.score),
      attempts: (previous?.attempts ?? 0) + 1, lastResult: finalResult,
    }];
  } else {
    progress.dailyResult = finalResult;
  }
  return { progress, result: finalResult };
}
