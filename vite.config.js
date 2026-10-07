import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  // 3D kütüphaneleri (three, R3F, drei) tembel yüklenen sahne parçasında; uyarı eşiği buna göre
  build: { chunkSizeWarningLimit: 1200 },
})
