import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// We read BASE_PATH from the environment at build time.
// For GitHub Pages we'll set BASE_PATH=/motion-webapp/ in the workflow.
export default defineConfig(() => ({
  plugins: [react()],
  base: process.env.BASE_PATH ?? "/", // default for local/Cloudflare
}));
