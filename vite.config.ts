import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: [
        "**/worker/.wrangler/**",
        "**/worker/.dev.vars",
        "**/.secrets/**",
        "**/.dev.vars",
      ],
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8791",
        changeOrigin: false,
      },
    },
  },
  preview: {
    // The local desk bridge is a dev companion. Keep preview static so it
    // exercises the same snapshot fallback as Cloudflare Pages.
    proxy: {},
  },
});
