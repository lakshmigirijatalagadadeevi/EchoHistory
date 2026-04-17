import { v4 as uuidv4 } from "uuid";
import db from "../db/database.js";

export function saveArticle(req, res) {
  try {
    const { deviceId, article, analysis } = req.body;

    if (!deviceId || !article?.title) {
      return res.status(400).json({ error: "deviceId and article.title are required" });
    }

    // Prevent duplicate saves
    const existing = db
      .prepare("SELECT id FROM saved_articles WHERE device_id = ? AND title = ?")
      .get(deviceId, article.title);

    if (existing) {
      return res.json({ id: existing.id, message: "Already saved" });
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO saved_articles
        (id, device_id, title, description, image_url, source, published_at, news_url, ai_event, ai_year, ai_category, ai_explanation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      deviceId,
      article.title,
      article.description || null,
      article.image || null,
      article.source || null,
      article.publishedAt || null,
      article.url || null,
      analysis?.event || null,
      analysis?.year || null,
      analysis?.category || null,
      analysis?.explanation || null
    );

    res.status(201).json({ id, message: "Saved" });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ error: "Failed to save article" });
  }
}

export function getSavedArticles(req, res) {
  try {
    const deviceId = req.query.deviceId;
    if (!deviceId) {
      return res.status(400).json({ error: "deviceId query param is required" });
    }

    const rows = db
      .prepare("SELECT * FROM saved_articles WHERE device_id = ? ORDER BY saved_at DESC")
      .all(deviceId);

    const articles = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      image: r.image_url,
      source: r.source,
      publishedAt: r.published_at,
      url: r.news_url,
      savedAt: r.saved_at,
      analysis: {
        event: r.ai_event,
        year: r.ai_year,
        category: r.ai_category,
        explanation: r.ai_explanation,
      },
    }));

    res.json({ articles });
  } catch (err) {
    console.error("Get saved error:", err);
    res.status(500).json({ error: "Failed to retrieve saved articles" });
  }
}

export function deleteSavedArticle(req, res) {
  try {
    const { id } = req.params;
    const deviceId = req.query.deviceId;

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId query param is required" });
    }

    const result = db
      .prepare("DELETE FROM saved_articles WHERE id = ? AND device_id = ?")
      .run(id, deviceId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete article" });
  }
}
