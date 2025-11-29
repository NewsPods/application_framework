import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'
import * as path from "node:path";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(),tailwindcss(),],
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-main-tauri`
      ignored: ["**/src-main-tauri/**"],
    },
  },

    build: {
        minify: "esbuild",     // fastest + smallest output
        sourcemap: false,      // removes ~30–50% of APK size
        target: "es2017",      // modern target = smaller bundles
        cssMinify: true,       // minify CSS
        chunkSizeWarningLimit: 2000, // avoid spam, optional
    },
}));
