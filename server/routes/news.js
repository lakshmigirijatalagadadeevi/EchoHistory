import { Router } from "express";
import { getTopHeadlines } from "../controllers/newsController.js";

const router = Router();

router.get("/", getTopHeadlines);

export default router;
