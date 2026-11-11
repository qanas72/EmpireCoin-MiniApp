import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this project below /EmpireCoin-MiniApp/.
  // An explicit base keeps module and CSS asset URLs stable in Telegram WebView.
  base: '/EmpireCoin-MiniApp/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        nova: 'v4/index.html',
      },
    },
  },
})