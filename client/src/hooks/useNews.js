import { useState, useEffect, useCallback, useRef } from "react";
import { fetchNews, batchAnalyze } from "../services/api.js";

export function useNews() {
  const [articles, setArticles] = useState([]);
  const [analyses, setAnalyses] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState("general");
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(1);
  const categoryRef = useRef("general");
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

  const loadPage = useCallback(async (cat, pg) => {
    const isFirst = pg === 1;
    if (isFirst) setLoading(true);
    else setLoadingMore(true);
    loadingMoreRef.current = true;
    setError(null);

    try {
      const arts = await fetchNews(cat, pg);
      if (arts.length < 10) {
        setHasMore(false);
        hasMoreRef.current = false;
      }

      setArticles((prev) => (isFirst ? arts : [...prev, ...arts]));

      const titles = arts.map((a) => a.title);
      const results = await batchAnalyze(titles);
      setAnalyses((prev) => {
        const map = { ...prev };
        results.forEach((r, i) => {
          if (r && !r.error) map[arts[i].title] = r;
        });
        return map;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, []);

  // Reset and reload when category changes
  useEffect(() => {
    categoryRef.current = category;
    pageRef.current = 1;
    hasMoreRef.current = true;
    setHasMore(true);
    setAnalyses({});
    loadPage(category, 1);
  }, [category, loadPage]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    loadPage(categoryRef.current, nextPage);
  }, [loadPage]);

  const changeCategory = useCallback((cat) => {
    setCategory(cat);
  }, []);

  const refresh = useCallback(() => {
    categoryRef.current = category;
    pageRef.current = 1;
    hasMoreRef.current = true;
    setHasMore(true);
    setAnalyses({});
    loadPage(category, 1);
  }, [category, loadPage]);

  return {
    articles,
    analyses,
    loading,
    loadingMore,
    error,
    hasMore,
    category,
    changeCategory,
    loadMore,
    refresh,
  };
}
