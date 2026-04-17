import { useState, useEffect, useCallback } from "react";
import { getSavedArticles, saveArticle, deleteSavedArticle } from "../services/api.js";
import { useDeviceId } from "./useDeviceId.js";

export function useSaved() {
  const deviceId = useDeviceId();
  const [saved, setSaved] = useState([]);
  const [savedTitles, setSavedTitles] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const arts = await getSavedArticles(deviceId);
      setSaved(arts);
      setSavedTitles(new Set(arts.map((a) => a.title)));
    } catch (err) {
      console.error("Failed to load saved:", err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (article, analysis) => {
      try {
        await saveArticle(deviceId, article, analysis);
        setSavedTitles((prev) => new Set([...prev, article.title]));
        await load();
      } catch (err) {
        console.error("Failed to save:", err);
      }
    },
    [deviceId, load]
  );

  const remove = useCallback(
    async (id) => {
      try {
        await deleteSavedArticle(id, deviceId);
        await load();
      } catch (err) {
        console.error("Failed to delete:", err);
      }
    },
    [deviceId, load]
  );

  const isSaved = useCallback(
    (title) => savedTitles.has(title),
    [savedTitles]
  );

  const getSavedId = useCallback(
    (title) => saved.find((a) => a.title === title)?.id ?? null,
    [saved]
  );

  return { saved, loading, save, remove, isSaved, getSavedId, refresh: load };
}
