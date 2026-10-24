import { Router, type IRouter } from "express";
import healthRouter from "./health";
import learningRouter from "./lifewise-learning";
import learnRouter from "./lifewise-learn";

const router: IRouter = Router();

router.use(healthRouter);
router.use(learningRouter);
router.use(learnRouter);
// These learner features have been retired. Keep historical records untouched,
// but do not leave review/payment actions executable behind removed UI.
router.use(["/agent", "/approvals", "/payments/pinelabs", "/proof"], (_req, res): void => {
  res.status(410).json({ error: "This feature has been removed from Lifewise. Continue with lessons, quizzes, practice and progress." });
});

export default router;
