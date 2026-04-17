import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/tests/setup.js",
  },
  server: {
    port: 5173,
    proxy: {
      "/news": "http://localhost:3001",
      "/analyze": "http://localhost:3001",
      "/save": "http://localhost:3001",
      "/saved": "http://localhost:3001",
      "/health": "http://localhost:3001",
    },
  },
});
