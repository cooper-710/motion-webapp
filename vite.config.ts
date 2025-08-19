// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Read BASE_PATH from the GitHub Action, without needing @types/node
const base = (process as any)?.env?.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
});
