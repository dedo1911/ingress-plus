import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
    server: {
    proxy: {
      '/api': {
        target: 'https://ingress.plus',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [sveltekit()]
})
