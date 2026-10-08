import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { aiMiddleware } from './server/http.js'

// Gemini (Vertex AI) uç noktaları geliştirme ve önizleme sunucusunda da çalışır: /api/ai/*
// Anahtar yalnızca sunucu tarafında okunur (key.json / .env), tarayıcı paketine girmez.
function geminiApi() {
  return {
    name: 'kodaryum-gemini-api',
    configureServer(server) {
      server.middlewares.use(aiMiddleware())
    },
    configurePreviewServer(server) {
      server.middlewares.use(aiMiddleware())
    },
  }
}

export default defineConfig(({ mode }) => {
  // .env içindeki sunucu ayarları (GEMINI_MODEL, GOOGLE_CLOUD_LOCATION, GOOGLE_APPLICATION_CREDENTIALS…)
  for (const [k, v] of Object.entries(loadEnv(mode, process.cwd(), ''))) process.env[k] ??= v
  return {
    plugins: [react(), tailwindcss(), geminiApi()],
    server: { port: 5173 },
    // 3D kütüphaneleri (three, R3F, drei) tembel yüklenen sahne parçasında; uyarı eşiği buna göre
    build: { chunkSizeWarningLimit: 1200 },
  }
})
