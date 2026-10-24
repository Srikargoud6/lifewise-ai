import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { pool, lifewiseRecords, insertLifewiseRecordSchema } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { SubmitLearningQuizBody, GetLearningLibraryResponse, type LearningProgress, type LearningResult } from "@workspace/api-zod";
import { dailyAssignment, learningLessons, publicLibrary, publicQuestion } from "./learning-content";
import { applyCompletion, emptyProgress, grade, kolkataDay, progressForDay, shiftDay } from "./learning-progress";
import { submitQuiz } from "./learning-service";
import { HttpError } from "./lifewise-store";

const result = (day: string): LearningResult => ({
  id: randomUUID(), kind: "lesson", sourceId: "finance-banking", score: 3, total: 3,
  completedAt: `${day}T12:00:00Z`, day, review: [], newAchievements: [],
});
test("18 substantive lessons, six subjects, valid quizzes and public answer-key isolation", () => {
  assert.equal(learningLessons.length, 18);
  for (const subject of ["Politics", "Government", "Ethics", "Economy", "Health", "Finance"]) {
    assert.equal(learningLessons.filter((l) => l.subject === subject).length, 3);
  }
  assert.equal(GetLearningLibraryResponse.parse(publicLibrary).length, 18);
  const ids = new Set<string>();
  for (const l of learningLessons) {
    assert.ok(l.goal.length > 30 && l.explanation.join(" ").length > 500 && l.example.length > 100);
    assert.ok(l.takeaways.length >= 3 && l.references.length && l.nextStep && l.caveat);
    assert.equal(l.questions.length, 3);
    for (const q of l.questions) {
      assert.ok(!ids.has(q.id)); ids.add(q.id);
      assert.ok(q.options[q.answer] && q.explanation.length > 30);
    }
    assert.equal(grade(l.questions, l.questions.map((q) => q.answer)).score, 3);
    assert.equal(grade(l.questions, l.questions.map((q) => (q.answer + 1) % q.options.length)).score, 0);
  }
  assert.ok(!JSON.stringify(publicLibrary).includes('"answer":'));
  assert.ok(!JSON.stringify(publicLibrary.map((l) => l.questions)).includes('"explanation":'));
});
test("partial, invalid and client-forged scoring fields cannot control grading", () => {
  const qs = learningLessons[0]!.questions;
  assert.throws(() => grade(qs, [1, 2]), HttpError);
  assert.throws(() => grade(qs, [1, 2, 9]), HttpError);
  assert.throws(() => grade(qs, [1, 2, 0.5]), HttpError);
  const parsed = SubmitLearningQuizBody.parse({ requestId: randomUUID(), kind: "lesson", sourceId: "x", answers: [0, 0, 0], score: 100, day: "2099-01-01", learnerId: "someone-else" });
  assert.ok(!("score" in parsed) && !("day" in parsed) && !("learnerId" in parsed));
});
test("Kolkata date boundary, leap day, year rollover and device-clock independence", () => {
  assert.equal(kolkataDay(new Date("2026-10-24T18:29:59.999Z")), "2026-10-24");
  assert.equal(kolkataDay(new Date("2026-10-24T18:30:00.000Z")), "2026-10-25");
  assert.equal(kolkataDay(new Date("2026-12-31T18:30:00Z")), "2027-01-01");
  assert.equal(shiftDay("2024-03-01", -1), "2024-02-29");
  assert.equal(shiftDay("2027-01-01", -1), "2026-12-31");
});
test("daily bank is stable for a date, mixes five subjects and hides keys", () => {
  const a = dailyAssignment("2026-10-24");
  assert.deepEqual(a, dailyAssignment("2026-10-24"));
  assert.notEqual(a.id, dailyAssignment("2026-10-25").id);
  assert.equal(new Set(a.questions.map((q) => learningLessons.find((l) => l.questions.includes(q))!.subject)).size, 5);
  assert.ok(!JSON.stringify(a.questions.map(publicQuestion)).includes('"answer":'));
});
test("reading adds no days; same-day repeats, consecutive days, gaps and best streak", () => {
  const p = emptyProgress("2026-10-24");
  assert.equal(progressForDay(p, "2026-10-24").currentStreak, 0);
  const first = applyCompletion(p, result("2026-10-24")).progress;
  const repeat = applyCompletion(first, result("2026-10-24")).progress;
  assert.equal(repeat.currentStreak, 1);
  assert.equal(repeat.learningDays.length, 1);
  const second = applyCompletion(repeat, result("2026-10-25")).progress;
  assert.equal(second.currentStreak, 2);
  assert.equal(progressForDay(second, "2026-10-26").currentStreak, 2);
  assert.equal(progressForDay(second, "2026-10-27").currentStreak, 0);
  const gap = applyCompletion(second, result("2026-10-27")).progress;
  assert.equal(gap.currentStreak, 1);
  assert.equal(gap.bestStreak, 2);
  assert.equal(gap.lessons[0]!.attempts, 4);
});
test("XP rewards first completion and best-score improvements, not repeat farming", () => {
  const day = "2026-10-24";
  const first = applyCompletion(emptyProgress(day), { ...result(day), score: 1 });
  assert.equal(first.result.xpEarned, 30);
  assert.equal(first.progress.totalXp, 30);
  const improved = applyCompletion(first.progress, { ...result(day), score: 3 });
  assert.equal(improved.result.xpEarned, 20);
  assert.equal(improved.progress.todayXp, 50);
  const worse = applyCompletion(improved.progress, { ...result(day), score: 0 });
  const repeat = applyCompletion(worse.progress, { ...result(day), score: 3 });
  assert.equal(worse.result.xpEarned, 0);
  assert.equal(repeat.result.xpEarned, 0);
  assert.equal(repeat.progress.totalXp, 50);
  const tomorrow = progressForDay(repeat.progress, "2026-10-25");
  assert.equal(tomorrow.totalXp, 50);
  assert.equal(tomorrow.todayXp, 0);
  assert.equal(tomorrow.dailyGoalXp, 30);
});

test("daily XP retains best scores across retakes and resets only its daily source", () => {
  const daily = (day: string, score: number): LearningResult => ({
    ...result(day), kind: "daily", sourceId: `daily-v1-${day}`, score, total: 5,
  });
  let p = emptyProgress("2026-10-24");
  for (const [score, earned] of [[3, 50], [1, 0], [5, 20], [5, 0]]) {
    const next = applyCompletion(p, daily("2026-10-24", score!));
    assert.equal(next.result.xpEarned, earned);
    p = next.progress;
  }
  assert.equal(p.totalXp, 70);
  assert.equal(p.dailyBestScore, 5);
  const next = applyCompletion(p, daily("2026-10-25", 0));
  assert.equal(next.result.xpEarned, 20);
  assert.equal(next.progress.totalXp, 90);
  assert.equal(next.progress.todayXp, 20);
  assert.equal(next.progress.currentStreak, 2);
});

test("legacy progress keeps streaks and saved lesson XP without invented historical daily rewards", () => {
  const oldResult = result("2026-10-24");
  const legacy = {
    today: oldResult.day, timezone: "Asia/Kolkata", currentStreak: 1, bestStreak: 1,
    todayCompleted: true, learningDays: [oldResult.day], achievements: [],
    lessons: [{ lessonId: oldResult.sourceId, bestScore: 3, attempts: 1, lastResult: oldResult }],
  };
  const migrated = progressForDay(legacy, oldResult.day);
  assert.equal(migrated.totalXp, 50);
  assert.equal(migrated.currentStreak, 1);
  assert.equal(migrated.todayXp, 0);
  assert.equal(applyCompletion(legacy, { ...oldResult, score: 3 }).result.xpEarned, 0);
});

test("49→50 and 99→100 award once; awards and best survive a missed day", () => {
  let p = emptyProgress("2026-01-01");
  let awards = 0;
  for (let i = 0; i < 100; i++) {
    const day = shiftDay("2026-01-01", i);
    const next = applyCompletion(p, result(day));
    assert.equal(next.result.newAchievements.length, i === 49 || i === 99 ? 1 : 0);
    awards += next.result.newAchievements.length;
    p = next.progress;
    const again = applyCompletion(p, result(day));
    assert.equal(again.result.newAchievements.length, 0);
    p = again.progress;
  }
  assert.equal(awards, 2);
  assert.deepEqual(p.achievements.map((a) => a.title), ["50-Day Learning Champion", "100-Day Life Skills Master"]);
  assert.ok(p.achievements.every((a) => a.awardedAt));
  const gap = applyCompletion(p, result("2026-05-01")).progress;
  assert.equal(gap.currentStreak, 1); assert.equal(gap.bestStreak, 100); assert.equal(gap.achievements.length, 2);
});

// Actual PostgreSQL transactions on a disposable schema. No learner, historical
// day, attempt or award fixture ever enters the application's public tables.
test("PostgreSQL: concurrent replay, one-day credit, ownership, rollback, persistence and unique milestones", async () => {
  const schemaName = `learning_test_${randomUUID().replaceAll("-", "")}`;
  const c1 = await pool.connect();
  const c2 = await pool.connect();
  try {
    await c1.query(`CREATE SCHEMA "${schemaName}"`);
    await c1.query(`CREATE TABLE "${schemaName}".lifewise_records (LIKE public.lifewise_records INCLUDING ALL)`);
    await c1.query(`SET search_path TO "${schemaName}"`);
    await c2.query(`SET search_path TO "${schemaName}"`);
    const d1 = drizzle(c1, { schema: { lifewiseRecords, insertLifewiseRecordSchema } });
    const d2 = drizzle(c2, { schema: { lifewiseRecords, insertLifewiseRecordSchema } });
    await d1.insert(lifewiseRecords).values([
      { id: "fixture_learner_a", owner: "owner_a", kind: "learner", data: {} },
      { id: "fixture_learner_b", owner: "owner_b", kind: "learner", data: {} },
    ]);
    const input = { requestId: randomUUID(), kind: "lesson" as const, sourceId: learningLessons[0]!.id, answers: [1, 2, 0] };
    const [a, replay] = await Promise.all([submitQuiz("owner_a", "fixture_learner_a", input, d1), submitQuiz("owner_a", "fixture_learner_a", input, d2)]);
    assert.deepEqual(a, replay); assert.equal(a.score, 3); assert.equal(a.xpEarned, 50);
    await assert.rejects(submitQuiz("owner_b", "fixture_learner_a", { ...input, requestId: randomUUID() }, d1), { status: 404 });
    await assert.rejects(submitQuiz("owner_a", "fixture_learner_a", { ...input, answers: [0, 0, 0] }, d1), { status: 409 });
    await assert.rejects(submitQuiz("owner_a", "fixture_learner_a", { ...input, requestId: randomUUID(), answers: [0] }, d1), { status: 400 });
    await assert.rejects(submitQuiz("owner_a", "fixture_learner_a", { ...input, requestId: randomUUID(), kind: "daily", sourceId: "daily-v1-2000-01-01", answers: [0, 0, 0, 0, 0] }, d1), { status: 409 });
    await submitQuiz("owner_a", "fixture_learner_a", { ...input, requestId: randomUUID(), answers: [2, 0, 1] }, d1);
    const [stored] = await d2.select().from(lifewiseRecords).where(eq(lifewiseRecords.id, "learning_fixture_learner_a"));
    const progress = stored!.data as unknown as LearningProgress;
    assert.equal(progress.currentStreak, 1); assert.equal(progress.learningDays.length, 1);
    assert.equal(progress.lessons[0]!.attempts, 2); assert.equal(progress.lessons[0]!.bestScore, 3);
    assert.equal(progress.lessons[0]!.lastResult.score, 0);
    assert.equal(progress.totalXp, 50); assert.equal(progress.todayXp, 50);
    assert.equal(progress.lessons[0]!.lastResult.xpEarned, 0);
    const attempts = await d1.select().from(lifewiseRecords).where(eq(lifewiseRecords.kind, "learning_attempt"));
    assert.equal(attempts.length, 2); // rejected writes and replay add nothing
    for (const n of [50, 100]) {
      const seeded = { ...emptyProgress(a.day), currentStreak: n - 1, bestStreak: n - 1, learningDays: [shiftDay(a.day, -1)],
        achievements: n === 100 ? [{ days: 50, title: "50-Day Learning Champion", awardedAt: a.completedAt }] : [] };
      await d1.update(lifewiseRecords).set({ data: seeded }).where(eq(lifewiseRecords.id, "learning_fixture_learner_a"));
      const [one, two] = await Promise.all([
        submitQuiz("owner_a", "fixture_learner_a", { ...input, requestId: randomUUID() }, d1),
        submitQuiz("owner_a", "fixture_learner_a", { ...input, requestId: randomUUID() }, d2),
      ]);
      assert.equal(one.newAchievements.length + two.newAchievements.length, 1);
      const count = await d1.execute(sql`select count(*)::integer as n from lifewise_records where id = ${`learning_award_fixture_learner_a_${n}`}`);
      assert.equal(count.rows[0]!.n, 1);
    }
    const b = await submitQuiz("owner_b", "fixture_learner_b", { ...input, requestId: randomUUID() }, d2);
    assert.equal(b.newAchievements.length, 0);
    const [bRow] = await d1.select().from(lifewiseRecords).where(eq(lifewiseRecords.id, "learning_fixture_learner_b"));
    assert.equal((bRow!.data as unknown as LearningProgress).currentStreak, 1);
  } finally {
    await c1.query("SET search_path TO public");
    await c2.query("SET search_path TO public");
    await c1.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    c1.release(); c2.release();
    await pool.end();
  }
});
