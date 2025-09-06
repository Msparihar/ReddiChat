import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Allow external connections (required for Docker)
    port: 5173,
  },
  build: {
    outDir: "dist",
  },
});
