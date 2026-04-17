import { useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel, Virtual } from "swiper/modules";
import "swiper/css";

import { useNews } from "../hooks/useNews.js";
import { useSaved } from "../hooks/useSaved.js";
import NewsCard from "../components/NewsCard.jsx";
import CategoryBar from "../components/CategoryBar.jsx";
import Loader from "../components/Loader.jsx";
import "../styles/FeedPage.css";

export default function FeedPage() {
  const {
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
  } = useNews();
  const { save, remove, isSaved, getSavedId } = useSaved();

  const handleSlideChange = useCallback(
    (swiper) => {
      if (hasMore && !loadingMore && swiper.activeIndex >= articles.length - 3) {
        loadMore();
      }
    },
    [hasMore, loadingMore, articles.length, loadMore]
  );

  const handleShare = useCallback((article, analysis) => {
    const text = analysis
      ? `"${article.title}"\n\nHistorical Echo: ${analysis.event} (${analysis.year})\n${analysis.explanation}\n\nvia EchoHistory`
      : `"${article.title}"\n\nvia EchoHistory`;

    if (navigator.share) {
      navigator.share({ title: article.title, text, url: article.url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
  }, []);

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="error-screen">
        <p className="error-text">{error}</p>
        <button className="retry-btn" onClick={refresh}>Try again</button>
      </div>
    );
  }

  if (!articles.length) {
    return (
      <div className="error-screen">
        <p className="error-text">No headlines available right now.</p>
        <button className="retry-btn" onClick={refresh}>Refresh</button>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <CategoryBar active={category} onChange={changeCategory} />
      <Swiper
        modules={[Mousewheel, Virtual]}
        direction="vertical"
        slidesPerView={1}
        mousewheel={{ forceToAxis: true }}
        virtual
        className="feed-swiper"
        onSlideChange={handleSlideChange}
      >
        {articles.map((article, index) => (
          <SwiperSlide key={article.id} virtualIndex={index}>
            <NewsCard
              article={article}
              analysis={analyses[article.title] || null}
              isSaved={isSaved(article.title)}
              onSave={() => save(article, analyses[article.title])}
              onUnsave={() => remove(getSavedId(article.title))}
              onShare={() => handleShare(article, analyses[article.title] || null)}
            />
          </SwiperSlide>
        ))}
        {loadingMore && (
          <SwiperSlide key="loading-more" virtualIndex={articles.length}>
            <div className="loading-more-slide">
              <div className="pulse-dot" />
              <span>Loading more stories…</span>
            </div>
          </SwiperSlide>
        )}
      </Swiper>
    </div>
  );
}
