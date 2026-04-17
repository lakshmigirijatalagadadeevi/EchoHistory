const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const newsCache = new Map(); // key: `${category}-${page}`

const VALID_CATEGORIES = new Set([
  "general", "world", "nation", "business", "technology",
  "entertainment", "sports", "health", "science",
]);

async function fetchFromGNews(category, page) {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return null;

  const url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&country=us&max=10&page=${page}&apikey=${apiKey}`;
  const res = await fetch(url);
  const json = await res.json();

  if (!json.articles?.length) return null;

  return json.articles.map((a, i) => ({
    id: `gnews-${category}-${page}-${i}`,
    title: a.title,
    description: a.description || "",
    image: a.image || null,
    source: a.source?.name || "Unknown",
    publishedAt: a.publishedAt,
    url: a.url,
  }));
}

export async function getTopHeadlines(req, res) {
  try {
    const category = VALID_CATEGORIES.has(req.query.category)
      ? req.query.category
      : "general";
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const cacheKey = `${category}-${page}`;
    const now = Date.now();

    const cached = newsCache.get(cacheKey);
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    const articles = await fetchFromGNews(category, page).catch(() => null);

    if (!articles || articles.length === 0) {
      return res.status(502).json({
        error: "Unable to fetch news. Check your GNEWS_API_KEY in .env",
      });
    }

    const result = { articles, source: "gnews", fetchedAt: new Date().toISOString() };
    newsCache.set(cacheKey, { data: result, fetchedAt: now });

    res.json(result);
  } catch (err) {
    console.error("News fetch error:", err);
    res.status(500).json({ error: "Internal server error fetching news" });
  }
}
