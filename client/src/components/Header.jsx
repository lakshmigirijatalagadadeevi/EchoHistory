import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Header.css";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="echo-header">
      <h1 className="echo-title" onClick={() => navigate("/")}>
        EchoHistory
      </h1>
      <button
        className={`nav-btn ${!isHome ? "active" : ""}`}
        onClick={() => navigate(isHome ? "/saved" : "/")}
        aria-label={isHome ? "View saved" : "Back to feed"}
      >
        {isHome ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        )}
      </button>
    </header>
  );
}
