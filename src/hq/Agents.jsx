// Yapay zekâ çalışanları: takım elbiseli, animasyonlu karakterler kendi departman masalarında oturup çalışır.
// Masa başı davranışı (kadro/work.js): yazar, fareyle çalışır, okur, düşünür, kahve içer; fare/kupa/imleç ve
// ekranda yazılan satırlar canlıdır (deskProps.js). Üzerine gelince kart o an ne yaptığını da söyler.
// Hareketli olanlar (actors.js senaryoları): Operasyon denetçisi Serkan kat turu atıp odaları denetler,
// CEO ofisinde Kağan Bey'le istişare eder; Kağan Bey masasından kalkıp karşı koltuğa geçer.
// Üzerine gelince isim/rol/görev kartı; konuşurken başlarının üstünde balon.
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { BookOpen, Coffee, Eye, Keyboard, Lightbulb, MousePointer2, StretchHorizontal } from 'lucide-react'
import Character from '../kadro/Character.jsx'
import { activityLabel, createWork, deskKit } from '../kadro/work.js'
import { CEO, DEPT_BY_ID, PEOPLE, PERSON_BY_ID } from '../data.js'
import { agentTask, useStore } from '../store.js'
import { INSPECTOR, SEATS, STATES, ceoScript, inspectorScript } from './actors.js'
import { createDeskProps } from './deskProps.js'
import { CEO_DESK, DESKS } from './plan.js'
import { SEATING } from './seating.js'

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
const ACT_ICON = { type: Keyboard, mouse: MousePointer2, read: BookOpen, think: Lightbulb, glance: Eye, sip: Coffee, stretch: StretchHorizontal }

const lookOf = (p, i) =>
  p.long ? { model: 'woman', shoes: '#141416' } : { model: 'man', suit: SUITS[i % SUITS.length][0], vest: SUITS[i % SUITS.length][1], hair: HAIRS[i % HAIRS.length], shoes: '#16171a' }

// O anki etkinlik (masa başı davranışından, yarım saniyede bir okunur)
function Activity({ work, dept }) {
  const [a, setA] = useState(work.S.activity)
  useEffect(() => {
    const id = setInterval(() => setA(work.S.activity), 400)
    return () => clearInterval(id)
  }, [work])
  const Icon = ACT_ICON[a] ?? Keyboard
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      <Icon size={12} /> {activityLabel(a, dept)}
    </p>
  )
}

function Tag({ p, work }) {
  const task = useStore((s) => agentTask(s.tasks, p.id))
  const d = DEPT_BY_ID.get(p.dept)
  return (
    <Html position={[0, 1.75, 0]} center zIndexRange={[30, 10]} style={{ pointerEvents: 'none' }}>
      <div className="w-[190px] rounded-xl border border-slate-200 bg-white/95 p-2.5 text-slate-800 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100">
        <p className="text-[13px] font-bold leading-tight">{p.name} {p.surname}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {p.role} · <span style={{ color: d?.color }}>{d?.name}</span>
        </p>
        {work && <Activity work={work} dept={p.dept} />}
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

// Konuşma balonu (başın üstünde)
function Bubble({ p, text, y }) {
  const d = DEPT_BY_ID.get(p.dept)
  return (
    <Html position={[0, y, 0]} center zIndexRange={[28, 10]} style={{ pointerEvents: 'none' }}>
      <div className="relative w-max max-w-[230px] -translate-y-1/2 rounded-2xl rounded-bl-sm border-2 bg-white/97 px-3 py-1.5 text-slate-800 shadow-[0_8px_22px_-8px_rgba(15,23,42,.45)] dark:bg-slate-900/95 dark:text-slate-100" style={{ borderColor: d?.color }}>
        <p className="text-[9.5px] font-bold tracking-wide uppercase" style={{ color: d?.color }}>
          {p.name} · {p.role}
        </p>
        <p className="text-[12px] leading-snug font-medium">{text}</p>
      </div>
    </Html>
  )
}

// Masadaki çalışan: davranış + masa üstü eşyaları (fare, kupa, imleç, ekrandaki yazı) koltuk çerçevesinde
function Seated({ seat }) {
  const [hover, setHover] = useState(false)
  const busy = useStore((s) => agentTask(s.tasks, seat.p.id)?.status === 'active')
  const d = seat.desk
  const work = useMemo(
    () => createWork({ kit: deskKit({ dual: d.dual ?? true, scale: d.scale ?? 1, kind: d.screen ?? 'code' }), profile: seat.p.dept, seed: seat.i * 97 + 13 }),
    [seat, d],
  )
  const props = useMemo(() => createDeskProps(work, { color: DEPT_BY_ID.get(seat.p.dept)?.color }), [work, seat])
  // eşyalar, karakter pozundan hemen sonra güncellenir (aynı karede el ile fare/kupa örtüşür)
  useEffect(() => {
    work.afterPose = props.update
  }, [work, props])
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
      <Character look={lookOf(seat.p, seat.i)} action={busy ? 'type' : 'sit'} phase={(seat.i * 0.137) % 1} work={work} />
      <primitive object={props.group} />
      {hover && <Tag p={seat.p} work={work} />}
    </group>
  )
}

// Senaryo ile hareket eden çalışan: her karede generator ilerler, konum/yön/hareket/konuşma buradan okunur
function Actor({ id, script, seat, tablet, work }) {
  const p = PERSON_BY_ID.get(id)
  const i = PEOPLE.indexOf(p)
  const g = useRef()
  const st = useMemo(() => ({ x: seat.x, z: seat.z, yaw: seat.ry, v: 0, action: 'type', say: null, speaking: false }), [seat])
  const gen = useMemo(() => {
    const it = script(st)
    it.next()
    return it
  }, [script, st])
  const [ui, setUi] = useState({ action: st.action, say: null, speaking: false })
  const [hover, setHover] = useState(false)
  useFrame((_, dt) => {
    STATES[id] = st
    gen.next(Math.min(dt, 0.05))
    g.current.position.set(st.x, 0, st.z)
    g.current.rotation.y = st.yaw
    if (st.action !== ui.action || st.say !== ui.say || st.speaking !== ui.speaking) setUi({ action: st.action, say: st.say, speaking: st.speaking })
  })
  const seated = ['sit', 'type', 'chat'].includes(ui.action)
  return (
    <group
      ref={g}
      position={[seat.x, 0, seat.z]}
      rotation-y={seat.ry}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
      }}
      onPointerOut={() => setHover(false)}
    >
      <Character look={lookOf(p, i)} action={ui.action} speaking={ui.speaking} tablet={tablet} phase={(i * 0.137) % 1} work={work} />
      {ui.say && <Bubble p={p} text={ui.say} y={seated ? 1.62 : 2.12} />}
      {hover && !ui.say && <Tag p={p} work={ui.action === 'type' ? work : null} />}
    </group>
  )
}

// Hareketli çalışanların masa başı davranışı: CEO dizüstünde (dokunmatik yüzey), denetçi masasındaki sabit farede
const CEO_WORK = createWork({ kit: deskKit({ laptop: true, z0: CEO_DESK.z - SEATS.ceoDesk.z }), profile: 'yonetim', seed: 5 })
const INSPECTOR_WORK = createWork({ kit: deskKit({ dual: DESKS.operasyon[1].dual ?? true, kind: 'monitor', props: false }), profile: 'operasyon', seed: 31 })

export default function Agents() {
  return (
    <Suspense fallback={null}>
      {SEATING.map((s) => (
        <Seated key={s.p.id} seat={s} />
      ))}
      <Actor id={CEO.id} script={ceoScript} seat={SEATS.ceoDesk} work={CEO_WORK} />
      <Actor id={INSPECTOR} script={inspectorScript} seat={SEATS.inspectorDesk} tablet work={INSPECTOR_WORK} />
    </Suspense>
  )
}
