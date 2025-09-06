import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Allow external connections (required for Docker)
    port: 8080, // Use Cloud Run's PORT or default to 8080
    // Allow any host for development and Cloud Run
    allowedHosts: "all",
  },
  build: {
    outDir: "dist",
  },
});
