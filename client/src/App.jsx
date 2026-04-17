import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";
import FeedPage from "./pages/FeedPage.jsx";
import SavedPage from "./pages/SavedPage.jsx";
import "./styles/global.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<FeedPage />} />
            <Route path="/saved" element={<SavedPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
