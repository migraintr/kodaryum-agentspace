// lucide-react ikonlarından (ISC lisansı) seçilenleri tek dosyada toplar → ../kaynak/ikonlar.js
import { pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
const NAMES = ['clock','moon','users','user','user-round','git-branch','banknote','wrench','chart-no-axes-column','message-circle','repeat','briefcase','store','building-2','building','brain','sparkles','send','chart-line','shield-check','shield','calendar','calendar-days','megaphone','map-pin','star','search','pencil','image','check','check-check','x','ban','circle-alert','triangle-alert','lightbulb','target','rocket','layers','database','server','key-round','lock','cpu','cloud','smartphone','mail','zap','eye','thumbs-up','scissors','utensils','stethoscope','shopping-bag','shopping-cart','hotel','house','graduation-cap','code','factory','dumbbell','car','flag','trophy','gauge','compass','route','workflow','bot','crown','palette','globe','refresh-cw','hand','circle-check','list-checks','file-text','percent','trending-up','trending-down','wallet','gift','heart','camera','video','hash','instagram','phone','map','package','handshake','scale','fingerprint','badge-check','filter','play','pause','arrow-right','chevrons-right','bell','inbox','link','activity','circle-dollar-sign','coins','hourglass','timer','box','puzzle','book-open','pie-chart','chart-pie','sun']
const out = {}
for (const n of NAMES) {
  try {
    const m = await import(pathToFileURL(resolve(`node_modules/lucide-react/dist/esm/icons/${n}.mjs`)).href)
    out[n] = m.__iconData.node.map(([tag, a]) => { const { key, ...r } = a; return [tag, r] })
  } catch { console.warn('yok:', n) }
}
writeFileSync('docs/video/kaynak/ikonlar.js', '// lucide ikonları (ISC lisansı) — ikonlar.mjs ile üretildi\nwindow.ICONS = ' + JSON.stringify(out) + ';\n')
console.log(Object.keys(out).length, 'ikon')
