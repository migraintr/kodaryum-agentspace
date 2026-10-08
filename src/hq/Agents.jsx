// Yapay zekâ çalışanları: takım elbiseli, animasyonlu karakterler kendi departman masalarında oturup yazar;
// ADA yönetici koltuğunda; bir çalışan koridorda dosya taşıyıp yürür. Üzerine gelince isim/rol/görev kartı.
import { Suspense, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import Character from '../kadro/Character.jsx'
import { CEO, DEPT_BY_ID, PEOPLE } from '../data.js'
import { agentTask, useStore } from '../store.js'
import { CEO_SEAT, CHAIR_GAP, CORRIDOR_Z, DESKS } from './plan.js'

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
const WALKER = 'canan' // koridorda yürüyen

const lookOf = (p, i) =>
  p.long ? { model: 'woman', shoes: '#141416' } : { model: 'man', suit: SUITS[i % SUITS.length][0], vest: SUITS[i % SUITS.length][1], hair: HAIRS[i % HAIRS.length], shoes: '#16171a' }

// Departmana göre masa ataması: kişiler sırayla o odanın masalarına oturur
function useSeats() {
  return useMemo(() => {
    const used = {}
    const seats = []
    PEOPLE.forEach((p, i) => {
      if (p.id === CEO.id) return seats.push({ p, i, x: CEO_SEAT.x, z: CEO_SEAT.z + 0.07, ry: 0 })
      if (p.id === WALKER) return
      const list = DESKS[p.dept]
      const k = (used[p.dept] = (used[p.dept] ?? -1) + 1)
      const d = list?.[k]
      if (d) seats.push({ p, i, x: d.x, z: d.z + CHAIR_GAP - 0.07, ry: Math.PI })
    })
    return seats
  }, [])
}

function Tag({ p }) {
  const task = useStore((s) => agentTask(s.tasks, p.id))
  const d = DEPT_BY_ID.get(p.dept)
  return (
    <Html position={[0, 1.75, 0]} center zIndexRange={[30, 10]} style={{ pointerEvents: 'none' }}>
      <div className="w-[190px] rounded-xl border border-slate-200 bg-white/95 p-2.5 text-slate-800 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100">
        <p className="text-[13px] font-bold leading-tight">{p.name}</p>
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

// Koridorda iki uç arasında gidip gelir; uçlarda kısa duraklar ve yönünü yumuşakça çevirir
function Walker({ p, i, from = -12.5, to = 12.5, speed = 1.2 }) {
  const g = useRef()
  const s = useRef({ x: from, dir: 1, wait: 0, yaw: Math.PI / 2 })
  const [hover, setHover] = useState(false)
  const [moving, setMoving] = useState(true)
  useFrame((_, dt) => {
    const st = s.current
    if (st.wait > 0) {
      st.wait -= dt
      if (st.wait <= 0) {
        st.dir *= -1
        setMoving(true)
      }
    } else {
      st.x += st.dir * speed * dt
      if ((st.dir > 0 && st.x >= to) || (st.dir < 0 && st.x <= from)) {
        st.x = Math.min(to, Math.max(from, st.x))
        st.wait = 2.5
        setMoving(false)
      }
    }
    const want = st.wait > 0 ? 0 : (st.dir * Math.PI) / 2
    let dy = want - st.yaw
    dy = Math.atan2(Math.sin(dy), Math.cos(dy))
    st.yaw += dy * Math.min(1, dt * 5)
    g.current.position.set(st.x, 0, CORRIDOR_Z)
    g.current.rotation.y = st.yaw
  })
  return (
    <group
      ref={g}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
      }}
      onPointerOut={() => setHover(false)}
    >
      <Character look={lookOf(p, i)} action={moving ? 'walk' : 'idle'} speed={speed / 1.2} />
      {hover && <Tag p={p} />}
    </group>
  )
}

export default function Agents() {
  const seats = useSeats()
  const walkerIndex = PEOPLE.findIndex((p) => p.id === WALKER)
  return (
    <Suspense fallback={null}>
      {seats.map((s) => (
        <Seated key={s.p.id} seat={s} />
      ))}
      {walkerIndex >= 0 && <Walker p={PEOPLE[walkerIndex]} i={walkerIndex} />}
    </Suspense>
  )
}
