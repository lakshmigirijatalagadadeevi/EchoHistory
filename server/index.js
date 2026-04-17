import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import newsRoutes from "./routes/news.js";
import analyzeRoutes from "./routes/analyze.js";
import savedRoutes from "./routes/saved.js";

const app = express();

app.use(cors());
app.use(express.json());

const analyzeLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many analysis requests. Try again in a minute." },
});

const generalLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests." },
});

app.use("/analyze", analyzeLimit);
app.use(generalLimit);

app.use("/news", newsRoutes);
app.use("/analyze", analyzeRoutes);
app.use("/save", savedRoutes);
app.use("/saved", savedRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;

// Only start listening when run directly (not imported by tests)
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`⚡ EchoHistory server running on http://localhost:${PORT}`);
  });
}
