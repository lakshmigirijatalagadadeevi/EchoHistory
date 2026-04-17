import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";

// Use in-memory DB so tests never touch production data
process.env.DB_PATH = ":memory:";
// Clear API keys so external calls fall back to mocks/fallbacks
process.env.OPENAI_API_KEY = "";
process.env.GNEWS_API_KEY = "";
process.env.MEDIASTACK_API_KEY = "";
process.env.NEWS_API_KEY = "";

const { default: app } = await import("../index.js");
const request = supertest(app);

// ── Health ────────────────────────────────────────────────────────────────────

describe("GET /health", () => {
  it("returns ok status", async () => {
    const res = await request.get("/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
    assert.ok(res.body.timestamp);
  });
});

// ── News ──────────────────────────────────────────────────────────────────────

describe("GET /news", () => {
  it("returns 502 when no API keys are set", async () => {
    const res = await request.get("/news");
    assert.equal(res.status, 502);
    assert.ok(res.body.error);
  });

  it("ignores invalid category and defaults to general", async () => {
    const res = await request.get("/news?category=hacking");
    // Still 502 (no API keys) but request must not crash
    assert.ok(res.status === 200 || res.status === 502);
  });

  it("accepts valid category param", async () => {
    const res = await request.get("/news?category=technology");
    assert.ok(res.status === 200 || res.status === 502);
  });

  it("accepts page param", async () => {
    const res = await request.get("/news?category=general&page=2");
    assert.ok(res.status === 200 || res.status === 502);
  });
});

// ── Analyze ───────────────────────────────────────────────────────────────────

describe("POST /analyze", () => {
  it("returns 400 when title is missing", async () => {
    const res = await request.post("/analyze").send({});
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it("returns fallback shape when no OpenAI key", async () => {
    const res = await request
      .post("/analyze")
      .send({ title: "Storm causes widespread flooding" });
    assert.equal(res.status, 200);
    assert.ok(res.body.event);
    assert.ok(res.body.year);
    assert.ok(res.body.category);
    assert.ok(res.body.explanation);
  });

  it("caches result — second call returns same data", async () => {
    const title = "Unique headline for cache test " + Date.now();
    const res1 = await request.post("/analyze").send({ title });
    const res2 = await request.post("/analyze").send({ title });
    assert.equal(res1.status, 200);
    assert.deepEqual(res1.body, res2.body);
  });
});

describe("POST /analyze/batch", () => {
  it("returns 400 when titles is not an array", async () => {
    const res = await request.post("/analyze/batch").send({ titles: "bad" });
    assert.equal(res.status, 400);
  });

  it("returns array of results matching input length", async () => {
    const titles = ["Flood hits coastal city", "Stock market rallies"];
    const res = await request.post("/analyze/batch").send({ titles });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, titles.length);
  });

  it("each result has required fields", async () => {
    const res = await request
      .post("/analyze/batch")
      .send({ titles: ["Election results disputed"] });
    assert.equal(res.status, 200);
    const item = res.body[0];
    assert.ok(item.event);
    assert.ok(item.year);
    assert.ok(item.category);
    assert.ok(item.explanation);
  });
});

// ── Saved Articles ────────────────────────────────────────────────────────────

describe("Saved articles CRUD", () => {
  const deviceId = "test-device-123";
  const article = {
    title: "Test Article Title",
    description: "A test description",
    image: null,
    source: "Test Source",
    publishedAt: new Date().toISOString(),
    url: "https://example.com/test",
  };
  const analysis = {
    event: "The Test Event",
    year: "1999",
    category: "Testing",
    explanation: "This is a test.",
  };
  let savedId;

  it("POST /save returns 400 without deviceId", async () => {
    const res = await request.post("/save").send({ article });
    assert.equal(res.status, 400);
  });

  it("POST /save returns 400 without article.title", async () => {
    const res = await request.post("/save").send({ deviceId, article: {} });
    assert.equal(res.status, 400);
  });

  it("POST /save saves article and returns id", async () => {
    const res = await request.post("/save").send({ deviceId, article, analysis });
    assert.equal(res.status, 201);
    assert.ok(res.body.id);
    savedId = res.body.id;
  });

  it("POST /save on duplicate returns existing id without error", async () => {
    const res = await request.post("/save").send({ deviceId, article, analysis });
    assert.equal(res.status, 200);
    assert.equal(res.body.id, savedId);
  });

  it("GET /saved returns saved article", async () => {
    const res = await request.get(`/saved?deviceId=${deviceId}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.articles));
    assert.equal(res.body.articles.length, 1);
    assert.equal(res.body.articles[0].title, article.title);
  });

  it("GET /saved returns 400 without deviceId", async () => {
    const res = await request.get("/saved");
    assert.equal(res.status, 400);
  });

  it("DELETE /saved/:id removes the article", async () => {
    const res = await request.delete(`/saved/${savedId}?deviceId=${deviceId}`);
    assert.equal(res.status, 200);
  });

  it("GET /saved returns empty after deletion", async () => {
    const res = await request.get(`/saved?deviceId=${deviceId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.articles.length, 0);
  });

  it("DELETE /saved/:id returns 404 for non-existent id", async () => {
    const res = await request.delete(`/saved/non-existent-id?deviceId=${deviceId}`);
    assert.equal(res.status, 404);
  });
});
