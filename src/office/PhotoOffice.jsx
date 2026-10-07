// Gerçekçi ofis (2.5D dijital ikiz): fotogerçekçi kat görseli + canlı HTML katmanları.
// Kamera: tekerlekle imleç etrafında yakınlaştırma, sürükleyerek gezinme, odaya tıklayınca süzülerek odaklanma.
// Etiketler, rozetler, ADA balonu ve görev paketleri store'daki canlı veriden çizilir.
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { CEO, DEPARTMENTS, DEPT_BY_ID, PERSON_BY_ID, teamOf } from '../data.js'
import { agentTask, useStore } from '../store.js'
import {
  ADA_TO_HUB, BUBBLE, COFFEE, DESIGN_SCREEN, HEADS, HUB, KLOGO, MAP, PLAQUES, PLATE, RACKS, ROOMS, TAGS, box, routeTo,
} from './photoLayout.js'
import LivingPlate from './LivingPlate.jsx'
import './photo.css'

const { w: PW, h: PH } = PLATE
const MAX_Z = 2.4
const KLOGO_H = 54 // CEO ofisi arka duvarındaki logo yüksekliği (dünya birimi)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
// Kararlı sözde rastgele (etkilerin gecikmeleri her açılışta aynı)
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const hashStr = (s) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0

// ─── Kamera ──────────────────────────────────────────────────────────────────
// Masaüstünde ofis ekran genişliğini tam doldurur; yükseklik farkı en fazla %10 dikey esneme ile karşılanır
// (yan boşluk ya da etiket kırpması olmaz). Telefonda oran korunur ve yakın başlanıp sürükleyerek gezilir.
function useCamera(wrapRef, camRef, scaleRef) {
  const s = useRef({ cur: { x: PW / 2, y: PH / 2, z: 1 }, tgt: { x: PW / 2, y: PH / 2, z: 1 }, W: 1, H: 1, fx: 1, fy: 1 }).current

  const fit = (W, H) => {
    const ax = W / PW
    const ay = H / PH
    if (W < 1024) {
      const f = Math.min(ax, ay)
      return [f, f]
    }
    return [ax, clamp(ay, ax * 0.9, ax * 1.08)]
  }
  const bound = (p) => {
    const z = clamp(p.z, 1, MAX_Z)
    const hw = s.W / (2 * s.fx * z)
    const hh = s.H / (2 * s.fy * z)
    return { z, x: PW <= 2 * hw ? PW / 2 : clamp(p.x, hw, PW - hw), y: PH <= 2 * hh ? PH / 2 : clamp(p.y, hh, PH - hh) }
  }
  // Dönüşüm doğrudan DOM'a yazılır (React yeniden çizimi yok). Animasyon CSS geçişiyle GPU'da yürür;
  // yeni hedef geçiş sürerken verilirse tarayıcı bulunduğu yerden yumuşakça yeni hedefe döner.
  const apply = (ease = 'none') => {
    const Sx = s.fx * s.cur.z
    const Sy = s.fy * s.cur.z
    const el = camRef.current
    if (scaleRef) scaleRef.current = Sx
    wrapRef.current?.setAttribute('data-lod', s.cur.z > 1.2 ? 'near' : 'far')
    if (!el) return
    el.style.transition = ease === 'none' ? 'none' : `transform ${ease}`
    el.style.transform = `translate3d(${(s.W / 2 - s.cur.x * Sx).toFixed(2)}px,${(s.H / 2 - s.cur.y * Sy).toFixed(2)}px,0) scale(${Sx.toFixed(5)},${Sy.toFixed(5)})`
  }
  // instant: sürükleme · 'wheel': kısa geçiş · varsayılan: odaya süzülme
  const go = (p, mode) => {
    s.cur = s.tgt = bound(p)
    apply(mode === true ? 'none' : mode === 'wheel' ? '.22s ease-out' : '.75s cubic-bezier(.22,.8,.26,1)')
  }
  // Ekran (wrapper) koordinatı → dünya koordinatı
  const toWorld = (px, py, at = s.cur) => ({ x: at.x + (px - s.W / 2) / (s.fx * at.z), y: at.y + (py - s.H / 2) / (s.fy * at.z) })
  // Genel görünüm: kırpma gerekirse üstten %30, alttan %70 kırpılır (üst tabelalar korunur)
  const homeOf = () => {
    const z = s.W < 700 ? 2 : 1
    const hh = s.H / (2 * s.fy * z)
    return { x: PW / 2, y: PH <= 2 * hh ? PH / 2 : hh + (PH - 2 * hh) * 0.3, z }
  }

  useEffect(() => {
    const el = wrapRef.current
    const ro = new ResizeObserver(() => {
      const first = s.W === 1
      s.W = el.clientWidth || 1
      s.H = el.clientHeight || 1
      ;[s.fx, s.fy] = fit(s.W, s.H)
      if (first || s.cur.z <= 1.001) s.cur = homeOf()
      s.cur = bound(s.cur)
      s.tgt = bound(s.cur)
      apply()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const home = () => go(homeOf())
  return { s, go, bound, home, toWorld }
}

// ─── Statik efektler (bir kez çizilir, CSS ile canlanır) ────────────────────
const Effects = memo(function Effects() {
  const leds = useMemo(() => {
    const r = rng(7)
    const out = []
    RACKS.forEach(([x, y, w, h]) => {
      const cols = Math.max(3, Math.floor((w - 8) / 6))
      const rows = Math.floor((h - 18) / 6)
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          if (r() < 0.35) continue
          out.push({
            left: x + 4 + i * ((w - 8) / cols) + 1, top: y + 10 + j * 6,
            c: r() < 0.75 ? '#5fd0ff' : r() < 0.6 ? '#4dffb0' : '#ffb04d', d: `${(0.6 + r() * 3).toFixed(2)}s`, dl: `${(-r() * 4).toFixed(2)}s`,
          })
        }
    })
    return out
  }, [])
  return (
    <div className="po-layer po-fx">
      <i className="po-sweep" />
      {leds.map((l, i) => (
        <i key={i} className="po-led" style={{ left: l.left, top: l.top, '--c': l.c, '--d': l.d, '--dl': l.dl }} />
      ))}
      <img src="/logo.svg" alt="Kodaryum" draggable={false} className="po-klogo" style={{ left: KLOGO[0] - KLOGO_H * 0.43, top: KLOGO[1] - KLOGO_H / 2, height: KLOGO_H }} />
      <i className="po-scr" style={{ left: DESIGN_SCREEN.x, top: DESIGN_SCREEN.y, width: DESIGN_SCREEN.w, height: DESIGN_SCREEN.h }}>
        <i />
      </i>
      <svg className="po-map" viewBox={`0 0 ${MAP.w} ${MAP.h}`} style={{ left: MAP.x, top: MAP.y, width: MAP.w, height: MAP.h, overflow: 'visible' }}>
        {[[0, 2], [2, 3], [1, 4], [3, 5], [0, 1]].map(([a, b], i) => {
          const [x1, y1] = MAP.pins[a]
          const [x2, y2] = MAP.pins[b]
          return <path key={i} pathLength="1" d={`M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.min(y1, y2) - 9} ${x2} ${y2}`} style={{ '--dl': `${i * 0.6}s` }} />
        })}
        {MAP.pins.map(([x, y], i) => (
          <g key={i}>
            <circle className="r" cx={x} cy={y} r="2" style={{ '--dl': `${i * 0.27}s` }} />
            <circle cx={x} cy={y} r="1.3" fill="#ffb238" />
          </g>
        ))}
      </svg>
      {COFFEE.flatMap(([x, y], m) =>
        [0, 1, 2, 3].map((w) => <i key={`${m}${w}`} className="po-steam" style={{ left: x - 6, top: y - 10, '--dl': `${(w * 0.65 + m * 0.3).toFixed(2)}s` }} />),
      )}
    </div>
  )
})

// ─── Etiketler ───────────────────────────────────────────────────────────────
function Plaque({ id, active, onFocus }) {
  const d = DEPT_BY_ID.get(id)
  const p = PLAQUES[id]
  const k = box(p.b)
  const team = teamOf(id).length
  const chip = id === 'yonetim' ? CEO.name : id === 'mola' ? null : `${team}/${team}`
  return (
    <button
      type="button"
      className={`po-pq ${chip ? '' : 'solo'} ${active ? 'on' : ''}`}
      style={{ left: k.x + k.w / 2, top: k.y + k.h / 2, minWidth: k.w, height: k.h, '--g': d.color }}
      onClick={(e) => {
        e.stopPropagation()
        onFocus(id)
      }}
      onPointerDown={(e) => e.stopPropagation()}
      title={`${d.name} odasına odaklan`}
    >
      {p.text ?? d.name.toLocaleUpperCase('tr-TR')}
      {chip && (
        <span className="ch" style={{ '--c': p.chip, '--b': p.chipBorder }}>
          {chip}
        </span>
      )}
    </button>
  )
}

function Tag({ id, task, hit, onEnter, onLeave, onFocus }) {
  const t = TAGS[id]
  const person = PERSON_BY_ID.get(id)
  const k = box(t.b)
  const done = task?.status === 'done'
  const state = done ? 'done' : task?.status === 'active' ? 'work' : task ? 'wait' : 'idle'
  return (
    <div
      className={`po-tg ${state} ${hit ? 'hit' : ''}`}
      style={{ left: k.x + k.w / 2, top: k.y + k.h / 2, minWidth: k.w, height: k.h, '--c': DEPT_BY_ID.get(person.dept).color, animationDelay: hit ? `${hit}s` : undefined }}
      onPointerEnter={(e) => onEnter(id, e)}
      onPointerMove={(e) => onEnter(id, e)}
      onPointerLeave={onLeave}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onFocus(person.dept)
      }}
    >
      <i className="dot" />
      <b>{person.name.toLocaleUpperCase('tr-TR')}</b>
      <span className="rl">{person.label}</span>
      {task && !done && <em className="n">{task.no}</em>}
      {done && (
        <em className="n ok">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </em>
      )}
    </div>
  )
}

// Koridordaki canlı şerit: özet göstergeler + en son rapor (tıklayınca sohbet açılır)
function Ticker({ onOpen }) {
  const tasks = useStore((s) => s.tasks)
  const messages = useStore((s) => s.messages)
  const flying = useStore((s) => s.flights.length > 0)
  const active = tasks.filter((t) => t.status === 'active')
  const avg = active.length ? Math.round(active.reduce((n, t) => n + t.progress, 0) / active.length) : 100
  const pending = tasks.filter((t) => t.status === 'pending').length
  const last = messages.findLast((m) => m.from === 'RELAY' || m.from === 'CEO')
  const who = last?.from === 'CEO' ? 'ADA' : last?.agent
  return (
    <div className={`po-tick ${flying ? 'live' : ''}`} style={{ left: HUB[0], top: 337 }} onClick={onOpen} onPointerDown={(e) => e.stopPropagation()} title="ADA ile sohbeti aç">
      <span className="k"><b>{active.length}</b> aktif görev</span>
      <span className="k"><b>%{avg}</b> ilerleme</span>
      {pending > 0 && <span className="k warn"><b>{pending}</b> onay bekliyor</span>}
      <span className="msg">
        <i className="dot" />
        {last ? (
          <>
            <b>{who}</b> {last.text.split('\n')[0]}
          </>
        ) : (
          'ADA görevleri dağıtmaya hazır'
        )}
      </span>
    </div>
  )
}

function Bubble({ onOpen }) {
  const typing = useStore((s) => s.typing)
  const text = useStore((s) => s.adaSays)
  return (
    <div className="po-bub" style={{ left: BUBBLE.x, top: BUBBLE.y, width: BUBBLE.w, height: BUBBLE.h }} onClick={onOpen} onPointerDown={(e) => e.stopPropagation()} title="ADA ile sohbeti aç">
      <small>ADA - CEO</small>
      {typing ? (
        <p style={{ color: '#2a5bd8', paddingTop: 6 }}>
          <span className="po-dots">
            <i />
            <i />
            <i />
          </span>
        </p>
      ) : (
        <p>{text}</p>
      )}
    </div>
  )
}

// "Çalışıyor" balonları: aktif görevi olan ajanların başında ara ara belirir
function Typing({ tasks }) {
  return (
    <div className="po-layer">
      {Object.entries(HEADS).map(([id, [x, y]]) => {
        const p = PERSON_BY_ID.get(id)
        if (!p || p.onBreak || id === CEO.id) return null
        const busy = !!agentTask(tasks, id)
        const h = hashStr(id)
        const d = (busy ? 4.2 : 9) + (h % 30) / 10
        return (
          <div key={id} className="po-ty" style={{ left: x + 6, top: y - 30, '--d': `${d}s`, '--dl': `${-((h >>> 5) % 90) / 10}s` }}>
            <span className="po-dots">
              <i />
              <i />
              <i />
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Görev paketleri: merkezden ajanın isimliğine uçar
function Flights({ flights }) {
  return (
    <>
      <svg className="po-layer" viewBox={`0 0 ${PW} ${PH}`}>
        {flights.length > 0 && <path d={ADA_TO_HUB} pathLength="1" className="po-route" stroke="#ffb04d" strokeWidth="3" style={{ '--dl': '0s', animationDuration: '.5s, .8s' }} />}
        {flights.map((f) => (
          <g key={f.id}>
            <path d={routeTo(f.to)} pathLength="1" className="po-route" stroke={f.color} strokeOpacity=".35" strokeWidth="7" style={{ '--dl': `${f.delay + 0.4}s` }} />
            <path d={routeTo(f.to)} pathLength="1" className="po-route" stroke="#fff" strokeWidth="1.8" style={{ '--dl': `${f.delay + 0.4}s` }} />
          </g>
        ))}
      </svg>
      <div className="po-layer">
        {flights.map((f) => (
          <i key={f.id} className="po-packet" style={{ offsetPath: `path("${routeTo(f.to)}")`, '--c': f.color, '--dl': `${f.delay + 0.4}s` }} />
        ))}
      </div>
    </>
  )
}

// Ajan bilgi kartı (ekran koordinatında)
function AgentCard({ id, x, y, flip, tasks }) {
  const p = PERSON_BY_ID.get(id)
  const d = DEPT_BY_ID.get(p.dept)
  const task = agentTask(tasks, id)
  const status = p.onBreak ? ['Molada', '#f59e0b'] : task?.status === 'pending' ? ['Onay bekliyor', '#64748b'] : task ? ['Çalışıyor', '#10b981'] : ['Müsait', '#8b5cf6']
  return (
    <div
      className="pointer-events-none absolute z-30 w-[250px] rounded-xl border border-slate-200 bg-white/97 p-3 text-slate-800 shadow-[0_18px_40px_-12px_rgba(15,23,42,.45)] dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100"
      style={{ left: x, top: y, transform: `translate(${flip ? 'calc(-100% - 14px)' : '14px'}, -50%)` }}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[15px] font-bold text-white" style={{ background: `linear-gradient(140deg, ${d.color}, ${d.color}99)` }}>
          {p.name[0]}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-[14px] font-bold">{p.name}</p>
          <p className="truncate text-[11.5px] text-slate-500 dark:text-slate-400">{p.role}</p>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10.5px] font-semibold">
        <span className="rounded-md px-1.5 py-0.5" style={{ color: d.color, background: `${d.color}1f` }}>
          {d.name}
        </span>
        <span className="rounded-md px-1.5 py-0.5" style={{ color: status[1], background: `${status[1]}1f` }}>
          ● {status[0]}
        </span>
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{p.model}</span>
      </div>
      {task ? (
        <div className="mt-2.5 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/70">
          <p className="truncate text-[11.5px] font-semibold">
            #{task.no} {task.title}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <span className="block h-full rounded-full" style={{ width: `${task.progress}%`, background: d.color }} />
            </span>
            <span className="font-mono text-[10.5px] font-bold">%{Math.round(task.progress)}</span>
          </div>
        </div>
      ) : (
        <p className="mt-2.5 text-[11.5px] text-slate-500 dark:text-slate-400">{p.onBreak ? 'Kısa bir kahve molasında, birazdan masasında.' : 'Yeni görev için hazır.'}</p>
      )}
    </div>
  )
}

// ─── Ana bileşen ─────────────────────────────────────────────────────────────
export default function PhotoOffice() {
  const wrapRef = useRef(null)
  const camRef = useRef(null)
  const scaleRef = useRef(1)
  const { s, go, home, toWorld } = useCamera(wrapRef, camRef, scaleRef)
  const roomId = useStore((st) => st.roomId)
  const hoveredRoom = useStore((st) => st.hoveredRoom)
  const tasks = useStore((st) => st.tasks)
  const flights = useStore((st) => st.flights)
  const typing = useStore((st) => st.typing)
  const focusRoom = useStore((st) => st.focusRoom)
  const hoverRoom = useStore((st) => st.hoverRoom)
  const openChat = useStore((st) => st.openChat)
  const [card, setCard] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const drag = useRef(null)

  // Oda seçimi → kamera odaya süzülür; seçim kalkınca genel görünüm
  useEffect(() => {
    const r = roomId && ROOMS[roomId]
    if (!r) return home()
    const z = Math.min(MAX_Z, Math.min(s.W / (r.w * 1.06 * s.fx), s.H / (r.h * 1.12 * s.fy)))
    go({ x: r.x + r.w / 2, y: r.y + r.h / 2, z })
  }, [roomId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tekerlek: imlecin altındaki nokta sabit kalacak şekilde yakınlaştır
  useEffect(() => {
    const el = wrapRef.current
    const onWheel = (e) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left - s.W / 2
      const my = e.clientY - rect.top - s.H / 2
      const t = s.tgt
      const z = clamp(t.z * Math.exp(-e.deltaY * 0.0016), 1, MAX_Z)
      go({ x: t.x + mx / (s.fx * t.z) - mx / (s.fx * z), y: t.y + my / (s.fy * t.z) - my / (s.fy * z), z }, 'wheel')
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerDown = (e) => {
    if (e.button !== 0) return
    drag.current = { x: e.clientX, y: e.clientY, moved: 0 }
    wrapRef.current.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    d.moved += Math.abs(dx) + Math.abs(dy)
    d.x = e.clientX
    d.y = e.clientY
    if (d.moved > 4) {
      wrapRef.current.classList.add('dragging')
      go({ x: s.tgt.x - dx / (s.fx * s.tgt.z), y: s.tgt.y - dy / (s.fy * s.tgt.z), z: s.tgt.z }, true)
      setCard(null)
    }
  }
  const onPointerUp = (e) => {
    const d = drag.current
    drag.current = null
    wrapRef.current.classList.remove('dragging')
    if (!d || d.moved > 4) return
    // Tıklama: odaya odaklan (dünya koordinatına çevir)
    const rect = wrapRef.current.getBoundingClientRect()
    const { x: wx, y: wy } = toWorld(e.clientX - rect.left, e.clientY - rect.top)
    const hitRoom = Object.entries(ROOMS).find(([, r]) => wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h)
    focusRoom(hitRoom ? hitRoom[0] : null)
  }
  const onMoveHover = (e) => {
    if (drag.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    const { x: wx, y: wy } = toWorld(e.clientX - rect.left, e.clientY - rect.top)
    const hitRoom = Object.entries(ROOMS).find(([, r]) => wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h)
    hoverRoom(hitRoom ? hitRoom[0] : null)
  }

  const showCard = (id, e) => {
    const rect = wrapRef.current.getBoundingClientRect()
    setCard({ id, x: e.clientX - rect.left, y: clamp(e.clientY - rect.top, 110, rect.height - 110), flip: e.clientX - rect.left > rect.width - 290 })
  }
  const hideCard = () => setCard(null)

  const hits = useMemo(() => Object.fromEntries(flights.map((f) => [f.to, f.delay + 1.75])), [flights])

  // Canlı fotoğrafa giden durum (React yeniden çizimi tetiklemeden ref ile): kim çalışıyor, kim başını sallayacak, ADA konuşuyor mu
  const busyRef = useRef(new Set())
  const nodRef = useRef(new Map())
  const talkRef = useRef(false)
  useEffect(() => {
    busyRef.current = new Set(tasks.filter((t) => t.status === 'active').flatMap((t) => [t.owner, ...t.helpers]))
  }, [tasks])
  useEffect(() => {
    talkRef.current = typing
  }, [typing])
  useEffect(() => {
    const now = performance.now() / 1000
    flights.forEach((f) => nodRef.current.set(f.to, now + f.delay + 1.75))
  }, [flights])
  const focus = roomId || hoveredRoom

  return (
    <div
      ref={wrapRef}
      className="po-wrap"
      onPointerDown={onPointerDown}
      onPointerMove={(e) => {
        onPointerMove(e)
        onMoveHover(e)
      }}
      onPointerUp={onPointerUp}
      onPointerLeave={() => hoverRoom(null)}
      onDoubleClick={() => focusRoom(null)}
    >
      <div ref={camRef} className="po-cam" style={{ opacity: loaded ? 1 : 0, transition: 'opacity .6s' }}>
        <LivingPlate scaleRef={scaleRef} busyRef={busyRef} nodRef={nodRef} talkRef={talkRef} onLoad={() => setLoaded(true)} />
        <Effects />

        {/* oda vurgusu: seçili/üzerinde olunan oda çerçevelenir, seçimde diğerleri kararır */}
        <svg className="po-layer" viewBox={`0 0 ${PW} ${PH}`}>
          {roomId && ROOMS[roomId] && (
            <path
              className="po-dim"
              fillRule="evenodd"
              d={`M0 0H${PW}V${PH}H0Z M${ROOMS[roomId].x} ${ROOMS[roomId].y}h${ROOMS[roomId].w}v${ROOMS[roomId].h}h-${ROOMS[roomId].w}Z`}
            />
          )}
          {DEPARTMENTS.map((d) => {
            const r = ROOMS[d.id]
            const cls = roomId === d.id ? 'active' : focus === d.id ? 'hover' : ''
            return <rect key={d.id} className={`po-zone ${cls}`} x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} rx="6" style={{ '--c': d.color, pointerEvents: 'none' }} />
          })}
        </svg>

        <Typing tasks={tasks} />
        <Flights flights={flights} />

        <div className="po-layer">
          {Object.entries(HEADS).map(([id, [x, y]]) => (
            <i key={id} className="po-hot" style={{ left: x, top: y + 8 }} onPointerEnter={(e) => showCard(id, e)} onPointerMove={(e) => showCard(id, e)} onPointerLeave={hideCard} />
          ))}
          <Ticker onOpen={openChat} />
          {Object.keys(PLAQUES).map((id) => (
            <Plaque key={id} id={id} active={roomId === id || hoveredRoom === id} onFocus={focusRoom} />
          ))}
          {Object.keys(TAGS).map((id) => (
            <Tag key={id} id={id} task={agentTask(tasks, id) ?? tasks.findLast((t) => t.owner === id && t.status === 'done')} hit={hits[id]} onEnter={showCard} onLeave={hideCard} onFocus={focusRoom} />
          ))}
          <Bubble onOpen={openChat} />
        </div>
      </div>

      <div className="po-vig" />
      {card && <AgentCard {...card} tasks={tasks} />}
      {!loaded && (
        <div className="absolute inset-0 grid place-items-center text-[12px] font-semibold tracking-[0.3em] text-sky-200/80">OFİS YÜKLENİYOR…</div>
      )}
    </div>
  )
}
