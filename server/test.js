// Gemini bağlantı testi: `npm run ai:test`
// key.json (hizmet hesabı) ile Vertex AI'ın global uç noktasındaki modele kısa bir istek gönderir.
import { aiStatus, ping } from './ai.js'

try {
  process.loadEnvFile?.('.env')
} catch {
  /* .env yok */
}

const st = aiStatus()
console.log(`Sağlayıcı: ${st.provider} · proje: ${st.project || '—'} · konum: ${st.location} · model: ${st.model}\n`)
if (!st.configured) {
  console.error('Yapılandırma eksik:', st.reason)
  process.exit(1)
}
console.log(`${st.model} modeline istek gönderiliyor…\n`)
try {
  const { data, meta } = await ping()
  console.log('================ BAŞARILI ================')
  console.log(data.text)
  console.log('==========================================')
  console.log(`${meta.model} · ${meta.ms} ms · ${meta.inTokens}+${meta.outTokens} token`)
} catch (e) {
  console.error('Hata detayı:', e?.message ?? e)
  process.exit(1)
}
