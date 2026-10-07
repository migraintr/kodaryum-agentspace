// Kodaryum HQ — referans izometrik ofis katının 3B modeli (sıfırdan).
// Kat: 30 × 17 m. Arka sıra: Yazılım · CEO Ofisi · Tasarım; geniş koridor; ön sıra: Pazarlama · Araştırma ·
// Toplantı · Operasyon. Her odada renkli vurgu duvarı + aynı tonda halı; cam bölmeler siyah çerçeveli.
// Odaya tıklayınca kamera o odaya süzülür (store.roomId).
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Html, OrbitControls, RoundedBox } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import lobby from '@pmndrs/assets/hdri/lobby.exr'
import { DEPT_BY_ID } from '../data.js'
import { useStore } from '../store.js'
import { ICONS, alpha } from '../ui/kit.jsx'
import { Bookshelf, Cabinet, Chair, CoffeeTable, ConferenceTable, Desk, ExecDesk, LoungeChair, MAT, Plant, Rack, WallTV } from './furniture.jsx'
import { greenery, moodboard, rugTex, slats, stickyBoard, terrazzo } from './textures.js'

// ─── Kat planı ────────────────────────────────────────────────────────────────
const W = 30
const BACK = [-9, -2] // arka sıra z aralığı
const FRONT = [1, 8] // ön sıra z aralığı
const T = 0.35 // dış duvar kalınlığı
const H = 2.8 // tavan / tam duvar yüksekliği

export const ROOMS = [
  { id: 'yazilim', x: [-15, -5], z: BACK, accent: '#1f4f8f', rug: '#58779b' },
  { id: 'yonetim', x: [-5, 5], z: BACK, accent: '#25315c', rug: '#7d828b' },
  { id: 'tasarim', x: [5, 15], z: BACK, accent: '#b8737b', rug: '#c48d91' },
  { id: 'pazarlama', x: [-15, -7.5], z: FRONT, accent: '#d4682c', rug: '#c46a33' },
  { id: 'arastirma', x: [-7.5, 0], z: FRONT, accent: '#7a55c4', rug: '#6e54a8' },
  { id: 'toplanti', x: [0, 7.5], z: FRONT, accent: '#ead3a6', rug: '#d8c8aa' },
  { id: 'operasyon', x: [7.5, 15], z: FRONT, accent: '#1f6f45', rug: '#6f8c6b' },
]
const C = (r) => [(r.x[0] + r.x[1]) / 2, (r.z[0] + r.z[1]) / 2]

const glassMat = new THREE.MeshPhysicalMaterial({ color: '#d6e6ee', roughness: 0.04, transparent: true, opacity: 0.16, depthWrite: false, envMapIntensity: 1.4 })
const frameMat = new THREE.MeshStandardMaterial({ color: '#1b1d21', roughness: 0.35, metalness: 0.7 })
const shellMat = new THREE.MeshStandardMaterial({ color: '#3d4046', roughness: 0.6 })
const shellTop = new THREE.MeshStandardMaterial({ color: '#2a2c30', roughness: 0.5 })
const whiteWall = new THREE.MeshStandardMaterial({ color: '#efeeea', roughness: 0.9 })

const box = (args, pos, mat, shadow = true) => (
  <mesh position={pos} material={mat} castShadow={shadow} receiveShadow>
    <boxGeometry args={args} />
  </mesh>
)

// Cam bölme (siyah çerçeve, ince dikmeler). axis 'x': x boyunca uzanır; 'z': z boyunca
function Glass({ axis, from, to, at, h = H - 0.2, mullion = 1.4 }) {
  const len = to - from
  const mid = (from + to) / 2
  const n = Math.max(1, Math.round(len / mullion))
  const P = (a, y, b) => (axis === 'x' ? [a, y, b] : [b, y, a])
  const S = (l, hh, t) => (axis === 'x' ? [l, hh, t] : [t, hh, l])
  return (
    <group>
      <mesh position={P(mid, h / 2, at)} material={glassMat}>
        <boxGeometry args={S(len, h, 0.02)} />
      </mesh>
      {box(S(len, 0.05, 0.05), P(mid, h, at), frameMat)}
      {box(S(len, 0.04, 0.05), P(mid, 0.02, at), frameMat, false)}
      {Array.from({ length: n + 1 }, (_, i) => from + (i * len) / n).map((a) => (
        <mesh key={a} position={P(a, h / 2, at)} material={frameMat}>
          <boxGeometry args={S(0.04, h, 0.05)} />
        </mesh>
      ))}
    </group>
  )
}

// Vurgu duvarı (odanın arkasında, koridora/kameraya bakan yüz)
function AccentWall({ x, z, color, h = H, face = 1 }) {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.85 }), [color])
  return box([x[1] - x[0], h, 0.12], [(x[0] + x[1]) / 2, h / 2, z + face * 0.06], m)
}

function Rug({ room, w, d, dx = 0, dz = 0 }) {
  const [cx, cz] = C(room)
  return (
    <mesh position={[cx + dx, 0.008, cz + dz]} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial map={rugTex(room.rug)} roughness={1} />
    </mesh>
  )
}

// Arka duvardaki pencere bandı: yeşillik manzarası + çerçeveler
function WindowBand({ x, z, y0 = 1.75, y1 = H }) {
  const w = x[1] - x[0]
  const cx = (x[0] + x[1]) / 2
  const h = y1 - y0
  const tex = useMemo(() => {
    const t = greenery().clone()
    t.repeat.set(w / 10, 1)
    t.wrapS = THREE.RepeatWrapping
    t.needsUpdate = true
    return t
  }, [w])
  return (
    <group>
      <mesh position={[cx, y0 + h / 2, z + 0.13]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {Array.from({ length: Math.round(w / 1.6) + 1 }, (_, i) => x[0] + (i * w) / Math.round(w / 1.6)).map((a) => (
        <mesh key={a} position={[a, y0 + h / 2, z + 0.15]} material={frameMat}>
          <boxGeometry args={[0.05, h, 0.04]} />
        </mesh>
      ))}
      {box([w, 0.06, 0.06], [cx, y0, z + 0.16], frameMat, false)}
    </group>
  )
}

function Hexagon({ position, r = 0.32 }) {
  const geo = useMemo(() => new THREE.TorusGeometry(r, 0.022, 8, 6), [r])
  return (
    <mesh geometry={geo} position={position} rotation-z={Math.PI / 6}>
      <meshBasicMaterial color="#9ec5ff" toneMapped={false} />
    </mesh>
  )
}

// ─── Kabuk: zemin döşemesi + dış duvarlar ───────────────────────────────────
function Shell() {
  const floor = useMemo(() => {
    const t = terrazzo().clone()
    t.repeat.set(W / 5, 17 / 5)
    t.needsUpdate = true
    return t
  }, [])
  const D0 = BACK[0] - T
  const D1 = FRONT[1] + T
  const D = D1 - D0
  return (
    <group>
      {/* döşeme (kalın beton plaka) */}
      <mesh position={[0, -0.25, (D0 + D1) / 2]} material={shellTop} receiveShadow>
        <boxGeometry args={[W + 2 * T, 0.5, D]} />
      </mesh>
      <mesh position={[0, 0.001, (BACK[0] + FRONT[1]) / 2]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[W, FRONT[1] - BACK[0]]} />
        <meshStandardMaterial map={floor} color="#e3eaf0" roughness={0.32} metalness={0.02} envMapIntensity={0.8} />
      </mesh>
      {/* arka dış duvar (tam boy, iç yüzü beyaz) */}
      {box([W + 2 * T, H, T], [0, H / 2, BACK[0] - T / 2], shellMat)}
      {/* yan duvarlar: arka sıra boyunca tam, sonra kademeli alçalır */}
      {[-1, 1].map((s) => (
        <group key={s}>
          {box([T, H, BACK[1] - BACK[0] + T], [s * (W / 2 + T / 2), H / 2, (BACK[0] - T + BACK[1]) / 2], shellMat)}
          {box([T, 1.25, FRONT[1] - BACK[1] + T], [s * (W / 2 + T / 2), 0.625, (BACK[1] + FRONT[1] + T) / 2], shellMat)}
          {box([T + 0.02, 0.04, FRONT[1] - BACK[0] + 2 * T], [s * (W / 2 + T / 2), 1.27, (BACK[0] + FRONT[1]) / 2], shellTop, false)}
        </group>
      ))}
      {/* ön alçak duvar */}
      {box([W + 2 * T, 0.75, T], [0, 0.375, FRONT[1] + T / 2], shellMat)}
      {box([W + 2 * T, 0.04, T + 0.02], [0, 0.77, FRONT[1] + T / 2], shellTop, false)}
    </group>
  )
}

// ─── Arka sıra ──────────────────────────────────────────────────────────────
function Software() {
  const r = ROOMS[0]
  const [cx, cz] = C(r)
  const wz = r.z[0]
  return (
    <group>
      <AccentWall x={[r.x[0], r.x[0] + 3.2]} z={wz} color={r.accent} />
      {box([0.12, H, r.z[1] - r.z[0]], [r.x[0] + 0.06, H / 2, cz], new THREE.MeshStandardMaterial({ color: r.accent, roughness: 0.85 }))}
      {box([r.x[1] - r.x[0] - 3.2, 1.75, 0.12], [(r.x[0] + 3.2 + r.x[1]) / 2, 0.875, wz + 0.06], whiteWall)}
      <WindowBand x={[r.x[0] + 3.2, r.x[1]]} z={wz} y0={1.75} />
      {/* mavi LED şeridi */}
      <mesh position={[(r.x[0] + 3.2 + r.x[1]) / 2, 0.03, wz + 0.2]}>
        <boxGeometry args={[r.x[1] - r.x[0] - 3.4, 0.02, 0.05]} />
        <meshBasicMaterial color="#5aa8ff" toneMapped={false} />
      </mesh>
      {[0, 1, 2].map((i) => <Rack key={i} position={[r.x[0] + 0.75 + i * 0.65, 0, wz + 0.6]} />)}
      <Cabinet w={1.4} position={[cx + 1.3, 0, wz + 0.35]} />
      <Plant size={1.15} position={[cx - 0.6, 0, wz + 0.5]} />
      <Plant size={1.5} position={[r.x[1] - 0.6, 0, wz + 0.5]} />
      {/* beyaz tahta (sol duvar) */}
      <mesh position={[r.x[0] + 0.13, 1.4, cz + 1]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[1.8, 1]} />
        <meshStandardMaterial color="#f7f7f4" roughness={0.3} />
      </mesh>
      <Rug room={r} w={8} d={4.6} dx={0.4} dz={0.4} />
      {[-2.6, 0, 2.6].map((dx, i) => (
        <group key={dx}>
          <Desk n={i * 2} position={[cx + dx + 0.4, 0, cz - 0.2]} />
          <Chair position={[cx + dx + 0.4, 0, cz + 0.45]} />
        </group>
      ))}
      <Desk n={7} position={[cx - 1.6, 0, cz + 2.3]} />
      <Chair position={[cx - 1.6, 0, cz + 2.95]} />
      <Plant size={0.3} position={[cx - 3.2, 0.76, cz - 0.4]} />
      <Plant size={0.3} position={[cx + 1.6, 0.76, cz - 0.4]} />
    </group>
  )
}

function CeoOffice() {
  const r = ROOMS[1]
  const [cx, cz] = C(r)
  const wz = r.z[0]
  const navy = useMemo(() => new THREE.MeshStandardMaterial({ color: r.accent, roughness: 0.8 }), [r.accent])
  return (
    <group>
      {/* lacivert arka duvar, solda yeşilliğe açılan cam kapı */}
      {box([r.x[1] - r.x[0] - 1.4, H, 0.12], [cx + 0.7, H / 2, wz + 0.06], navy)}
      <WindowBand x={[r.x[0], r.x[0] + 1.4]} z={wz} y0={0} />
      <WindowBand x={[r.x[0] + 1.4, r.x[1]]} z={wz} y0={2.55} />
      <WallTV kind="landscape" w={2.3} h={1.3} position={[cx, 1.6, wz + 0.14]} />
      <Hexagon position={[cx + 2.1, 1.75, wz + 0.14]} />
      <pointLight position={[cx + 2.1, 1.75, wz + 0.5]} color="#8fb8ff" intensity={0.8} distance={2.2} />
      <Rug room={r} w={6} d={4} dz={0.5} />
      <ExecDesk position={[cx, 0, cz - 1.1]} rotation-y={Math.PI} />
      <Chair exec position={[cx, 0, cz - 1.95]} rotation-y={Math.PI} />
      <LoungeChair position={[cx - 1.2, 0, cz + 0.9]} rotation-y={Math.PI + 0.5} />
      <LoungeChair position={[cx + 1.2, 0, cz + 0.9]} rotation-y={Math.PI - 0.5} />
      <CoffeeTable position={[cx, 0, cz + 1.0]} />
      <Plant size={0.3} position={[cx, 0.44, cz + 1.0]} />
      <Bookshelf position={[r.x[1] - 0.9, 0, wz + 0.35]} />
      <Plant size={1.6} position={[r.x[0] + 2.1, 0, wz + 0.6]} />
      <Plant size={1.4} position={[r.x[1] - 1.9, 0, wz + 0.6]} />
    </group>
  )
}

function Design() {
  const r = ROOMS[2]
  const [cx, cz] = C(r)
  const wz = r.z[0]
  const pink = useMemo(() => new THREE.MeshStandardMaterial({ color: r.accent, roughness: 0.85 }), [r.accent])
  return (
    <group>
      {box([r.x[1] - r.x[0], 1.75, 0.12], [cx, 0.875, wz + 0.06], pink)}
      <WindowBand x={r.x} z={wz} y0={1.75} />
      <mesh position={[cx + 0.6, 1.05, wz + 0.14]}>
        <planeGeometry args={[5.4, 1.4]} />
        <meshStandardMaterial map={moodboard()} roughness={0.8} />
      </mesh>
      {/* uzun alçak dolap */}
      {box([6.5, 0.7, 0.45], [cx + 0.4, 0.35, wz + 0.35], MAT.pedestal)}
      <Rug room={r} w={7.2} d={3.6} dx={0.2} dz={0.6} />
      {[-2.4, 0, 2.4].map((dx, i) => (
        <group key={dx}>
          <Desk dual={false} screen="design" n={i} position={[cx + dx + 0.2, 0, cz + 0.2]} />
          <Chair position={[cx + dx + 0.2, 0, cz + 0.85]} />
        </group>
      ))}
      {/* sağ duvar rafı */}
      {box([0.4, 2, 1.6], [r.x[1] - 0.3, 1, cz - 0.5], MAT.potDark)}
      <Plant size={1.2} position={[r.x[1] - 0.7, 0, wz + 0.5]} />
      <Plant size={1.0} position={[r.x[1] - 0.6, 0, r.z[1] - 0.7]} />
    </group>
  )
}

// ─── Ön sıra ────────────────────────────────────────────────────────────────
function Marketing() {
  const r = ROOMS[3]
  const [cx, cz] = C(r)
  const wz = r.z[0]
  return (
    <group>
      <AccentWall x={r.x} z={wz} color={r.accent} />
      <mesh position={[cx - 0.2, 1.45, wz + 0.13]}>
        <planeGeometry args={[2.4, 1.2]} />
        <meshStandardMaterial map={stickyBoard()} roughness={0.5} />
      </mesh>
      <Rug room={r} w={5.8} d={3.4} dz={0.5} />
      {[-1.4, 1.4].map((dx, i) => (
        <group key={dx}>
          <Desk n={10 + i * 2} position={[cx + dx, 0, cz + 0.1]} />
          <Chair position={[cx + dx, 0, cz + 0.75]} />
        </group>
      ))}
      <Cabinet w={1} position={[r.x[1] - 1.2, 0, wz + 0.35]} />
      <Plant size={1.0} position={[r.x[0] + 0.8, 0, wz + 0.6]} />
      <Plant size={1.0} position={[r.x[1] - 0.6, 0, wz + 0.6]} />
    </group>
  )
}

function Research() {
  const r = ROOMS[4]
  const [cx, cz] = C(r)
  const wz = r.z[0]
  return (
    <group>
      <AccentWall x={r.x} z={wz} color={r.accent} />
      <WallTV kind="chart" w={2.6} h={1.1} position={[cx, 1.5, wz + 0.14]} />
      <Rug room={r} w={5.8} d={3.6} dz={0.5} />
      {[-2, 0, 2].map((dx, i) => (
        <group key={dx}>
          <Desk n={20 + i * 2} screen={i === 1 ? 'chart' : 'code'} position={[cx + dx, 0, cz]} scale={[0.9, 1, 1]} />
          <Chair position={[cx + dx, 0, cz + 0.65]} />
        </group>
      ))}
      <Plant size={0.9} position={[r.x[1] - 0.8, 0, wz + 0.7]} />
      <Plant size={0.9} position={[r.x[0] + 0.8, 0, r.z[1] - 0.6]} dark />
    </group>
  )
}

function Meeting() {
  const r = ROOMS[5]
  const [cx, cz] = C(r)
  const wz = r.z[0]
  const slat = useMemo(() => new THREE.MeshStandardMaterial({ map: slats(), roughness: 0.6 }), [])
  return (
    <group>
      <AccentWall x={r.x} z={wz} color={r.accent} />
      <WallTV kind="landscape" w={2.3} h={1.25} position={[cx, 1.55, wz + 0.14]} />
      {/* ahşap çıtalı kolonlar + sıcak ışık */}
      {[r.x[0] + 0.7, r.x[1] - 0.7].map((x) => (
        <group key={x}>
          {box([0.9, H, 0.25], [x, H / 2, wz + 0.25], slat)}
          <pointLight position={[x, 2.2, wz + 0.8]} color="#ffd29a" intensity={0.9} distance={3} />
        </group>
      ))}
      <Rug room={r} w={4.2} d={4.6} dz={0.4} />
      <ConferenceTable position={[cx, 0, cz + 0.3]} />
      <Plant size={0.9} position={[r.x[0] + 1.6, 0, wz + 0.6]} />
      <Plant size={0.9} position={[r.x[1] - 1.6, 0, wz + 0.6]} />
      {/* iç cam bölmeler (masa alanını çevreler) */}
      <Glass axis="z" from={wz + 0.5} to={r.z[1]} at={r.x[0] + 1.15} />
      <Glass axis="z" from={wz + 0.5} to={r.z[1]} at={r.x[1] - 1.15} />
    </group>
  )
}

function Operations() {
  const r = ROOMS[6]
  const [cx, cz] = C(r)
  const wz = r.z[0]
  return (
    <group>
      <AccentWall x={[r.x[0], r.x[1] - 0.6]} z={wz} color={r.accent} />
      <WallTV kind="map" w={2.8} h={1.4} position={[cx - 0.8, 1.6, wz + 0.14]} />
      {[0, 1, 2].map((i) => <Rack key={i} position={[r.x[1] - 2.4 + i * 0.65, 0, wz + 0.6]} />)}
      <Rug room={r} w={5.2} d={3.4} dx={-0.6} dz={0.5} />
      {[-1.9, 0.6].map((dx, i) => (
        <group key={dx}>
          <Desk n={30 + i * 2} position={[cx + dx, 0, cz + 0.2]} />
          <Chair position={[cx + dx, 0, cz + 0.85]} />
        </group>
      ))}
      <Plant size={1.0} position={[r.x[0] + 0.7, 0, wz + 1.6]} />
      <Plant size={1.2} position={[r.x[1] - 0.7, 0, r.z[1] - 0.8]} />
    </group>
  )
}

// ─── Bölmeler ve koridor ──────────────────────────────────────────────────
function Partitions() {
  return (
    <group>
      {/* arka sıra arası tam boy cam + ön tarafta saksı kutuları */}
      {[-5, 5].map((x) => (
        <group key={x}>
          <Glass axis="z" from={BACK[0]} to={BACK[1]} at={x} />
          {box([0.6, 0.45, 0.9], [x, 0.225, BACK[1] - 0.6], MAT.potDark)}
          <Plant size={0.9} position={[x, 0.45, BACK[1] - 0.6]} />
        </group>
      ))}
      {/* arka sıranın koridora bakan yüzü: Yazılım ve Tasarım'da alçak cam, CEO açık */}
      <Glass axis="x" from={-15} to={-8.5} at={BACK[1]} h={1.1} mullion={2} />
      <Glass axis="x" from={-6.8} to={-5} at={BACK[1]} h={2.4} />
      <Glass axis="x" from={6.6} to={15} at={BACK[1]} h={1.1} mullion={2} />
      {/* ön sıra arası cam + koridora bakan yüz */}
      {[-7.5, 0, 7.5].map((x) => (
        <Glass key={x} axis="z" from={FRONT[0]} to={FRONT[1]} at={x} h={H - 0.2} />
      ))}
      <Glass axis="x" from={0} to={2.4} at={FRONT[0] - 0.01} h={2.4} />
      <Glass axis="x" from={5.1} to={7.5} at={FRONT[0] - 0.01} h={2.4} />
      {/* koridor bitkileri */}
      <Plant size={1.1} position={[-14.3, 0, -1.2]} />
      <Plant size={1.1} position={[14.3, 0, -0.6]} />
      <Plant size={0.8} position={[-14.3, 0, 7.3]} />
    </group>
  )
}

// ─── Etkileşim: oda alanları, tabelalar, kamera ─────────────────────────
function RoomZones() {
  const { focusRoom, hoverRoom } = useStore.getState()
  const roomId = useStore((s) => s.roomId)
  const hovered = useStore((s) => s.hoveredRoom)
  return ROOMS.map((r) => {
    const [cx, cz] = C(r)
    const d = DEPT_BY_ID.get(r.id)
    const Icon = ICONS[d?.icon]
    const on = roomId === r.id || hovered === r.id
    return (
      <group key={r.id}>
        <mesh
          position={[cx, 0.02, cz]}
          rotation-x={-Math.PI / 2}
          onPointerOver={(e) => {
            e.stopPropagation()
            hoverRoom(r.id)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            if (useStore.getState().hoveredRoom === r.id) hoverRoom(null)
            document.body.style.cursor = ''
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (e.delta <= 4) focusRoom(r.id)
          }}
        >
          <planeGeometry args={[r.x[1] - r.x[0] - 0.1, r.z[1] - r.z[0] - 0.1]} />
          <meshBasicMaterial color={d?.color ?? '#fff'} transparent opacity={on ? 0.1 : 0} depthWrite={false} />
        </mesh>
        <Html position={[r.x[0] + 0.4, r.z === BACK ? H + 0.35 : H + 0.1, r.z[0] + 0.3]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              focusRoom(r.id)
            }}
            className="pointer-events-auto flex -translate-y-full cursor-pointer items-center gap-1.5 rounded-lg border bg-white/90 py-1 pr-2.5 pl-1 whitespace-nowrap shadow-md backdrop-blur dark:bg-slate-900/85"
            style={{ borderColor: alpha(d?.color ?? '#888', on ? 0.9 : 0.4) }}
          >
            <span className="grid h-5 w-5 place-items-center rounded-md" style={{ background: alpha(d?.color ?? '#888', 0.18), color: d?.color }}>
              {Icon && <Icon size={12} />}
            </span>
            <span className="text-[11.5px] font-semibold text-slate-800 dark:text-white">{d?.name}</span>
          </button>
        </Html>
      </group>
    )
  })
}

const HOME = { target: new THREE.Vector3(0, 0, -0.2), pos: new THREE.Vector3(0, 21, 23) }
function CameraRig() {
  const roomId = useStore((s) => s.roomId)
  const controls = useThree((s) => s.controls)
  const camera = useThree((s) => s.camera)
  const goal = useRef(null)
  useEffect(() => {
    const r = ROOMS.find((x) => x.id === roomId)
    if (!r) goal.current = HOME
    else {
      const [cx, cz] = C(r)
      const t = new THREE.Vector3(cx, 0.6, cz)
      goal.current = { target: t, pos: t.clone().add(new THREE.Vector3(0, 8.5, 9.5)) }
    }
  }, [roomId])
  useFrame((_, dt) => {
    const g = goal.current
    if (!g || !controls) return
    const k = 1 - Math.exp(-dt * 3)
    camera.position.lerp(g.pos, k)
    controls.target.lerp(g.target, k)
    controls.update()
    if (camera.position.distanceToSquared(g.pos) < 1e-4) goal.current = null
  })
  return null
}

export default function HQ() {
  const dark = useStore((s) => s.theme === 'dark')
  return (
    <div className="absolute inset-0">
      <Canvas shadows dpr={[1, 1.75]} camera={{ position: HOME.pos.toArray(), fov: 34, near: 0.5, far: 200 }} gl={{ antialias: false }} onPointerMissed={() => useStore.getState().focusRoom(null)}>
        <color attach="background" args={[dark ? '#0d1117' : '#eef0f2']} />
        <Suspense fallback={null}>
          <Environment files={lobby} environmentIntensity={dark ? 0.25 : 0.75} />
          <hemisphereLight args={['#eef4ff', '#b9bcc2', dark ? 0.15 : 0.45]} />
          <directionalLight position={[-12, 22, 14]} intensity={dark ? 0.4 : 2.3} color="#ffffff" castShadow shadow-mapSize={[4096, 4096]} shadow-bias={-0.0002} shadow-normalBias={0.025}>
            <orthographicCamera attach="shadow-camera" args={[-18, 18, 12, -12, 1, 60]} />
          </directionalLight>
          <Shell />
          <Software />
          <CeoOffice />
          <Design />
          <Marketing />
          <Research />
          <Meeting />
          <Operations />
          <Partitions />
          <RoomZones />
        </Suspense>
        <OrbitControls makeDefault target={HOME.target.toArray()} enableDamping minDistance={6} maxDistance={55} maxPolarAngle={1.25} minAzimuthAngle={-0.8} maxAzimuthAngle={0.8} />
        <CameraRig />
        <EffectComposer multisampling={0}>
          <N8AO aoRadius={0.6} intensity={1.6} distanceFalloff={1} />
          <Bloom intensity={dark ? 0.8 : 0.35} luminanceThreshold={0.82} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
          <SMAA />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
