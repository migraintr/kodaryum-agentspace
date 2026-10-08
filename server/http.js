// /api/ai/* uç noktaları (Node http · Vite geliştirme/önizleme sunucusu · server/index.js üretim sunucusu ortak):
//   GET  /api/ai/status   → yapılandırma ve son çağrının durumu (anahtar bilgisi döndürmez)
//   POST /api/ai/ping     → kısa bağlantı testi
//   POST /api/ai/chat     → Kağan'ın sohbet yanıtı
//   POST /api/ai/write    → ajan güncellemesi / CEO brifingi / denetim istişaresi ({ kind })
import { aiStatus, chat, ping, rateLimit, write } from './ai.js'

const MAX_BODY = 256 * 1024

function readJson(req) {
  return new Promise((res, rej) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) {
        rej(Object.assign(new Error('İstek çok büyük'), { status: 413 }))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => {
      try {
        res(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {})
      } catch {
        rej(Object.assign(new Error('Geçersiz JSON'), { status: 400 }))
      }
    })
    req.on('error', rej)
  })
}

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

// Kullanıcıya gösterilecek kısa hata (ayrıntı sunucu günlüğünde)
function explain(e) {
  const m = `${e?.status ?? ''} ${e?.message ?? e}`
  if (e?.code === 'NOT_CONFIGURED') return [503, e.message]
  if (/PERMISSION_DENIED|403/.test(m)) return [502, 'Vertex AI erişimi reddedildi: hizmet hesabına "Vertex AI User" rolü verin ve Vertex AI API’yi etkinleştirin.']
  if (/UNAUTHENTICATED|401|invalid_grant/.test(m)) return [502, 'Google kimlik doğrulaması başarısız: key.json geçersiz ya da iptal edilmiş olabilir.']
  if (/not.?found|404/i.test(m)) return [502, 'Model bulunamadı: GEMINI_MODEL ve GOOGLE_CLOUD_LOCATION ayarlarını kontrol edin.']
  if (/RESOURCE_EXHAUSTED|429|quota/i.test(m)) return [429, 'Vertex AI kotası doldu, biraz sonra tekrar deneyin.']
  if (/abort|timeout|DEADLINE/i.test(m)) return [504, 'Gemini yanıtı zaman aşımına uğradı.']
  return [502, 'Gemini isteği başarısız oldu.']
}

/** Connect/Express uyumlu ara katman: /api/ai dışındaki istekleri next()'e bırakır */
export function aiMiddleware() {
  return async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://x')
    if (!url.pathname.startsWith('/api/ai/')) return next?.()
    const route = url.pathname.slice('/api/ai/'.length)
    try {
      if (req.method === 'GET' && route === 'status') return send(res, 200, aiStatus())
      if (req.method !== 'POST') return send(res, 405, { error: 'Yöntem desteklenmiyor' })
      const ip = (req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || '?').trim()
      const limited = rateLimit(ip)
      if (limited) return send(res, 429, { error: limited })
      const body = await readJson(req)
      const t0 = Date.now()
      let out
      if (route === 'chat') out = await chat(body)
      else if (route === 'write') out = await write(body)
      else if (route === 'ping') out = await ping()
      else return send(res, 404, { error: 'Bilinmeyen uç nokta' })
      console.info(`[ai] ${route}${body.kind ? `/${body.kind}` : ''} · ${out.meta.model} · ${Date.now() - t0} ms · ${out.meta.inTokens}+${out.meta.outTokens} token`)
      return send(res, 200, out)
    } catch (e) {
      const [status, msg] = e?.status && e.status < 500 && !e.code ? [e.status, e.message] : explain(e)
      if (status !== 503) console.warn(`[ai] ${route} hata:`, String(e?.message ?? e).slice(0, 400))
      return send(res, status, { error: msg })
    }
  }
}
