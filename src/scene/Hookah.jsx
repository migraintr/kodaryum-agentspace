// Nargileler (CEO odası ve Mola Alanı): cam gövde + su, halkalı altın gövde, kül tablası, kil lüle,
// yanan kömürler ve iki hortum. Hortumu kullanan figür varsa uç onun eline uzanır; çekişte kömür
// parlar, lüleden ince duman tüter.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ROOM_BY_ID } from './layout.js'
import { SMOKERS, emitSmoke } from './presence.js'

// p: oda merkezine göre konum; rest: hortum boştayken ucunun durduğu yer (oda merkezine göre)
export const HOOKAHS = [
  { id: 'yonetim', room: 'yonetim', p: [-5.6, 2.15], glass: '#10b981', hoses: [['yonetim-a', [-5.95, 0.5, 1.5]], ['yonetim-b', [-6.9, 0.36, 2.0]]] },
  { id: 'mola', room: 'mola', p: [-2.3, -0.5], glass: '#8b5cf6', hoses: [['mola-a', [-3.3, 0.5, 0.2]], ['mola-b', [-1.7, 0.05, -0.6]]] },
]

const lathe = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg)
const VASE = [[0, 0], [0.16, 0.0], [0.21, 0.05], [0.245, 0.15], [0.235, 0.25], [0.18, 0.33], [0.09, 0.39], [0.06, 0.43], [0.062, 0.46], [0, 0.46]]
const WATER = [[0, 0.015], [0.19, 0.02], [0.225, 0.1], [0.215, 0.17], [0, 0.17]]
const STEM = [
  [0, 0.44], [0.07, 0.44], [0.07, 0.47], [0.04, 0.49], [0.032, 0.56], [0.05, 0.58], [0.05, 0.6], [0.032, 0.62], [0.03, 0.76],
  [0.055, 0.78], [0.06, 0.8], [0.055, 0.82], [0.03, 0.84], [0.028, 0.95], [0.04, 0.97], [0, 0.97],
]
const BOWL = [[0.02, 0.985], [0.05, 0.99], [0.075, 1.03], [0.088, 1.08], [0.082, 1.1], [0, 1.1]]
const HOSE_SEGMENTS = 40

// Hortum: lüle girişinden yere sarkıp ele (ya da dinlenme noktasına) uzanan eğri
function hoseCurve(start, end) {
  const mid = start.clone().lerp(end, 0.5)
  mid.y = Math.min(start.y, end.y) * 0.15 + 0.05
  return new THREE.CatmullRomCurve3([
    start,
    start.clone().add(new THREE.Vector3(0, -0.2, 0)).lerp(mid, 0.25),
    mid,
    end.clone().lerp(mid, 0.3).setY(Math.max(0.08, end.y - 0.35)),
    end,
  ])
}

function Hose({ hookah, hoseKey, rest, side }) {
  const mesh = useRef()
  const tip = useRef()
  const base = useMemo(() => {
    const r = ROOM_BY_ID.get(hookah.room)
    return {
      port: new THREE.Vector3(r.cx + hookah.p[0] + side * 0.07, 0.6, r.cz + hookah.p[1]),
      rest: new THREE.Vector3(r.cx + rest[0], rest[1], r.cz + rest[2]),
    }
  }, [hookah, rest, side])
  const end = useMemo(() => new THREE.Vector3(), [])
  const geometry = useMemo(() => new THREE.TubeGeometry(hoseCurve(base.port, base.rest), HOSE_SEGMENTS, 0.018, 6), [base])

  useFrame((_, dt) => {
    const smoker = SMOKERS.get(hoseKey)
    const target = smoker?.active ? smoker.hand : base.rest
    end.lerp(target, Math.min(1, dt * 10))
    if (end.lengthSq() === 0) end.copy(target)
    // Tüp geometrisini yerinde güncelle (köşe sayısı sabit; yeni GPU tamponu açılmaz)
    const next = new THREE.TubeGeometry(hoseCurve(base.port, end), HOSE_SEGMENTS, 0.018, 6)
    geometry.attributes.position.array.set(next.attributes.position.array)
    geometry.attributes.normal.array.set(next.attributes.normal.array)
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.normal.needsUpdate = true
    geometry.computeBoundingSphere()
    next.dispose()
    tip.current.position.copy(end)
  })

  return (
    <>
      <mesh ref={mesh} geometry={geometry} frustumCulled={false}>
        <meshStandardMaterial color="#1f2937" roughness={0.5} />
      </mesh>
      <mesh ref={tip}>
        <sphereGeometry args={[0.03, 12, 8]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.25} />
      </mesh>
    </>
  )
}

function Hookah({ hookah }) {
  const coals = useRef()
  const glow = useRef()
  const wisp = useRef(0)
  const r = ROOM_BY_ID.get(hookah.room)
  const x = r.cx + hookah.p[0]
  const z = r.cz + hookah.p[1]
  const geo = useMemo(() => ({ vase: lathe(VASE), water: lathe(WATER), stem: lathe(STEM), bowl: lathe(BOWL) }), [])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const inhale = Math.max(0, ...hookah.hoses.map(([k]) => SMOKERS.get(k)?.inhale ?? 0))
    const flicker = 0.75 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.07 + inhale * 0.6
    coals.current.children.forEach((c) => c.material.color.setRGB(1, 0.32 + flicker * 0.18, 0.05).multiplyScalar(flicker))
    glow.current.material.opacity = 0.25 + inhale * 0.45
    // lüleden ince, sürekli tüten duman; çekişte yoğunlaşır
    wisp.current -= dt
    if (wisp.current <= 0) {
      emitSmoke(x + (Math.random() - 0.5) * 0.05, 1.16, z, 1, 0.25 + inhale * 0.6)
      wisp.current = 0.35 - inhale * 0.25
    }
  })

  return (
    <group>
      <group position={[x, 0.04, z]}>
        <mesh geometry={geo.vase}>
          <meshStandardMaterial color={hookah.glass} transparent opacity={0.55} roughness={0.08} metalness={0.2} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh geometry={geo.water}>
          <meshStandardMaterial color="#bae6fd" transparent opacity={0.45} roughness={0.05} depthWrite={false} />
        </mesh>
        <mesh geometry={geo.stem}>
          <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.22} />
        </mesh>
        {/* kül tablası */}
        <mesh position-y={0.9}>
          <cylinderGeometry args={[0.15, 0.13, 0.018, 36]} />
          <meshStandardMaterial color="#e5e7eb" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh geometry={geo.bowl}>
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>
        {/* folyo + kömürler */}
        <mesh position-y={1.105}>
          <cylinderGeometry args={[0.085, 0.085, 0.01, 24]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.35} />
        </mesh>
        <group ref={coals} position-y={1.125}>
          {[[-0.03, 0.02], [0.035, 0.01], [0, -0.035]].map(([cx, cz], i) => (
            <mesh key={i} position={[cx, 0, cz]} rotation-y={i}>
              <boxGeometry args={[0.04, 0.025, 0.04]} />
              <meshBasicMaterial color="#f97316" toneMapped={false} />
            </mesh>
          ))}
        </group>
        <mesh ref={glow} position-y={1.13} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.16, 24]} />
          <meshBasicMaterial color="#fb923c" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        {/* hortum çıkışları */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.06, 0.56, 0]} rotation-z={s * Math.PI / 2}>
            <cylinderGeometry args={[0.014, 0.014, 0.06, 10]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.22} />
          </mesh>
        ))}
      </group>
      {hookah.hoses.map(([key, rest], i) => (
        <Hose key={key} hookah={hookah} hoseKey={key} rest={rest} side={i ? 1 : -1} />
      ))}
    </group>
  )
}

export default function Hookahs() {
  return HOOKAHS.map((h) => <Hookah key={h.id} hookah={h} />)
}
