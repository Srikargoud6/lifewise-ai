import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  GetLearningLibraryResponse, GetDailyChallengeResponse, GetLearningProgressResponse,
  SubmitLearningQuizBody, SubmitLearningQuizResponse,
  type LearningProgress,
} from "@workspace/api-zod";
import { dailyAssignment, publicLibrary, publicQuestion } from "../lib/learning-content";
import { emptyProgress, kolkataDay, progressForDay } from "../lib/learning-progress";
import { browser, getRecord, requireLearner } from "../lib/lifewise-store";
import { submitQuiz } from "../lib/learning-service";

const router: IRouter = Router();
router.get("/learn/lessons", (_req, res) => {
  res.json(GetLearningLibraryResponse.parse(publicLibrary));
});
router.get("/learn/daily", (_req, res) => {
  const challenge = dailyAssignment(kolkataDay(new Date()));
  res.json(GetDailyChallengeResponse.parse({ ...challenge, questions: challenge.questions.map(publicQuestion) }));
});
router.get("/learn/progress", async (req, res): Promise<void> => {
  const owner = browser(req, res);
  const learner = await requireLearner(owner);
  // Read the clock in PostgreSQL, as in submissions. Dates never come from a device.
  const clock = await db.execute(sql`select clock_timestamp() as instant`);
  const today = kolkataDay(new Date(clock.rows[0]!.instant as string));
  const saved = await getRecord<LearningProgress>(`learning_${learner.id}`);
  res.json(GetLearningProgressResponse.parse(progressForDay(saved?.owner === owner ? saved.data : emptyProgress(today), today)));
});
router.post("/learn/attempts", async (req, res): Promise<void> => {
  const input = SubmitLearningQuizBody.parse(req.body);
  const owner = browser(req, res);
  const learner = await requireLearner(owner);
  const result = await submitQuiz(owner, learner.id, input);
  res.json(SubmitLearningQuizResponse.parse(result));
});
export default router;
