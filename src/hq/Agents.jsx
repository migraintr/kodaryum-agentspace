// Yapay zekâ çalışanları: takım elbiseli, animasyonlu karakterler kendi departman masalarında oturup yazar;
// Kağan yönetici koltuğunda; operasyon lideri bütün odaları gezip kontrol eder (tour.js). Üzerine gelince kart.
import { Suspense, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import Character from '../kadro/Character.jsx'
import { CEO, DEPT_BY_ID, PEOPLE } from '../data.js'
import { agentTask, useStore } from '../store.js'
import { CEO_SEAT, CHAIR_GAP, DESKS } from './plan.js'
import { DWELL, TOUR_AGENT, WALK_SPEED, buildLoop } from './tour.js'

// Takım elbise renkleri (ceket/pantolon, yelek) ve saç tonları
const SUITS = [
  ['#24282f', '#30353d'], // antrasit
  ['#1c2740', '#26355a'], // lacivert
  ['#141518', '#22252a'], // siyah
  ['#3d424b', '#2c3038'], // füme
  ['#1f2d3a', '#2a3f52'], // gece mavisi
  ['#2e2a26', '#3b352f'], // koyu kahve
]
const HAIRS = ['#1a1410', '#2b1d14', '#0f0f10', '#3a2a1c', '#4a3324']

const lookOf = (p, i) =>
  p.long ? { model: 'woman', shoes: '#141416' } : { model: 'man', suit: SUITS[i % SUITS.length][0], vest: SUITS[i % SUITS.length][1], hair: HAIRS[i % HAIRS.length], shoes: '#16171a' }

// Departmana göre masa ataması: kişiler sırayla o odanın masalarına oturur
function useSeats() {
  return useMemo(() => {
    const used = {}
    const seats = []
    PEOPLE.forEach((p, i) => {
      if (p.id === CEO.id) return seats.push({ p, i, x: CEO_SEAT.x, z: CEO_SEAT.z + 0.07, ry: 0 })
      if (p.id === TOUR_AGENT) return // odaları geziyor
      const list = DESKS[p.dept]
      const k = (used[p.dept] = (used[p.dept] ?? -1) + 1)
      const d = list?.[k]
      if (d) seats.push({ p, i, x: d.x, z: d.z + CHAIR_GAP - 0.07, ry: Math.PI })
    })
    return seats
  }, [])
}

function Tag({ p, tour }) {
  const task = useStore((s) => agentTask(s.tasks, p.id))
  const ops = useStore((s) => (tour ? s.opsTour : null))
  const d = DEPT_BY_ID.get(p.dept)
  return (
    <Html position={[0, 1.75, 0]} center zIndexRange={[30, 10]} style={{ pointerEvents: 'none' }}>
      <div className="w-[190px] rounded-xl border border-slate-200 bg-white/95 p-2.5 text-slate-800 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100">
        <p className="text-[13px] font-bold leading-tight">{p.name} {p.surname}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {p.role} · <span style={{ color: d?.color }}>{d?.name}</span>
        </p>
        <p className="mt-1.5 text-[11px] leading-snug">
          {task ? (
            <>
              <b>#{task.no}</b> {task.title} · %{Math.round(task.progress)}
            </>
          ) : (
            <span className="text-slate-500">Yeni görev için hazır · {p.model}</span>
          )}
        </p>
        {ops && (
          <p className="mt-1.5 border-t border-slate-200 pt-1.5 text-[11px] leading-snug dark:border-slate-700">
            <b>Operasyon turu</b> ·{' '}
            {ops.status === 'inspecting' ? `${DEPT_BY_ID.get(ops.room)?.name} kontrol ediliyor` : `${DEPT_BY_ID.get(ops.next)?.name ?? 'sonraki oda'} odasına gidiyor`}
          </p>
        )}
      </div>
    </Html>
  )
}

function Seated({ seat }) {
  const [hover, setHover] = useState(false)
  const busy = useStore((s) => agentTask(s.tasks, seat.p.id)?.status === 'active')
  return (
    <group
      position={[seat.x, 0, seat.z]}
      rotation-y={seat.ry}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
      }}
      onPointerOut={() => setHover(false)}
    >
      <Character look={lookOf(seat.p, seat.i)} action={busy || seat.p.id === CEO.id ? 'type' : 'sit'} phase={(seat.i * 0.137) % 1} />
      {hover && <Tag p={seat.p} />}
    </group>
  )
}

// Operasyon turu: rota üzerinde yürür (yön yumuşak döner, keskin dönüşte yavaşlar, köşeleri hafifçe keser),
// her odanın kontrol noktasında durup kontrol eder (onaylar ya da uyarıda başını sallar), notu balonda gösterir
// ve tur kaydına (store.opsTour) yazar. Yürüyüş animasyonu gerçek hıza eşlenir (Character moveSpeed).
const TURN_RATE = 4.2 // rad/sn
const ACCEL = 2.2 // m/sn²
const angleDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a))

function TourWalker({ p, i }) {
  const g = useRef()
  const loop = useMemo(() => buildLoop(), [])
  const s = useRef(null)
  if (!s.current) {
    const first = loop[0].stop.path[0]
    s.current = { leg: 0, queue: [], x: first[0] - 3, z: first[1], yaw: Math.PI / 2, v: 0, dwell: null, seen: {} }
  }
  const [anim, setAnim] = useState({ action: 'walk', mv: 0 })
  const [bubble, setBubble] = useState(null)
  const [hover, setHover] = useState(false)
  const set = (action, mv = 0) => {
    const q = Math.round(mv * 20) / 20
    setAnim((a) => (a.action === action && a.mv === q ? a : { action, mv: q }))
  }
  const enqueue = (st) => {
    const leg = loop[st.leg % loop.length]
    st.queue.push(...leg.in.map((to, k) => ({ to, last: k === leg.in.length - 1 })), { dwell: leg.stop }, ...leg.out.map((to) => ({ to })))
    st.leg++
  }

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1)
    const st = s.current
    if (!st.queue.length) enqueue(st)
    const item = st.queue[0]
    if (item.dwell) {
      // kontrol noktası: önce bakış yönüne dön, sonra onay / baş sallama, sonra bekle
      const d = (st.dwell ??= start(item.dwell))
      d.t += dt
      st.v = 0
      st.yaw += Math.max(-TURN_RATE * dt, Math.min(TURN_RATE * dt, angleDiff(st.yaw, item.dwell.yaw)))
      if (d.t < 1.1) set('idle')
      else if (d.t < 3.4) set(d.level === 'warn' ? 'no' : 'agree')
      else set('idle')
      if (d.t >= DWELL) {
        st.queue.shift()
        st.dwell = null
        setBubble(null)
        useStore.getState().tourEvent({ status: 'walking', room: null, next: loop[st.leg % loop.length].stop.room })
      }
    } else {
      const dx = item.to[0] - st.x
      const dz = item.to[1] - st.z
      const dist = Math.hypot(dx, dz)
      const want = Math.atan2(dx, dz)
      const diff = angleDiff(st.yaw, want)
      st.yaw += Math.max(-TURN_RATE * dt, Math.min(TURN_RATE * dt, diff * Math.min(1, dt * 9)))
      // keskin dönüşte yavaşla; kontrol noktasına yaklaşırken süzülerek dur
      const turnK = Math.max(0, Math.cos(Math.min(Math.PI / 2, Math.abs(diff))))
      const brake = item.last ? Math.min(1, dist / 0.9) : 1
      const target = WALK_SPEED * Math.max(0.12, turnK) * Math.max(0.25, brake)
      st.v += Math.max(-ACCEL * dt * 1.6, Math.min(ACCEL * dt, target - st.v))
      const step = Math.min(dist, st.v * dt)
      if (dist > 1e-4) {
        st.x += (dx / dist) * step
        st.z += (dz / dist) * step
      }
      // ara noktalarda köşeyi hafifçe kes; son noktaya tam otur
      if (dist < (item.last ? 0.03 : 0.32)) st.queue.shift()
      set(st.v > 0.12 ? 'walk' : 'idle', st.v)
    }
    g.current.position.set(st.x, 0, st.z)
    g.current.rotation.y = st.yaw
  })

  function start(stop) {
    const st = s.current
    const k = (st.seen[stop.room] = (st.seen[stop.room] ?? -1) + 1)
    const [level, note] = stop.notes[k % stop.notes.length]
    setBubble({ room: stop.room, level, note })
    useStore.getState().tourEvent({ status: 'inspecting', room: stop.room, note, level }, { at: Date.now(), room: stop.room, note, level })
    return { t: 0, level }
  }

  const d = bubble && DEPT_BY_ID.get(bubble.room)
  return (
    <group
      ref={g}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
      }}
      onPointerOut={() => setHover(false)}
    >
      <Character look={lookOf(p, i)} action={anim.action} moveSpeed={anim.mv || WALK_SPEED} />
      {hover ? (
        <Tag p={p} tour />
      ) : (
        bubble && (
          <Html position={[0, 2.05, 0]} center zIndexRange={[25, 10]} style={{ pointerEvents: 'none' }}>
            <div className="flex max-w-[220px] items-start gap-1.5 rounded-xl border bg-white/95 px-2.5 py-1.5 text-[11px] leading-snug text-slate-700 shadow-lg backdrop-blur dark:bg-slate-900/95 dark:text-slate-100" style={{ borderColor: bubble.level === 'warn' ? '#f59e0b' : '#10b981' }}>
              <span className="mt-[3px] h-2 w-2 shrink-0 rounded-full" style={{ background: bubble.level === 'warn' ? '#f59e0b' : '#10b981' }} />
              <span>
                <b style={{ color: d?.color }}>{d?.short}</b> · {bubble.note}
              </span>
            </div>
          </Html>
        )
      )}
    </group>
  )
}

export default function Agents() {
  const seats = useSeats()
  const walkerIndex = PEOPLE.findIndex((p) => p.id === TOUR_AGENT)
  return (
    <Suspense fallback={null}>
      {seats.map((s) => (
        <Seated key={s.p.id} seat={s} />
      ))}
      {walkerIndex >= 0 && <TourWalker p={PEOPLE[walkerIndex]} i={walkerIndex} />}
    </Suspense>
  )
}
