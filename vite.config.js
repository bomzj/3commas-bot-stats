import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),

    quasar({
      sassVariables: 'src/quasar-variables.sass'
    })
  ],

  build: {
    // fix vite build crash due to using of top level await
    target: 'esnext'
  },

  server: {
    proxy: {
      // Overcome 3commas cors issues
      '/api/3commas': {
        target: 'https://api.3commas.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/3commas/, ''),
      }
    }
  }
})