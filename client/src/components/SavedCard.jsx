import "../styles/SavedCard.css";

export default function SavedCard({ article, onRemove }) {
  return (
    <div className="saved-card">
      {article.image && (
        <div
          className="saved-card-img"
          style={{ backgroundImage: `url(${article.image})` }}
        />
      )}
      <div className="saved-card-content">
        <span className="saved-card-source">{article.source}</span>
        <h3 className="saved-card-title">{article.title}</h3>

        {article.analysis?.event && (
          <div className="saved-card-insight">
            <span className="saved-insight-year">{article.analysis.year}</span>
            <span className="saved-insight-event">{article.analysis.event}</span>
          </div>
        )}

        <div className="saved-card-actions">
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="saved-link-btn"
            >
              Read article
            </a>
          )}
          <button className="saved-remove-btn" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
