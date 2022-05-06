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
      '/.netlify/functions/cors-proxy': {
        target: 'http://localhost:3001/',       
        headers: { 'Host': 'api.3commas.io'} // lets fake host due to 3commas rejects requests from localhost
      }
    }
  }
})