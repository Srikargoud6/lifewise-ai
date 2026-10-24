import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { LearningProgress, LearningQuizInput, LearningResult } from "@workspace/api-zod";
import { dailyAssignment, learningLessons } from "./learning-content";
import { applyCompletion, emptyProgress, grade, kolkataDay } from "./learning-progress";
import { getRecord, hash, HttpError, insertRecord, saveRecord } from "./lifewise-store";

export async function submitQuiz(owner: string, learnerId: string, input: LearningQuizInput, database: Pick<typeof db, "transaction"> = db): Promise<LearningResult> {
  return database.transaction(async (tx) => {
    // Lock the learner even for the first attempt when no progress row exists.
    const learner = await getRecord(learnerId, tx, true);
    if (learner?.owner !== owner || learner.data == null) throw new HttpError(404, "Learner not found in this browser.");
    const attemptId = `learning_attempt_${hash(learnerId + ":" + input.requestId)}`;
    const fingerprint = hash(JSON.stringify({ kind: input.kind, sourceId: input.sourceId, answers: input.answers }));
    const prior = await getRecord<{ fingerprint: string; result: LearningResult }>(attemptId, tx);
    if (prior) {
      if (prior.owner !== owner) throw new HttpError(404, "Attempt not found.");
      if (prior.data.fingerprint !== fingerprint) throw new HttpError(409, "This submission was already used with different answers. Start a practice retake.");
      return prior.data.result;
    }
    // Read after acquiring the lock. A transaction waiting across midnight must
    // use its actual submission day, not PostgreSQL's transaction start time.
    const clock = await tx.execute(sql`select clock_timestamp() as instant`);
    const instant = new Date(clock.rows[0]!.instant as string);
    const today = kolkataDay(instant);
    const daily = dailyAssignment(today);
    if (input.kind === "daily" && input.sourceId !== daily.id) {
      throw new HttpError(409, "A new learning day has started in Asia/Kolkata. Reload the daily challenge.");
    }
    const questions = input.kind === "daily" ? daily.questions : learningLessons.find((l) => l.id === input.sourceId)?.questions;
    if (!questions) throw new HttpError(404, "Lesson not found.");
    const graded = grade(questions, input.answers);
    const progressId = `learning_${learnerId}`;
    const record = await getRecord<LearningProgress>(progressId, tx);
    if (record && record.owner !== owner) throw new HttpError(404, "Progress not found.");
    const updated = applyCompletion(record?.data ?? emptyProgress(today), {
      id: attemptId, kind: input.kind, sourceId: input.sourceId, ...graded,
      completedAt: instant.toISOString(), day: today, newAchievements: [],
    });
    if (record) await saveRecord(progressId, updated.progress, tx);
    else await insertRecord(progressId, "learning_progress", owner, updated.progress, tx);
    for (const award of updated.result.newAchievements) {
      await insertRecord(`learning_award_${learnerId}_${award.days}`, "learning_achievement", owner, award, tx);
    }
    await insertRecord(attemptId, "learning_attempt", owner, { fingerprint, result: updated.result }, tx);
    return updated.result;
  });
}
