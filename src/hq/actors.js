// Hareketli çalışanların senaryoları. Her senaryo bir generator: her karede bir kez ilerletilir (yield → dt).
// Yardımcılar: walk (yol noktalarından yürü, köşede yavaşla, hedefte yumuşak dur), turnTo (yerinde dön),
// moveTo (oturma/kalkma kayması), hold (bekle), until (koşul bekle).
//
// Denetçi (Operasyon · Serkan Polat): masasından kalkar → Tasarım, Muhasebe, Araştırma, Pazarlama, Yazılım
// odalarını sırayla denetler (odada durur, etrafı tarar, tablete not alır; bulguları canlı veriden) →
// CEO ofisindeki koltuğa oturur → Kağan Bey masasından kalkıp karşı koltuğa geçer → istişare (karşılıklı
// konuşma balonları) → rapor ve karar sohbete düşer → herkes yerine döner. Döngü sürekli tekrarlanır.
import { DEPT_BY_ID, PEOPLE, PERSON_BY_ID, PROJECTS } from '../data.js'
import { aiAvailable, aiWrite, buildContext } from '../ai.js'
import { dat, projectStats, useStore } from '../store.js'
import { C, CEO_SEAT, CHAIR_GAP, CORRIDOR_Z as CZ, DESKS, ROOM_BY_ID } from './plan.js'

export const INSPECTOR = 'tolga'
export const MEET = { phase: 'idle' } // touring → arrived → seated → done
export const STATES = {} // id → hareket durumu (diğer senaryolar konuşma balonunu buradan açar)

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a))
const ease = (k) => k * k * (3 - 2 * k)

export function* walk(st, pts, speed = 1.15) {
  st.action = 'walk'
  for (let i = 0; i < pts.length; i++) {
    const [tx, tz] = pts[i]
    const last = i === pts.length - 1
    for (;;) {
      const dx = tx - st.x
      const dz = tz - st.z
      const d = Math.hypot(dx, dz)
      if (d < (last ? 0.015 : 0.22)) break
      const dt = yield
      const diff = wrap(Math.atan2(dx, dz) - st.yaw)
      st.yaw += diff * Math.min(1, dt * 5.5)
      const vmax = speed * clamp(Math.cos(Math.min(Math.abs(diff), 1.45)), 0.25, 1) // keskin dönüşte yavaşla
      const vt = last ? Math.min(vmax, Math.sqrt(2 * 1.3 * d)) : vmax // hedefe yaklaşırken yumuşak dur
      st.v += clamp(vt - st.v, -2.6 * dt, 1.5 * dt)
      const s = Math.min(d, Math.max(0.02 * dt, st.v * dt))
      st.x += (dx / d) * s
      st.z += (dz / d) * s
    }
  }
  st.v = 0
  st.action = 'idle'
}

export function* turnTo(st, yaw, rate = 2.4) {
  st.action = 'idle'
  for (;;) {
    const diff = wrap(yaw - st.yaw)
    if (Math.abs(diff) < 0.02) {
      st.yaw = yaw
      return
    }
    const dt = yield
    st.yaw += Math.sign(diff) * Math.min(Math.abs(diff), rate * dt)
  }
}

export function* hold(st, secs, action) {
  if (action) st.action = action
  let t = 0
  while (t < secs) t += yield
}

export function* until(st, cond, action) {
  if (action) st.action = action
  while (!cond()) yield
}

function* moveTo(st, x, z, secs, action) {
  st.action = action
  const x0 = st.x
  const z0 = st.z
  let t = 0
  while (t < secs) {
    t += yield
    const k = ease(Math.min(1, t / secs))
    st.x = x0 + (x - x0) * k
    st.z = z0 + (z - z0) * k
  }
}

// seat: { x, z, ry, stand: [x, z] } — kök noktası, oturuş yönü ve kalkınca durulacak yer
export function* sitDown(st, seat, action = 'type') {
  yield* walk(st, [seat.stand])
  yield* turnTo(st, seat.ry)
  yield* moveTo(st, seat.x, seat.z, 0.7, action)
}
export function* standUp(st, seat) {
  yield* moveTo(st, seat.stand[0], seat.stand[1], 0.6, 'idle')
  yield* hold(st, 0.25, 'idle')
}

function* say(st, text, secs, action) {
  st.say = text
  st.speaking = true
  yield* hold(st, secs, action)
  st.say = null
  st.speaking = false
}

// ── Oturma yerleri
const [yx, yz] = C(ROOM_BY_ID.get('yonetim'))
const opDesk = DESKS.operasyon[1]
export const SEATS = {
  inspectorDesk: { x: opDesk.x, z: opDesk.z + CHAIR_GAP - 0.07, ry: Math.PI, stand: [opDesk.x + 0.58, opDesk.z + CHAIR_GAP + 0.12] },
  ceoDesk: { x: CEO_SEAT.x, z: CEO_SEAT.z + 0.07, ry: 0, stand: [CEO_SEAT.x + 0.58, CEO_SEAT.z] },
  guest: { x: yx - 1.08, z: yz + 1.0, ry: Math.PI / 2, stand: [yx - 0.55, yz + 1.0] }, // CEO ofisi sol koltuk
  host: { x: yx + 1.08, z: yz + 1.0, ry: -Math.PI / 2, stand: [yx + 0.55, yz + 1.0] }, // CEO ofisi sağ koltuk
}

// ── Oda denetim rotaları: koridordaki kapı noktasından odadaki gözlem noktasına
const ROUTES = {
  tasarim: { path: [[6.0, CZ], [6.0, -2.0], [6.0, -3.6], [9.0, -3.6]], face: Math.PI },
  muhasebe: { path: [[1.1, CZ], [1.1, 1.0], [1.1, 2.0], [0.55, 3.0], [0.55, 5.9], [5.2, 5.9]], face: Math.PI },
  arastirma: { path: [[-6.4, CZ], [-6.4, 1.0], [-6.4, 2.0], [-6.95, 3.2], [-6.95, 6.0], [-3.75, 6.0]], face: Math.PI },
  pazarlama: { path: [[-13.9, CZ], [-13.9, 1.0], [-13.9, 2.0], [-13.9, 3.3], [-8.4, 3.3], [-8.4, 5.5]], face: -Math.PI / 2 },
  yazilim: { path: [[-7.55, CZ], [-7.55, -2.0], [-7.55, -4.15]], face: -Math.PI / 2 },
}
const TOUR = ['tasarim', 'muhasebe', 'arastirma', 'pazarlama', 'yazilim']
const NOTES = {
  tasarim: 'moodboard güncel, ekranlar kalibre',
  muhasebe: 'arşiv ve kasa kilitli',
  arastirma: 'veri setleri yedekli',
  pazarlama: 'kampanya panosu güncel',
  yazilim: 'sunucu odası sıcaklığı normal',
}
// Operasyon masasından koridora ve geri
const OP_OUT = [[opDesk.x + 0.58, 6.05], [8.05, 6.05], [8.05, 3.0], [8.6, 2.0], [8.6, 1.0], [8.6, CZ]]
const CEO_IN = [[-1.6, CZ], [-1.6, -2.4], [yx - 0.55, yz + 2.0]]
const CEO_HOST_PATH = [[yx + 1.6, CEO_SEAT.z], [yx + 1.65, yz + 0.1], [yx + 0.55, yz + 0.5]]

// Odanın canlı durumu (masadaki ekip, aktif görevler, ortalama ilerleme, en geride kalan iş)
export function roomReport(id) {
  const s = useStore.getState()
  const team = PEOPLE.filter((p) => p.dept === id)
  const act = s.tasks.filter((t) => t.status === 'active' && PERSON_BY_ID.get(t.owner)?.dept === id)
  const avg = act.length ? Math.round(act.reduce((n, t) => n + t.progress, 0) / act.length) : null
  const lag = [...act].sort((a, b) => a.progress - b.progress)[0] ?? null
  return { id, name: DEPT_BY_ID.get(id).name, people: team.length, active: act.length, avg, lag, note: NOTES[id] }
}
const repLine = (r) => `${r.people}/${r.people} masada · ${r.active} görev${r.avg != null ? ` · %${r.avg}` : ''}`

// Gemini'nin istişare çıktısı: yalnızca biçimi doğruysa kullanılır, aksi hâlde eski sabit diyalog
const clipText = (v, n) => String(v ?? '').trim().slice(0, n)
function validMeeting(d) {
  const lines = (d?.lines ?? []).filter((l) => (l?.who === 'ins' || l?.who === 'ceo') && clipText(l.text, 120)).slice(0, 8).map((l) => [l.who, clipText(l.text, 120)])
  if (lines.length < 4) return null
  return { lines, report: clipText(d.report, 900), summary: clipText(d.summary, 600) }
}

export function* inspectorScript(st) {
  const ins = PERSON_BY_ID.get(INSPECTOR)
  yield* hold(st, 6, 'type')
  for (;;) {
    // 1) Tura çık
    MEET.phase = 'touring'
    st.say = 'Kat denetimine çıkıyorum.'
    yield* standUp(st, SEATS.inspectorDesk)
    st.say = null
    yield* walk(st, OP_OUT)
    const findings = []
    // 2) Odaları sırayla denetle
    for (const id of TOUR) {
      const R = ROUTES[id]
      useStore.getState().tourEvent({ status: 'walking', room: null, next: id })
      yield* walk(st, [R.path[0]])
      yield* walk(st, R.path.slice(1))
      yield* turnTo(st, R.face)
      st.say = `${DEPT_BY_ID.get(id).name} denetleniyor…`
      yield* hold(st, 2.4, 'inspect')
      const rep = roomReport(id)
      findings.push(rep)
      // pano ve oda panellerindeki canlı tur kaydı
      const note = `${repLine(rep)} — ${rep.note}`
      const level = rep.lag && rep.lag.progress < 20 ? 'warn' : 'ok'
      useStore.getState().tourEvent({ status: 'inspecting', room: id, note, level }, { at: Date.now(), room: id, note, level })
      st.say = `✓ ${repLine(rep)}`
      yield* hold(st, 2.8, 'inspect')
      st.say = null
      yield* walk(st, R.path.slice(0, -1).reverse())
    }
    // Rapor ve karar verisi (yürürken hazır): Gemini istişareyi yazarken denetçi CEO ofisine yürür
    const busiest = [...findings].sort((a, b) => b.active - a.active)[0]
    const lag = findings.map((r) => r.lag).filter(Boolean).sort((a, b) => a.progress - b.progress)[0]
    const risk = PROJECTS[0].risks.find((r) => r.level === 'yuksek') ?? PROJECTS[0].risks[0]
    const lagOwner = lag && PERSON_BY_ID.get(lag.owner)
    const helper = lag && PEOPLE.find((p) => p.dept === lagOwner.dept && p.id !== lag.owner && !lag.helpers.includes(p.id))
    let ai // undefined = bekleniyor · null = yok/geçersiz · nesne = hazır
    if (!aiAvailable()) ai = null
    else {
      const gs = useStore.getState()
      aiWrite({
        kind: 'meeting',
        findings: findings.map((r) => ({ room: r.name, people: r.people, activeTasks: r.active, avgProgress: r.avg, note: r.note, lagging: r.lag ? { no: r.lag.no, title: r.lag.title, progress: Math.round(r.lag.progress) } : null })),
        busiest: { room: busiest.name, activeTasks: busiest.active },
        lag: lag ? { no: lag.no, title: lag.title, progress: Math.round(lag.progress), owner: lagOwner.name } : null,
        risk: { text: risk.text, level: risk.level, owner: PERSON_BY_ID.get(risk.owner).name },
        decision: lag ? `#${lag.no} “${lag.title}” işine ${helper ? helper.name : 'ekipten biri'} destek verilecek; ${busiest.name} ekibinin yükü izlenecek; kritik risk sahibi ${PERSON_BY_ID.get(risk.owner).name} bugün öncelik alacak.` : `${busiest.name} ekibinin yükü izlenecek; kritik risk sahibi ${PERSON_BY_ID.get(risk.owner).name} bugün öncelik alacak.`,
        context: buildContext(gs, projectStats),
      })
        .then((r) => (ai = validMeeting(r.data)))
        .catch(() => (ai = null))
    }

    // 3) CEO ofisi: koltuğa otur, Kağan Bey'i bekle
    yield* walk(st, CEO_IN)
    yield* sitDown(st, SEATS.guest, 'chat')
    MEET.phase = 'arrived'
    yield* say(st, 'Kağan Bey, kat turunu tamamladım.', 2.4, 'chat')
    yield* until(st, () => MEET.phase === 'seated', 'chat')

    // 4) Rapor sohbete, ardından istişare (Gemini yanıtı en fazla 6 sn beklenir; gelmezse sabit diyalog)
    st.action = 'chat'
    for (let w = 0; ai === undefined && w < 6; ) w += yield
    if (ai === undefined) ai = null
    useStore.getState().post(
      'RELAY',
      ai?.report
        ? `Kat denetimi tamamlandı (${findings.length} oda):\n${ai.report}`
        : `Kat denetimi tamamlandı (${findings.length} oda):\n${findings.map((r) => `• ${r.name}: ${repLine(r)} — ${r.note}`).join('\n')}\nEn yoğun ekip: ${busiest.name}. Kağan Bey’le istişaredeyim.`,
      { boardId: 'operasyon', agent: ins.name.toLocaleUpperCase('tr-TR') },
    )
    const lines = ai?.lines ?? [
      ['ins', 'Raporu sohbete ilettim. Bütün odalar düzenli.'],
      ['ceo', `Teşekkürler ${ins.name}. Nerede sıkışma var?`],
      ['ins', `${busiest.name} çok yoğun: ${busiest.active} aktif görev.`],
      ['ceo', lag ? `#${lag.no} geride kalmış (%${Math.round(lag.progress)}). ${dat(lagOwner.name)} destek verelim.` : 'O ekibe bir destek kaydıralım.'],
      ['ins', `Bir de kritik risk: ${risk.text.charAt(0).toLocaleLowerCase('tr-TR')}${risk.text.slice(1)}.`],
      ['ceo', `${dat(PERSON_BY_ID.get(risk.owner).name)} bugün öncelik veriyorum.`],
      ['ins', 'Anlaşıldı, takipteyim.'],
      ['ceo', 'Eline sağlık. Bir sonraki turda görüşürüz.'],
    ]
    for (const [who, text] of lines) {
      const s = who === 'ins' ? st : STATES.ada
      if (!s) continue
      s.say = text
      s.speaking = true
      yield* hold(st, clamp(text.length * 0.065, 2.4, 4.2), 'chat')
      s.say = null
      s.speaking = false
      yield* hold(st, 0.35, 'chat')
    }
    // Karar: geride kalan işe aynı ekipten destek ata
    if (lag) {
      useStore.setState((s) => ({
        tasks: s.tasks.map((t) => (t.no === lag.no ? { ...t, helpers: helper ? [...t.helpers, helper.id] : t.helpers, progress: Math.min(99, t.progress + 4) } : t)),
      }))
      useStore
        .getState()
        .post(
          'CEO',
          ai?.summary
            ? `${ins.name}’la denetim istişaresi tamamlandı.\n${ai.summary}`
            : `${ins.name}’la denetim istişaresi tamamlandı.\n• ${busiest.name} ekibinin yükünü yakından izliyorum.\n• #${lag.no} “${lag.title}” için ${helper ? `${dat(helper.name)}` : 'ekibe'} destek görevi verdim.\n• Kritik risk: ${risk.text} — sorumlu ${PERSON_BY_ID.get(risk.owner).name}.\nSonraki kat turu birkaç dakika içinde.`,
          { delegations: [DEPT_BY_ID.get(lagOwner.dept).board, 'operasyon'].filter(Boolean), project: lag.project },
        )
    }
    MEET.phase = 'done'
    yield* hold(st, 1.2, 'chat')

    // 5) Masaya dön, bir süre çalış
    yield* standUp(st, SEATS.guest)
    yield* walk(st, [...CEO_IN].reverse())
    yield* walk(st, [...OP_OUT].reverse().slice(1))
    yield* sitDown(st, SEATS.inspectorDesk, 'type')
    yield* hold(st, 22, 'type')
  }
}

export function* ceoScript(st) {
  for (;;) {
    yield* until(st, () => MEET.phase === 'arrived', 'type')
    st.say = 'Hoş geldin, hemen geliyorum.'
    yield* hold(st, 1.2, 'type')
    yield* standUp(st, SEATS.ceoDesk)
    st.say = null
    yield* walk(st, CEO_HOST_PATH, 1.05)
    yield* sitDown(st, SEATS.host, 'chat')
    MEET.phase = 'seated'
    yield* until(st, () => MEET.phase === 'done', 'chat')
    yield* hold(st, 0.8, 'chat')
    yield* standUp(st, SEATS.host)
    yield* walk(st, [...CEO_HOST_PATH].reverse(), 1.05)
    yield* sitDown(st, SEATS.ceoDesk, 'type')
  }
}
if (import.meta.env.DEV) Object.assign(window, { __meet: MEET, __actors: STATES }) // geliştirme: test erişimi
