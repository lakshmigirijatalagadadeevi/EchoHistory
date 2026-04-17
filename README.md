# EchoHistory

A swipe-based news app that connects today's headlines with similar historical events using AI. Built mobile-first with a neon-themed UI.

## How It Works

Open the app, swipe through today's top US headlines (TikTok-style vertical cards), and tap each card to reveal an AI-generated historical parallel. Bookmark the ones that fascinate you.

## Tech Stack

- **Frontend:** React 18, Vite, Swiper.js, React Router
- **Backend:** Node.js, Express
- **Database:** SQLite (via better-sqlite3)
- **AI:** OpenAI API (gpt-4o-mini)
- **News:** GNews (primary), MediaStack (fallback), NewsAPI (dev fallback)
- **Mobile:** Capacitor (iOS-first)

## Prerequisites

- Node.js 18+
- At least one news API key (GNews recommended)
- OpenAI API key (optional — app works without it using built-in fallbacks)

## API Keys

| Service | Free Tier | Signup |
|---------|-----------|--------|
| GNews (recommended) | 100 requests/day, works in production | https://gnews.io/register |
| MediaStack | 500 requests/month | https://mediastack.com/signup/free |
| NewsAPI | Unlimited in dev, localhost only | https://newsapi.org/register |
| OpenAI | Pay-per-use (~$0.15/1M input tokens) | https://platform.openai.com/api-keys |

## Setup

```bash
# Clone and enter the project
cd echohistory

# Configure environment
cp .env.example server/.env
# Edit server/.env with your API keys

# Install dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Run both server and client
npm run dev
```

The client opens at **http://localhost:5173** and the server runs on **http://localhost:3001**. Vite proxies all `/news`, `/analyze`, `/save`, and `/saved` routes to the backend automatically.

## Project Structure

```
echohistory/
├── server/
│   ├── index.js                  # Express server + middleware + rate limiting
│   ├── db/
│   │   └── database.js           # SQLite setup, schema, migrations
│   ├── controllers/
│   │   ├── newsController.js     # GNews → MediaStack → NewsAPI cascade
│   │   ├── analyzeController.js  # OpenAI + caching + fallback table
│   │   └── savedController.js    # CRUD for bookmarked articles
│   └── routes/
│       ├── news.js               # GET /news
│       ├── analyze.js            # POST /analyze, POST /analyze/batch
│       └── saved.js              # POST /save, GET /saved, DELETE /saved/:id
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── capacitor.config.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── services/
│       │   └── api.js            # All API call functions
│       ├── hooks/
│       │   ├── useNews.js        # Fetch + batch pre-analyze
│       │   ├── useSaved.js       # Bookmark state management
│       │   └── useDeviceId.js    # Anonymous device identity
│       ├── components/
│       │   ├── Header.jsx        # Glowing title + nav
│       │   ├── NewsCard.jsx      # Full-screen swipe card
│       │   ├── SavedCard.jsx     # Compact saved article card
│       │   └── Loader.jsx        # Animated loading screen
│       ├── pages/
│       │   ├── FeedPage.jsx      # Swiper vertical feed
│       │   └── SavedPage.jsx     # Bookmarked articles list
│       └── styles/
│           ├── global.css        # Neon theme variables + animations
│           ├── Header.css
│           ├── NewsCard.css
│           ├── SavedCard.css
│           ├── FeedPage.css
│           ├── SavedPage.css
│           └── Loader.css
└── .env.example
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/news` | Top 10 US headlines (cached 15 min) |
| POST | `/analyze` | AI historical match for a single headline |
| POST | `/analyze/batch` | AI historical match for multiple headlines at once |
| POST | `/save` | Bookmark an article + its analysis |
| GET | `/saved?deviceId=xxx` | Get all bookmarks for a device |
| DELETE | `/saved/:id?deviceId=xxx` | Remove a bookmark |
| GET | `/health` | Server health check |

## Architecture Decisions

**Cascading news sources.** The server tries GNews first, falls back to MediaStack, then NewsAPI. This means you can configure one, two, or all three — the app gracefully degrades.

**Batch pre-fetching.** When the feed loads, all 10 headlines are sent to `/analyze/batch` simultaneously. By the time you swipe to card 3, its historical insight is already cached. No per-swipe loading spinners.

**AI response caching.** Each headline is SHA-256 hashed and cached in SQLite with a 7-day TTL. Identical headlines across sessions hit the cache instead of OpenAI, protecting your budget.

**Built-in fallback table.** If OpenAI is down, slow, or unconfigured, the server matches headline keywords against 8 pre-written historical parallels covering war, economy, elections, climate, tech, pandemics, space, and immigration. The app always returns something meaningful.

**Rate limiting.** The `/analyze` endpoint is limited to 30 requests per minute per IP. General endpoints allow 100 requests per minute. This prevents runaway OpenAI costs from repeated refreshes.

**Anonymous device identity.** Bookmarks are scoped to a device ID stored in a cookie — no login required, no personal data collected.

**Tap-to-reveal UX.** The historical insight panel starts collapsed with a teaser prompt. Tapping reveals the full analysis. This keeps the swipe experience clean and makes discovering the historical connection feel intentional.

## Building for iOS

```bash
cd client

# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/ios

# Initialize and add iOS platform
npx cap add ios

# Build the web app and sync to native
npm run build
npx cap sync ios

# Open in Xcode
npx cap open ios
```

Requirements for iOS deployment:
- macOS with Xcode installed
- Apple Developer account ($99/year)
- Update the `server` config in `capacitor.config.json` to point to your production backend URL before building for release

## Testing Locally

1. **Health check:** `curl http://localhost:3001/health` should return `{"status":"ok"}`
2. **News feed:** `curl http://localhost:3001/news` should return 10 articles
3. **Single analysis:** `curl -X POST http://localhost:3001/analyze -H "Content-Type: application/json" -d '{"title":"Stock market hits record high"}'`
4. **Open the client** at http://localhost:5173 — you should see the neon loading screen, then swipeable cards

## Known Limitations

- GNews free tier caps at 100 requests/day — the 15-minute server cache helps stretch this
- MediaStack free tier is HTTP only (no HTTPS)
- `better-sqlite3` requires native compilation — run `xcode-select --install` on Mac if npm install fails
- The OpenAI key is optional but without it you only get keyword-matched fallbacks, not tailored historical parallels
- No user authentication — bookmarks are device-scoped, not account-scoped

## License

MIT
