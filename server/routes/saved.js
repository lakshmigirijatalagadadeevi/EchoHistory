import { Router } from "express";
import { saveArticle, getSavedArticles, deleteSavedArticle } from "../controllers/savedController.js";

const router = Router();

router.post("/", saveArticle);
router.get("/", getSavedArticles);
router.delete("/:id", deleteSavedArticle);

export default router;
