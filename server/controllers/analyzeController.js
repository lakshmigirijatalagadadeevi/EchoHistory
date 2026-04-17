import OpenAI from "openai";
import crypto from "crypto";
import db from "../db/database.js";

let openai = null;

function getClient() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// Deterministic hash for cache key
function hashHeadline(title) {
  return crypto.createHash("sha256").update(title.trim().toLowerCase()).digest("hex");
}

// Cache TTL: 7 days — after this, a headline gets re-analyzed
const CACHE_TTL_DAYS = 7;

// Hardcoded fallbacks by keyword for when OpenAI is down/slow
const FALLBACKS = [
  { keywords: ["war", "military", "troops", "invasion"], event: "The Gulf of Tonkin Incident", year: "1964", category: "Military Conflict", explanation: "Escalations in military rhetoric have historically preceded major conflicts, as seen when disputed naval encounters led to deepened U.S. involvement in Vietnam." },
  { keywords: ["economy", "recession", "inflation", "market", "stock"], event: "The 1929 Stock Market Crash", year: "1929", category: "Economic Crisis", explanation: "Economic turbulence has echoed through history — the 1929 crash triggered a global depression and reshaped financial regulation for decades." },
  { keywords: ["election", "vote", "president", "democrat", "republican"], event: "The Election of 1876", year: "1876", category: "Political Crisis", explanation: "Disputed elections are nothing new — the 1876 race between Hayes and Tilden was settled by a controversial backroom deal that ended Reconstruction." },
  { keywords: ["climate", "storm", "hurricane", "flood", "wildfire"], event: "The Dust Bowl", year: "1930", category: "Environmental Disaster", explanation: "Environmental catastrophes have reshaped civilizations. The Dust Bowl displaced millions and fundamentally changed American agricultural policy." },
  { keywords: ["immigration", "\\bice\\b", "border", "migrant", "refugee", "deport", "detained", "asylum", "undocumented"], event: "Ellis Island Peak Immigration", year: "1907", category: "Immigration", explanation: "In 1907 alone, over 1 million immigrants passed through Ellis Island — debates over borders and belonging are deeply woven into American history." },
  { keywords: ["tech", "\\bai\\b", "robot", "artificial intelligence", "automation"], event: "The Luddite Movement", year: "1811", category: "Technology & Society", explanation: "Fear of technology replacing human labor dates back centuries — English textile workers destroyed machinery in protest of industrialization." },
  { keywords: ["pandemic", "virus", "disease", "health", "outbreak"], event: "The Spanish Flu", year: "1918", category: "Public Health", explanation: "The 1918 influenza pandemic infected a third of the world's population, killing an estimated 50 million — a stark precedent for modern outbreaks." },
  { keywords: ["space", "nasa", "rocket", "moon", "mars"], event: "The Apollo 11 Moon Landing", year: "1969", category: "Space Exploration", explanation: "Humanity's push beyond Earth mirrors the same ambition that put astronauts on the Moon during the height of the Cold War space race." },
];

export function getFallback(title) {
  const lower = title.toLowerCase();
  for (const fb of FALLBACKS) {
    if (fb.keywords.some((kw) => new RegExp(kw).test(lower))) {
      return { event: fb.event, year: fb.year, category: fb.category, explanation: fb.explanation };
    }
  }
  return {
    event: "The Printing Press Revolution",
    year: "1440",
    category: "Information & Society",
    explanation: "Every era has its defining headlines. Gutenberg's press democratized information much like the internet does today — reshaping power, politics, and public discourse.",
  };
}

const SYSTEM_PROMPT = `You are a historian connecting current news to historical events. Given a news headline, respond with EXACTLY this JSON format and nothing else:
{"event":"<historical event name>","year":"<year>","category":"<category>","explanation":"<2-3 sentence explanation connecting the headline to this historical event>"}
Be specific, accurate, and insightful. Choose surprising but meaningful parallels.`;

export async function analyzeHeadline(req, res) {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }

    // Check cache first
    const hash = hashHeadline(title);
    const cached = db.prepare("SELECT event, year, category, explanation FROM ai_cache WHERE headline_hash = ? AND created_at > datetime('now', ?)").get(hash, `-${CACHE_TTL_DAYS} days`);

    if (cached) {
      return res.json(cached);
    }

    // Try OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const fallback = getFallback(title);
      return res.json(fallback);
    }

    try {
      const client = getClient();
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: title },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const raw = completion.choices[0]?.message?.content?.trim();
      const parsed = JSON.parse(raw);

      const result = {
        event: parsed.event || "Unknown Event",
        year: parsed.year || "Unknown",
        category: parsed.category || "General",
        explanation: parsed.explanation || "No explanation available.",
      };

      // Cache the result
      db.prepare(
        "INSERT OR REPLACE INTO ai_cache (headline_hash, event, year, category, explanation) VALUES (?, ?, ?, ?, ?)"
      ).run(hash, result.event, result.year, result.category, result.explanation);

      return res.json(result);
    } catch (aiErr) {
      console.error("OpenAI call failed, using fallback:", aiErr.message);
      const fallback = getFallback(title);
      return res.json(fallback);
    }
  } catch (err) {
    console.error("Analyze error:", err);
    res.status(500).json({ error: "Failed to analyze headline" });
  }
}

// Batch analyze: fire off all headlines at once and cache results
export async function batchAnalyze(req, res) {
  try {
    const { titles } = req.body;
    if (!Array.isArray(titles)) {
      return res.status(400).json({ error: "titles must be an array" });
    }

    const results = await Promise.allSettled(
      titles.map(async (title) => {
        const hash = hashHeadline(title);
        const cached = db.prepare("SELECT event, year, category, explanation FROM ai_cache WHERE headline_hash = ? AND created_at > datetime('now', ?)").get(hash, `-${CACHE_TTL_DAYS} days`);
        if (cached) return { title, ...cached };

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return { title, ...getFallback(title) };

        try {
          const client = getClient();
          const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: title },
            ],
            temperature: 0.7,
            max_tokens: 300,
          });
          const parsed = JSON.parse(completion.choices[0]?.message?.content?.trim());
          const result = {
            event: parsed.event || "Unknown",
            year: parsed.year || "Unknown",
            category: parsed.category || "General",
            explanation: parsed.explanation || "",
          };
          db.prepare(
            "INSERT OR REPLACE INTO ai_cache (headline_hash, event, year, category, explanation) VALUES (?, ?, ?, ?, ?)"
          ).run(hash, result.event, result.year, result.category, result.explanation);
          return { title, ...result };
        } catch {
          return { title, ...getFallback(title) };
        }
      })
    );

    res.json(results.map((r) => (r.status === "fulfilled" ? r.value : { error: "failed" })));
  } catch (err) {
    console.error("Batch analyze error:", err);
    res.status(500).json({ error: "Batch analysis failed" });
  }
}
