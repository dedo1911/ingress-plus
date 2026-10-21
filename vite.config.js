import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      // Calculator requests should hit the local Go API during development,
      // where /api/mu-calc proxies the configurable MU calculation upstream.
      '/api/mu-calc': {
        target: process.env.MU_CALC_BACKEND_URL || 'http://127.0.0.1:8090',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'https://ingress.plus',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [sveltekit()]
})
