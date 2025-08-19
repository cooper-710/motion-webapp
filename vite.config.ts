import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Use relative asset paths in production so it works under any subpath.
  // (Dev server still uses "/")
  base: mode === 'production' ? './' : '/',
}))
