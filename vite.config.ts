import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const env = loadEnv('development', process.cwd(), 'VITE_')
const API_BASE = env.VITE_API_BASE_URL ?? 'http://localhost:3001'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5175,
    allowedHosts: ['.ngrok-free.app', 'host.docker.internal'],
    proxy: {
      '/api': {
        target: API_BASE,
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
      '/uploads': {
        target: API_BASE,
        changeOrigin: true,
        secure: false,
      },
      '/rails/active_storage': {
        target: API_BASE,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
