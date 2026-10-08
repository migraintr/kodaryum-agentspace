// Gemini (Google Cloud · Vertex AI) bağlantısı — yalnızca sunucuda çalışır, tarayıcıya hiçbir anahtar gitmez.
// Kimlik: hizmet hesabı anahtarı (key.json). Yol: GOOGLE_APPLICATION_CREDENTIALS ya da proje kökündeki ./key.json.
// Proje: GOOGLE_CLOUD_PROJECT ya da key.json içindeki project_id. Konum: GOOGLE_CLOUD_LOCATION (varsayılan global).
// Model: GEMINI_MODEL (varsayılan gemini-3.8-flash); bulunamazsa GEMINI_FALLBACK_MODELS sırayla denenir.
//
// Görevler (hepsi yapılandırılmış JSON döner):
//  · chat     — Kağan'ın sohbet yanıtı: yanıt metni, niyet, (gerekirse) görev planı, arayüz eylemleri, takip önerileri
//  · agent    — ajanın sohbete düştüğü kısa iş güncellemesi (görevi aldı / bitirdi)
//  · brief    — Kağan'ın kendiliğinden proje güncellemesi
//  · meeting  — denetçi ↔ CEO istişare diyaloğu + denetim raporu + karar özeti
import { GoogleGenAI } from '@google/genai'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { basename, resolve } from 'node:path'

const env = (k, d) => process.env[k]?.trim() || d

// ── İstemci (tembel kurulur; key.json sonradan eklenirse sunucuyu yeniden başlatmaya gerek yok) ──────
let client = null
let clientKey = '' // kurulduğu anahtar dosyasının imzası (yol + değişim zamanı)
let project = ''
let activeModel = ''
const last = { ok: null, at: 0, error: '', ms: 0, model: '' }

const keyPath = () => resolve(env('GOOGLE_APPLICATION_CREDENTIALS', './key.json'))
const models = () => [env('GEMINI_MODEL', 'gemini-3.8-flash'), ...env('GEMINI_FALLBACK_MODELS', 'gemini-2.5-flash').split(',')].map((m) => m.trim()).filter(Boolean)

function getClient() {
  const kp = keyPath()
  if (!existsSync(kp)) {
    client = null
    return { error: `Kimlik dosyası bulunamadı (${basename(kp)}). Hizmet hesabı anahtarını proje köküne key.json olarak koyun.` }
  }
  const sig = `${kp}:${statSync(kp).mtimeMs}`
  if (client && sig === clientKey) return { client }
  try {
    const key = JSON.parse(readFileSync(kp, 'utf8'))
    if (key.type !== 'service_account' || !key.client_email || !key.private_key) return { error: 'key.json bir hizmet hesabı anahtarı değil (type: service_account bekleniyor).' }
    project = env('GOOGLE_CLOUD_PROJECT', key.project_id)
    if (!project) return { error: 'Google Cloud proje kimliği bulunamadı (key.json → project_id).' }
    process.env.GOOGLE_APPLICATION_CREDENTIALS = kp // google-auth-library için
    client = new GoogleGenAI({
      vertexai: true,
      project,
      location: env('GOOGLE_CLOUD_LOCATION', 'global'), // Gemini 3.x modelleri global uç noktada
      googleAuthOptions: { keyFile: kp, scopes: ['https://www.googleapis.com/auth/cloud-platform'] },
    })
    clientKey = sig
    activeModel = ''
    return { client }
  } catch (e) {
    client = null
    return { error: `key.json okunamadı: ${e.message}` }
  }
}

const mask = (p) => (p ? `${p.slice(0, Math.min(6, Math.ceil(p.length / 2)))}…` : '')
export function aiStatus() {
  const c = getClient()
  return {
    configured: !!c.client,
    reason: c.error ?? null,
    model: activeModel || models()[0],
    location: env('GOOGLE_CLOUD_LOCATION', 'global'),
    project: mask(project),
    provider: 'Vertex AI',
    last: { ...last },
  }
}

// ── Hız sınırı (bellek içi): istemci başına dakikada N istek + günlük toplam ─────────────────────────
const RATE = { perMin: +env('AI_RATE_PER_MIN', 40), perDay: +env('AI_RATE_PER_DAY', 3000) }
const hits = new Map()
let day = { d: '', n: 0 }
export function rateLimit(ip) {
  const now = Date.now()
  const today = new Date().toISOString().slice(0, 10)
  if (day.d !== today) day = { d: today, n: 0 }
  if (day.n >= RATE.perDay) return 'Günlük yapay zekâ istek sınırına ulaşıldı.'
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000)
  if (list.length >= RATE.perMin) return 'Çok sık istek gönderildi, birkaç saniye sonra tekrar deneyin.'
  list.push(now)
  hits.set(ip, list)
  day.n++
  return null
}

// ── Model çağrısı: JSON şemalı yanıt, zaman aşımı, geçici hatada tekrar, model bulunamazsa yedeğe geç ────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const isModelMissing = (e) => /not.?found|404|does not exist|unsupported model|is not supported/i.test(`${e?.status ?? ''} ${e?.message ?? ''}`)
const isTransient = (e) => /429|500|502|503|504|RESOURCE_EXHAUSTED|UNAVAILABLE|DEADLINE|ECONNRESET|ETIMEDOUT|fetch failed/i.test(`${e?.status ?? ''} ${e?.message ?? ''}`)
const thinking = (model) => (/^gemini-2\.5/.test(model) ? { thinkingBudget: 0 } : { thinkingLevel: env('GEMINI_THINKING', 'low') })

async function generate({ system, prompt, schema, temperature = 0.6, maxTokens = 1400, timeout = 30_000 }) {
  const c = getClient()
  if (!c.client) throw Object.assign(new Error(c.error), { code: 'NOT_CONFIGURED' })
  const list = activeModel ? [activeModel, ...models().filter((m) => m !== activeModel)] : models()
  let lastErr
  for (const model of list) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const t0 = Date.now()
      try {
        const res = await c.client.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction: system,
            temperature,
            maxOutputTokens: maxTokens,
            responseMimeType: 'application/json',
            responseSchema: schema,
            thinkingConfig: thinking(model),
            abortSignal: AbortSignal.timeout(timeout),
          },
        })
        const text = res.text ?? ''
        let data
        try {
          data = JSON.parse(text)
        } catch {
          // nadiren JSON'u ``` içine alır: ilk { … son } arası
          const a = text.indexOf('{')
          const b = text.lastIndexOf('}')
          data = JSON.parse(text.slice(a, b + 1))
        }
        activeModel = model
        const ms = Date.now() - t0
        Object.assign(last, { ok: true, at: Date.now(), error: '', ms, model })
        const u = res.usageMetadata ?? {}
        return { data, meta: { model, ms, inTokens: u.promptTokenCount ?? 0, outTokens: u.candidatesTokenCount ?? 0 } }
      } catch (e) {
        lastErr = e
        if (isModelMissing(e)) break // bu model yok → sıradaki modele
        if (attempt === 0 && isTransient(e)) {
          await sleep(700 + Math.random() * 600)
          continue
        }
        throw record(e)
      }
    }
  }
  throw record(lastErr)
}
function record(e) {
  const msg = String(e?.message ?? e).slice(0, 300)
  Object.assign(last, { ok: false, at: Date.now(), error: msg })
  return e
}

// ── Şemalar (Vertex AI OpenAPI alt kümesi) ────────────────────────────────────────────────────────────
const S = (type, extra = {}) => ({ type, ...extra })
const str = (description, extra) => S('STRING', { description, ...extra })
const oneOf = (list) => (list.length ? { enum: list } : {}) // boş enum geçersiz şemadır

// ── Ortak kişilik ve kurallar ─────────────────────────────────────────────────────────────────────────
const TONE = `Her zaman Türkçe yaz; samimi ama profesyonel, kısa ve net ol. Markdown başlığı, kalın yazı (**), tablo ve kod bloğu kullanma; madde gerekiyorsa satır başında "• " kullan. Kişilerden adlarıyla bahset ve Türkçe ekleri doğru kullan (Okan’a, Esra’nın, Emre’ye). Emoji kullanma.`
const GROUNDING = `Yalnızca sana verilen ŞİRKET DURUMU verisine dayan: ilerleme yüzdeleri, kalan gün, bütçe, görev numaraları, kişiler ve tarihler oradan gelir. Veride olmayan kişi, görev, tarih ya da sayı uydurma; bilmediğin bir şey sorulursa bunu açıkça söyle.`

const block = (title, body) => `${title}:\n${typeof body === 'string' ? body : JSON.stringify(body)}`

// ── 1) Sohbet ────────────────────────────────────────────────────────────────────────────────────────
function chatSchema(ctx) {
  const agentIds = (ctx.team ?? []).map((a) => a.id)
  const depts = (ctx.departments ?? []).map((d) => d.id)
  const projects = [...(ctx.projects ?? []).map((p) => p.id), 'none']
  return S('OBJECT', {
    properties: {
      intent: str('answer | report | plan | clarify | action | smalltalk', { enum: ['answer', 'report', 'plan', 'clarify', 'action', 'smalltalk'] }),
      reply: str('Kurucuya gösterilecek yanıt metni (en fazla ~120 kelime)'),
      speaker: str("Yanıtı veren: 'ada' (Kağan) ya da kurucunun doğrudan seslendiği ajanın id'si", oneOf(['ada', ...agentIds])),
      project: str('Mesajın ilgili olduğu proje', oneOf(projects)),
      departments: S('ARRAY', { description: 'Yanıtta öne çıkan departmanlar (arayüzde oda çipleri)', items: str('departman id', oneOf(depts)) }),
      priority: str('Yalnızca kurucu aciliyet belirtirse', { enum: ['normal', 'yuksek', 'kritik'] }),
      plan: S('ARRAY', {
        description: "Yalnızca intent 'plan' iken: 1–6 görev",
        items: S('OBJECT', {
          properties: {
            owner: str('Görevi üstlenecek ajanın id’si (ekipten, en az yüklü ve en uygun kişi)', oneOf(agentIds)),
            title: str('Fiille başlayan kısa görev başlığı (≤ 60 karakter)'),
            helpers: S('ARRAY', { items: str('destek ajan id', oneOf(agentIds)) }),
            phase: S('INTEGER', { description: 'Projenin aşama sırası (0’dan başlar)' }),
          },
          required: ['owner', 'title'],
        }),
      }),
      actions: S('ARRAY', {
        description: 'Kurucu arayüzde bir şey isterse',
        items: S('OBJECT', {
          properties: {
            type: str('eylem', { enum: ['focusRoom', 'openView', 'openStaff', 'openCalendar', 'approvePlan', 'setPriority', 'overview'] }),
            target: str('focusRoom: departman id · openView: projeler | gorevler | departmanlar | ajanlar · setPriority: normal | yuksek | kritik'),
          },
          required: ['type'],
        }),
      }),
      followups: S('ARRAY', { description: 'Kurucunun sorabileceği 2–3 kısa takip önerisi (≤ 40 karakter)', items: str('öneri') }),
    },
    required: ['intent', 'reply', 'speaker', 'project'],
    propertyOrdering: ['intent', 'speaker', 'project', 'reply', 'departments', 'priority', 'plan', 'actions', 'followups'],
  })
}

function chatSystem(ctx) {
  const founders = (ctx.founders ?? []).join(' ve ') || 'kurucular'
  return [
    `Sen Kağan Yıldırım'sın: Kodaryum'un yapay zekâ CEO'su. Kodaryum AgentSpace'te ${ctx.team?.length ?? 20} yapay zekâ ajanından oluşan, altı departmanlı (Yazılım, Tasarım, Pazarlama, Araştırma, Muhasebe, Operasyon) ekibi yönetiyorsun. Şirketin kurucuları ${founders}; seninle sohbet panelinden konuşuyorlar. Bugün ${ctx.today}.`,
    TONE,
    GROUNDING,
    `Niyeti doğru seç:
• answer — soru ya da analiz (öncelikler, kim en yoğun, risk, bütçe, takvim, bir kişinin ne yaptığı, karşılaştırma). Plan ÜRETME; veriden somut cevap ver.
• report — genel durum/özet raporu istenirse. Kısa bir yönetici özeti yaz; arayüz ayrıca canlı proje kartlarını gösterir.
• plan — kurucu yeni bir iş yaptırmak istiyorsa (hazırla, yap, geliştir, tasarla, başlat, araştır, …sın/…sin). 1–6 görev öner. Her görevi işin doğasına en uygun departmandan, yükü (activeTasks) en az olan GERÇEK ajana ver (owner = ajan id). Başlık fiille başlasın, ≤ 60 karakter. Yanıtta planı kısaca anlat ve onay iste: görevler kurucu onaylayınca başlar.
• clarify — talep gerçekten belirsizse tek bir netleştirici soru sor ve 2–3 somut seçenek öner. "Anlayamadım" deyip bırakma.
• action — kurucu arayüzde bir şey isterse (odayı göster, projeler/görevler ekranını aç, takvimi aç, bekleyen planı onayla, önceliği değiştir, genel görünüm) uygun actions'ı ver ve kısaca söyle.
• smalltalk — selam, teşekkür, sohbet.`,
    `Proje: mesaj hangi projeyle ilgiliyse o (carsi = Kodaryum Çarşı, randevu = Randevu Mobil v2, yatirim = Q4 Yatırımcı Raporu); belli değilse seçili proje sekmesi; o da "all" ise ve konu genelse "none" (plan için "carsi").`,
    `"Bu hafta" ${ctx.week}. Önceki konuşmayı dikkate al; az önce verdiğin bilgiyi tekrarlama. Bekleyen (onaylanmamış) bir plan varsa ve kurucu "onayla/başlat" derse approvePlan eylemini ver.`,
    `Kurucu belirli bir ajana doğrudan sesleniyorsa ("@Esra", "Esra, …") speaker o ajanın id'si olsun ve yanıtı o ajanın ağzından, kendi işini bilerek yaz. Aksi hâlde speaker "ada".`,
  ].join('\n\n')
}

export async function chat(body) {
  const ctx = body.context ?? {}
  const history = (body.history ?? []).slice(-16).map((h) => `[${h.time ?? ''}] ${h.who}: ${String(h.text).slice(0, 600)}`).join('\n')
  const prompt = [
    block('ŞİRKET DURUMU (JSON)', ctx),
    block('SON KONUŞMA', history || '(yok)'),
    block(`KURUCUNUN YENİ MESAJI (${body.user ?? 'Kurucu'} · seçili proje sekmesi: ${body.tab ?? 'all'})`, String(body.text ?? '').slice(0, 1200)),
  ].join('\n\n')
  return generate({ system: chatSystem(ctx), prompt, schema: chatSchema(ctx), temperature: 0.55, maxTokens: 1600 })
}

// ── 2) Ajan güncellemesi · 3) CEO brifingi · 4) Denetim istişaresi ─────────────────────────────────────
const TEXT_SCHEMA = S('OBJECT', { properties: { text: str('Mesaj metni') }, required: ['text'] })
const MEETING_SCHEMA = S('OBJECT', {
  properties: {
    lines: S('ARRAY', {
      description: '6–8 replik; ins (denetçi) ile başlar, sırayla ins/ceo',
      items: S('OBJECT', { properties: { who: str('konuşan', { enum: ['ins', 'ceo'] }), text: str('konuşma balonu (≤ 80 karakter)') }, required: ['who', 'text'] }),
    }),
    report: str('Denetçinin sohbete yazdığı denetim raporu: her oda için "• Oda: …" satırı + en yoğun ekip (≤ 650 karakter)'),
    summary: str('Kağan’ın istişare sonrası karar özeti: 3–4 madde (≤ 420 karakter)'),
  },
  required: ['lines', 'report', 'summary'],
})

export async function write(body) {
  const kind = body.kind
  const ctx = body.context ?? {}
  if (kind === 'agent') {
    const a = body.agent ?? {}
    const system = [
      `Sen ${a.name} ${a.surname ?? ''}, Kodaryum'da ${a.role} (${a.dept} departmanı). Kodaryum AgentSpace'te çalışan bir yapay zekâ ajanısın; Kağan (CEO) ve kurucularla aynı sohbet kanalındasın.`,
      TONE,
      GROUNDING,
      body.event === 'done'
        ? 'Görevini bitirdin: ne teslim ettiğini, bir somut çıktı/ölçüm ve sıradaki adımı 1–2 cümlede yaz (≤ 230 karakter). "Görev #N tamamlandı" diye başla.'
        : 'Görevi yeni aldın: hemen atacağın ilk iki somut adımı 1–2 cümlede yaz (≤ 200 karakter). "#N aldım" diye başla.',
    ].join('\n\n')
    return generate({ system, prompt: block('GÖREV VE BAĞLAM (JSON)', { task: body.task, project: body.project, team: body.teamNote, ctx }), schema: TEXT_SCHEMA, temperature: 0.8, maxTokens: 300, timeout: 20_000 })
  }
  if (kind === 'brief') {
    const system = [
      `Sen Kağan Yıldırım'sın, Kodaryum'un yapay zekâ CEO'su. Kuruculara kendiliğinden kısa bir proje güncellemesi yazıyorsun. Bugün ${ctx.today}.`,
      TONE,
      GROUNDING,
      'En fazla 3 satır: genel ilerleme ve aşama, sıradaki kilometre taşı ve tarihi, en geride kalan iş için aldığın somut önlem. Her satır tek cümle. Önceki brifingi tekrar etme; farklı bir açıdan bak.',
    ].join('\n\n')
    return generate({ system, prompt: block('PROJE (JSON)', { project: body.project, previous: body.previous ?? null, ctx }), schema: TEXT_SCHEMA, temperature: 0.7, maxTokens: 400, timeout: 20_000 })
  }
  if (kind === 'meeting') {
    const system = [
      `İki yapay zekâ ajanının ofisteki istişaresini yazıyorsun: Serkan Polat (Operasyon Denetçisi, "ins") kat turunu bitirdi ve CEO Kağan Yıldırım'la ("ceo") CEO ofisindeki koltuklarda konuşuyor. Bugün ${ctx.today}.`,
      TONE,
      GROUNDING,
      'lines: 6–8 kısa replik (her biri ≤ 80 karakter, konuşma balonunda görünecek), denetçi başlar, sırayla konuşurlar. Bulguları, en yoğun ekibi, geride kalan işi ve kritik riski konuşun; CEO verilen KARAR’ı açıklasın. report: denetçinin sohbete yazdığı rapor. summary: Kağan’ın karar özeti; verilen karardaki kişi ve görev numaralarını aynen kullan.',
    ].join('\n\n')
    return generate({ system, prompt: block('DENETİM VERİSİ (JSON)', { findings: body.findings, busiest: body.busiest, lag: body.lag, risk: body.risk, decision: body.decision, ctx }), schema: MEETING_SCHEMA, temperature: 0.75, maxTokens: 1200, timeout: 25_000 })
  }
  throw Object.assign(new Error(`Bilinmeyen tür: ${kind}`), { code: 'BAD_REQUEST' })
}

// Bağlantı testi (arayüzdeki "bağlantıyı dene"): çok kısa bir istek
export async function ping() {
  return generate({
    system: TONE,
    prompt: 'Bağlantı başarılı mı? Kendini tek cümleyle tanıt ve kısa bir tebrik mesajı ver.',
    schema: TEXT_SCHEMA,
    temperature: 0.4,
    maxTokens: 120,
    timeout: 20_000,
  })
}
