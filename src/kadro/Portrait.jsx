// Çalışan portresi (?kadro=portre): takım elbiseli karakterleri önden gösteren stüdyo çekimi.
// ?poz=type|sit|chat|idle|inspect : tüm karakterler aynı hareketi yapar · &yan : yandan görünüm
// ?poz=parkur : karakterler ileri-geri yürüyüp döner (yürüyüş incelemesi; &kim=0..3 tek karakter, &hiz=0.3 ağır çekim)
// ?poz=masa : masa başında çalışan (klavye/fare/okuma…) · &dept=yazilim|tasarim|… · &akt=type|mouse|read|think|sip|stretch
//            &aci=yan|on|ust|arka|yakin|fare kamera açısı · &kim=0..3
import { Suspense, useEffect, useMemo, useReducer, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Grid } from '@react-three/drei'
import lobby from '@pmndrs/assets/hdri/lobby.exr'
import { hold, turnTo, walk } from '../hq/actors.js'
import { createDeskProps } from '../hq/deskProps.js'
import { Chair, Desk } from '../hq/furniture.jsx'
import { DESKS, SEAT_TO_DESK } from '../hq/plan.js'
import Character from './Character.jsx'
import { CEO_LOOK } from './looks.js'
const Q0 = new URLSearchParams(location.search)
import { createWork, deskKit } from './work.js'

const LOOKS = [
  Q0.has('ceo') ? CEO_LOOK : { model: 'man', suit: '#24282f', vest: '#30353d', hair: '#1a1410', shoes: '#16171a' },
  { model: 'woman', shoes: '#141416' },
  { model: 'man', suit: '#1c2740', vest: '#26355a', hair: '#2b1d14', shoes: '#16171a' },
  { model: 'man', suit: '#3d424b', vest: '#2c3038', hair: '#0f0f10', shoes: '#16171a' },
]

const Q = new URLSearchParams(location.search)
const POZ = Q.get('poz')
const YAN = Q.has('yan')
const KIM = Q.get('kim')
const HIZ = +(Q.get('hiz') ?? 1)
const TAKIP = Q.has('takip') // kamera ilk karakteri yakından takip eder (yandan)

// Parkur: x ekseninde -A ↔ +A arası yürü, uçta dur, dön
function* course(st, A, delay) {
  yield* hold(st, delay, 'idle')
  for (;;) {
    yield* walk(st, [[A, st.z]])
    yield* hold(st, 1.1, 'idle')
    yield* turnTo(st, -Math.PI / 2)
    yield* walk(st, [[-A, st.z]])
    yield* hold(st, 1.1, 'idle')
    yield* turnTo(st, Math.PI / 2)
  }
}

function Walker({ look, z, delay, phase }) {
  const g = useRef()
  const st = useMemo(() => ({ x: -2.2, z, yaw: Math.PI / 2, v: 0, action: 'idle' }), [z])
  const gen = useMemo(() => {
    const it = course(st, 2.2, delay)
    it.next()
    return it
  }, [st, delay])
  const action = useRef('idle')
  useFrame(({ camera }, dt) => {
    gen.next(Math.min(dt, 0.05) * HIZ)
    g.current.position.set(st.x, 0, st.z)
    g.current.rotation.y = st.yaw
    action.current = st.action
    if (TAKIP && delay === 0) {
      camera.position.set(st.x + (Q.has("on") ? 3.3 * Math.sin(st.yaw) : 0), 1.0, st.z + (Q.has("on") ? 3.3 * Math.cos(st.yaw) : 3.4))
      camera.lookAt(st.x, 0.88, st.z)
    }
  })
  return (
    <group ref={g}>
      <WalkerBody look={look} action={action} phase={phase} />
    </group>
  )
}
// Hareket değişince yeniden çizer (useFrame içinden ref'e bakar)
function WalkerBody({ look, action, phase }) {
  const [, force] = useStateForce()
  const last = useRef(action.current)
  useFrame(() => {
    if (last.current !== action.current) {
      last.current = action.current
      force()
    }
  })
  return <Character look={look} action={action.current} phase={phase} />
}
const useStateForce = () => useReducer((x) => x + 1, 0)

// Masa başı deneme sahnesi: masa dünya merkezinde, çalışan +z tarafında
const ACI = {
  yan: [[1.25, 1.15, 0.35], [0, 0.9, 0.3]],
  on: [[0.55, 1.45, -0.55], [0, 1.0, 0.45]],
  ust: [[0.0, 1.95, 0.42], [0, 0.77, 0.24]],
  arka: [[0.45, 1.55, 1.35], [0, 0.95, -0.15]],
  yakin: [[0.42, 1.02, 0.02], [0, 0.8, 0.22]],
  fare: [[0.75, 1.1, 0.05], [0.3, 0.78, 0.22]],
  ekran: [[-0.12, 1.12, 0.62], [-0.2, 0.98, -0.22]],
}
function DeskScene() {
  const dept = Q.get('dept') ?? 'yazilim'
  const d = DESKS[dept]?.[0] ?? DESKS.yazilim[0]
  const work = useMemo(() => createWork({ kit: deskKit({ dual: d.dual ?? true, scale: d.scale ?? 1, kind: d.screen ?? 'code' }), profile: dept, seed: 3, force: Q.get('akt') }), [d, dept])
  const props = useMemo(() => createDeskProps(work, { color: '#3b82f6' }), [work])
  useEffect(() => {
    work.afterPose = props.update
  }, [work, props])
  const [pos, at] = ACI[Q.get('aci') ?? 'yan'] ?? ACI.yan
  useFrame(({ camera }) => {
    camera.position.set(...pos)
    camera.lookAt(...at)
  })
  if (import.meta.env.DEV) Object.assign(window, { __work: work, __props: props })
  return (
    <>
      <Desk dual={d.dual ?? true} screen={d.screen ?? 'code'} mouse={false} scale={[d.scale ?? 1, 1, 1]} />
      <Chair position={[0, 0, 0.65]} />
      <group position={[0, 0, SEAT_TO_DESK]} rotation-y={Math.PI}>
        <Character look={LOOKS[+(KIM ?? 0)]} action={Q.get('bos') != null ? 'sit' : 'type'} work={work} />
        <primitive object={props.group} />
      </group>
    </>
  )
}

export default function Portrait() {
  const parkur = POZ === 'parkur'
  const looks = KIM != null ? [LOOKS[+KIM]] : LOOKS
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Canvas
        shadows
        camera={{ position: parkur ? [0, 1.1, 6.2] : [0, 1.25, 4.6], fov: POZ === 'masa' ? 40 : 30 }}
        onCreated={({ camera }) => camera.lookAt(0, parkur ? 0.75 : 0.95, 0)}
      >
        <color attach="background" args={['#e9ebee']} />
        <Suspense fallback={null}>
          <Environment files={lobby} environmentIntensity={0.9} />
          <directionalLight position={[2, 4, 4]} intensity={2} castShadow />
          {POZ === 'masa' && <DeskScene />}
          {parkur && <Grid args={[12, 12]} cellSize={0.25} sectionSize={1} cellColor="#c9ced6" sectionColor="#9aa3b0" position={[0, 0.001, 0]} />}
          {POZ === 'masa'
            ? null
            : parkur
            ? looks.map((l, i) => <Walker key={i} look={l} z={looks.length > 1 ? 0.9 - i * 0.6 : 0} delay={i * 0.7} phase={i * 0.2} />)
            : looks.map((l, i) => (
                <Character key={i} look={l} action={POZ ?? (i % 2 ? 'agree' : 'idle')} phase={i * 0.2} position={[(i - 1.5) * 0.95, 0, 0]} rotation-y={YAN ? Math.PI / 2 : 0} />
              ))}
          <ContactShadows opacity={0.5} scale={10} blur={2} />
        </Suspense>
      </Canvas>
    </div>
  )
}
