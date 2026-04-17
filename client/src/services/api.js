const API_BASE = "";

export async function fetchNews(category = "general", page = 1) {
  const res = await fetch(`${API_BASE}/news?category=${category}&page=${page}`);
  if (!res.ok) throw new Error("Failed to fetch news");
  const data = await res.json();
  return data.articles;
}

export async function analyzeHeadline(title) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to analyze headline");
  return res.json();
}

export async function batchAnalyze(titles) {
  const res = await fetch(`${API_BASE}/analyze/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titles }),
  });
  if (!res.ok) throw new Error("Batch analysis failed");
  return res.json();
}

export async function saveArticle(deviceId, article, analysis) {
  const res = await fetch(`${API_BASE}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, article, analysis }),
  });
  if (!res.ok) throw new Error("Failed to save article");
  return res.json();
}

export async function getSavedArticles(deviceId) {
  const res = await fetch(`${API_BASE}/saved?deviceId=${encodeURIComponent(deviceId)}`);
  if (!res.ok) throw new Error("Failed to get saved articles");
  const data = await res.json();
  return data.articles;
}

export async function deleteSavedArticle(id, deviceId) {
  const res = await fetch(`${API_BASE}/saved/${id}?deviceId=${encodeURIComponent(deviceId)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete article");
  return res.json();
}
