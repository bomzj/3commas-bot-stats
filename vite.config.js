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

  server: {
    proxy: {
      // Netlify functions server on localhost has a bug that crashes every 5-10 mins, so we have to use Live server instead
      '/.netlify/functions/cors-proxy': {
        // Netlify functions dev server has bug that crashes each 5 mins or so, 
        // we have to use Live server
        target: 'https://3commas-bot-stats.netlify.app',
        headers: { host: '3commas-bot-stats.netlify.app' }
      }
    }
  }
})