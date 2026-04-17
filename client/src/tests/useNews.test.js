import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useNews } from "../hooks/useNews.js";

// ── Mock the API module ───────────────────────────────────────────────────────

const makePage = (prefix, count = 10) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    title: `${prefix} headline ${i}`,
    description: "desc",
    image: null,
    source: "TestSource",
    publishedAt: new Date().toISOString(),
    url: "https://example.com",
  }));

const makeAnalysis = (titles) =>
  titles.map((title) => ({
    title,
    event: "Test Event",
    year: "1999",
    category: "Testing",
    explanation: "Test explanation.",
  }));

vi.mock("../services/api.js", () => ({
  fetchNews: vi.fn(),
  batchAnalyze: vi.fn(),
}));

import { fetchNews, batchAnalyze } from "../services/api.js";

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useNews — initial load", () => {
  it("starts in loading state", () => {
    fetchNews.mockResolvedValue(makePage("p1"));
    batchAnalyze.mockResolvedValue(makeAnalysis(makePage("p1").map((a) => a.title)));

    const { result } = renderHook(() => useNews());
    expect(result.current.loading).toBe(true);
    expect(result.current.articles).toHaveLength(0);
  });

  it("populates articles after load", async () => {
    const page = makePage("p1");
    fetchNews.mockResolvedValue(page);
    batchAnalyze.mockResolvedValue(makeAnalysis(page.map((a) => a.title)));

    const { result } = renderHook(() => useNews());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.articles).toHaveLength(10);
    expect(result.current.articles[0].title).toBe("p1 headline 0");
  });

  it("populates analyses map keyed by title", async () => {
    const page = makePage("p1");
    fetchNews.mockResolvedValue(page);
    batchAnalyze.mockResolvedValue(makeAnalysis(page.map((a) => a.title)));

    const { result } = renderHook(() => useNews());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.analyses["p1 headline 0"]).toBeDefined();
    expect(result.current.analyses["p1 headline 0"].year).toBe("1999");
  });

  it("sets error state when fetch fails", async () => {
    fetchNews.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useNews());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Network error");
    expect(result.current.articles).toHaveLength(0);
  });
});

describe("useNews — category switching", () => {
  it("resets articles when category changes", async () => {
    const page1 = makePage("general");
    const page2 = makePage("tech");

    fetchNews
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);
    batchAnalyze.mockResolvedValue(makeAnalysis(page1.map((a) => a.title)));

    const { result } = renderHook(() => useNews());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.articles[0].title).toMatch(/general/);

    // Switch to technology
    batchAnalyze.mockResolvedValue(makeAnalysis(page2.map((a) => a.title)));
    result.current.changeCategory("technology");

    await waitFor(() =>
      expect(result.current.articles[0]?.title).toMatch(/tech/)
    );
    expect(result.current.articles).toHaveLength(10); // reset, not appended
  });

  it("clears analyses from previous category", async () => {
    const page1 = makePage("general");
    const page2 = makePage("sports", 10);

    fetchNews.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);
    batchAnalyze.mockResolvedValue(makeAnalysis(page1.map((a) => a.title)));

    const { result } = renderHook(() => useNews());
    await waitFor(() => expect(result.current.loading).toBe(false));

    batchAnalyze.mockResolvedValue(makeAnalysis(page2.map((a) => a.title)));
    result.current.changeCategory("sports");

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Old general headlines should no longer be in analyses
    expect(result.current.analyses["general headline 0"]).toBeUndefined();
  });

  it("fetches with correct category param when changed", async () => {
    fetchNews.mockResolvedValue(makePage("x"));
    batchAnalyze.mockResolvedValue([]);

    const { result } = renderHook(() => useNews());
    await waitFor(() => expect(result.current.loading).toBe(false));

    result.current.changeCategory("sports");
    await waitFor(() => expect(fetchNews).toHaveBeenCalledWith("sports", 1));
  });
});

describe("useNews — pagination (loadMore)", () => {
  it("appends articles on loadMore", async () => {
    const page1 = makePage("p1", 10);
    const page2 = makePage("p2", 10);

    fetchNews.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);
    batchAnalyze
      .mockResolvedValueOnce(makeAnalysis(page1.map((a) => a.title)))
      .mockResolvedValueOnce(makeAnalysis(page2.map((a) => a.title)));

    const { result } = renderHook(() => useNews());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.articles).toHaveLength(10);

    result.current.loadMore();
    await waitFor(() => expect(result.current.loadingMore).toBe(false));

    expect(result.current.articles).toHaveLength(20);
    expect(result.current.articles[10].title).toMatch(/p2/);
  });

  it("sets hasMore=false when page returns fewer than 10 articles", async () => {
    fetchNews
      .mockResolvedValueOnce(makePage("p1", 10))
      .mockResolvedValueOnce(makePage("p2", 5)); // partial page
    batchAnalyze.mockResolvedValue([]);

    const { result } = renderHook(() => useNews());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);

    result.current.loadMore();
    await waitFor(() => expect(result.current.loadingMore).toBe(false));

    expect(result.current.hasMore).toBe(false);
  });

  it("does not fire duplicate requests when loadMore called rapidly", async () => {
    fetchNews.mockResolvedValue(makePage("p1", 10));
    batchAnalyze.mockResolvedValue([]);

    const { result } = renderHook(() => useNews());
    await waitFor(() => expect(result.current.loading).toBe(false));

    result.current.loadMore();
    result.current.loadMore(); // second call should be ignored
    result.current.loadMore(); // third call should be ignored

    await waitFor(() => expect(result.current.loadingMore).toBe(false));

    // fetchNews called once for initial + once for loadMore (not 3x)
    expect(fetchNews).toHaveBeenCalledTimes(2);
  });
});
