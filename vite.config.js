import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  // 3D kütüphaneleri (three, R3F, drei) tembel yüklenen sahne parçasında; uyarı eşiği buna göre
  build: {
    chunkSizeWarningLimit: 1200,
    // Sık değişmeyen kütüphaneler ayrı parçada: dağıtımlar arasında tarayıcı önbelleğinde kalır
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/node_modules\/(three|postprocessing)\//.test(id)) return 'three'
          if (/node_modules\/(@react-three|three-stdlib|maath|n8ao|meshline|troika|camera-controls|zustand)/.test(id)) return 'r3f'
          if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion'
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
        },
      },
    },
  },
})
