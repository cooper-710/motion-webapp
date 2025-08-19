import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // set by the workflow (e.g. "/motion-webapp/"); defaults to "/"
  base: process.env.BASE_PATH || '/'
})
