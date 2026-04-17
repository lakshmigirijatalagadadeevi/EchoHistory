import { Router } from "express";
import { analyzeHeadline, batchAnalyze } from "../controllers/analyzeController.js";

const router = Router();

router.post("/", analyzeHeadline);
router.post("/batch", batchAnalyze);

export default router;
