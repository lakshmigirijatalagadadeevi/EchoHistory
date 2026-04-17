import { useSaved } from "../hooks/useSaved.js";
import SavedCard from "../components/SavedCard.jsx";
import "../styles/SavedPage.css";

export default function SavedPage() {
  const { saved, loading, remove } = useSaved();

  return (
    <div className="saved-page">
      <div className="saved-header">
        <h2 className="saved-heading">Saved Echoes</h2>
        <span className="saved-count">{saved.length}</span>
      </div>

      {loading ? (
        <div className="saved-loading">
          <div className="pulse-dot" />
          <span>Loading saved...</span>
        </div>
      ) : saved.length === 0 ? (
        <div className="saved-empty">
          <span className="empty-icon">&#128278;</span>
          <p>No saved echoes yet.</p>
          <p className="empty-sub">Bookmark headlines from the feed to see them here.</p>
        </div>
      ) : (
        <div className="saved-list">
          {saved.map((article) => (
            <SavedCard
              key={article.id}
              article={article}
              onRemove={() => remove(article.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
