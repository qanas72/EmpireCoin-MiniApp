import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Resolve built assets relative to the Mini App URL. This avoids
  // absolute-path issues in Telegram's embedded Android webview.
  base: './',
})