// Üretim sunucusu: derlenmiş arayüzü (dist/) ve Gemini uç noktalarını (/api/ai/*) aynı adreste sunar.
// Google Cloud Run ya da herhangi bir Node ortamında: `npm run build && npm run serve` (PORT ortam değişkeni).
// Kimlik: GOOGLE_APPLICATION_CREDENTIALS ya da proje kökündeki key.json (bkz. server/ai.js). .env okunur.
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { aiMiddleware } from './http.js'

try {
  process.loadEnvFile?.('.env')
} catch {
  /* .env yok */
}

const DIST = resolve('dist')
const PORT = +(process.env.PORT || 8080)
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.glb': 'model/gltf-binary',
  '.exr': 'image/x-exr',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

const api = aiMiddleware()
createServer((req, res) => {
  api(req, res, () => {
    // statik dosya; bulunamazsa tek sayfalık uygulama (index.html)
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '')
    let file = join(DIST, path)
    if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html')
    const type = TYPES[extname(file)] ?? 'application/octet-stream'
    res.setHeader('Content-Type', type)
    res.setHeader('Cache-Control', file.startsWith(join(DIST, 'assets')) ? 'public, max-age=31536000, immutable' : 'no-cache')
    createReadStream(file).on('error', () => res.writeHead(404).end()).pipe(res)
  })
}).listen(PORT, () => console.info(`Kodaryum AgentSpace → http://localhost:${PORT}`))
