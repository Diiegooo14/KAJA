import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost',
        rewrite: (path) => path.replace(/^\/api/, '/kaja/backend/Api'),
        changeOrigin: true,
      },
    },
  },
})