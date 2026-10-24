import { Router, type IRouter } from "express";
import healthRouter from "./health";
import learningRouter from "./lifewise-learning";
import governanceRouter from "./lifewise-governance";
import learnRouter from "./lifewise-learn";

const router: IRouter = Router();

router.use(healthRouter);
router.use(learningRouter);
router.use(learnRouter);
router.use(governanceRouter);

export default router;
