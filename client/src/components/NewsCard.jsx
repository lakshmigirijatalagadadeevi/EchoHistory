import { useState } from "react";
import "../styles/NewsCard.css";

export default function NewsCard({ article, analysis, isSaved, onSave, onUnsave, onShare }) {
  const [saving, setSaving] = useState(false);
  const [showInsight, setShowInsight] = useState(false);

  const handleBookmarkToggle = async () => {
    if (saving) return;
    setSaving(true);
    if (isSaved) await onUnsave();
    else await onSave();
    setSaving(false);
  };

  const placeholderImg = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="#111"><rect width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#333" font-size="18" font-family="sans-serif">EchoHistory</text></svg>'
  )}`;

  return (
    <div className="news-card">
      {/* Background image */}
      <div
        className="card-bg"
        style={{ backgroundImage: `url(${article.image || placeholderImg})` }}
      />
      <div className="card-overlay" />

      {/* Content */}
      <div className="card-content">
        <div className="card-top">
          <span className="card-source">{article.source}</span>
          <span className="card-date">
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </span>
        </div>

        <div className="card-body">
          <h2 className="card-title">{article.title}</h2>
          {article.description && (
            <p className="card-desc">{article.description}</p>
          )}
        </div>

        {/* AI Insight — tap to reveal */}
        <div
          className={`card-insight ${showInsight ? "revealed" : ""}`}
          onClick={() => setShowInsight(!showInsight)}
        >
          {!showInsight ? (
            <div className="insight-teaser">
              <span className="insight-icon">&#9201;</span>
              <span>Tap to reveal historical echo</span>
            </div>
          ) : analysis ? (
            <div className="insight-body">
              <div className="insight-badge">
                <span className="insight-year">{analysis.year}</span>
                <span className="insight-category">{analysis.category}</span>
              </div>
              <h3 className="insight-event">{analysis.event}</h3>
              <p className="insight-explanation">{analysis.explanation}</p>
            </div>
          ) : (
            <div className="insight-loading">
              <div className="pulse-dot" />
              <span>Finding historical echo...</span>
            </div>
          )}
        </div>
      </div>

      {/* Action FABs */}
      <div className="card-fabs">
        <button
          className="share-fab"
          onClick={onShare}
          aria-label="Share article"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
        <button
          className={`bookmark-fab ${isSaved ? "saved" : ""}`}
          onClick={handleBookmarkToggle}
          disabled={saving}
          aria-label={isSaved ? "Remove bookmark" : "Save article"}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      {/* Swipe hint */}
      <div className="swipe-hint">
        <span>swipe up</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </div>
    </div>
  );
}
