import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function charsetPlugin() {
  const applyToServer = (server) => {
    server.middlewares.use((_req, res, next) => {
      const orig = res.setHeader.bind(res)
      res.setHeader = (name, value) => {
        if (
          name.toLowerCase() === 'content-type' &&
          typeof value === 'string' &&
          value.startsWith('text/html') &&
          !value.includes('charset')
        ) {
          return orig(name, `${value}; charset=utf-8`)
        }
        return orig(name, value)
      }
      next()
    })
  }
  return {
    name: 'html-charset',
    configureServer: applyToServer,
    configurePreviewServer: applyToServer,
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    charsetPlugin(),
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