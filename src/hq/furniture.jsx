// Mobilyalar (gerçek ölçülerde, metre): çalışma masası + çift monitör, ofis sandalyesi, sunucu dolabı,
// saksı bitkileri, berjer, sehpa, kitaplık, duvar ekranı, dolap
import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { books, screenTex } from './textures.js'

export const MAT = {
  deskTop: new THREE.MeshStandardMaterial({ color: '#f1f0ec', roughness: 0.45 }),
  steel: new THREE.MeshStandardMaterial({ color: '#3a3e44', roughness: 0.35, metalness: 0.75 }),
  black: new THREE.MeshStandardMaterial({ color: '#16181c', roughness: 0.45, metalness: 0.2 }),
  mesh: new THREE.MeshStandardMaterial({ color: '#1d2025', roughness: 0.85 }),
  white: new THREE.MeshStandardMaterial({ color: '#f4f4f2', roughness: 0.5 }),
  pedestal: new THREE.MeshStandardMaterial({ color: '#dcdcd8', roughness: 0.5 }),
  pot: new THREE.MeshStandardMaterial({ color: '#e8e6e1', roughness: 0.6 }),
  potDark: new THREE.MeshStandardMaterial({ color: '#2c2f33', roughness: 0.6 }),
  soil: new THREE.MeshStandardMaterial({ color: '#3b2a1d', roughness: 1 }),
  fabric: new THREE.MeshStandardMaterial({ color: '#8e8c89', roughness: 0.95 }),
  execDesk: new THREE.MeshStandardMaterial({ color: '#2d3240', roughness: 0.35, metalness: 0.2 }),
}
const LEAF = ['#2f7a2c', '#3f9136', '#256524', '#56a83f', '#2c6f2a'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, side: THREE.DoubleSide }))

function Screen({ kind, n, w, h, ...p }) {
  return (
    <group {...p}>
      <RoundedBox args={[w + 0.03, h + 0.03, 0.025]} radius={0.006} material={MAT.black} castShadow />
      <mesh position-z={0.0135}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={screenTex(kind, n)} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Çalışma masası: beyaz tabla, metal ayak, çekmece, çift monitör (yazılım) ya da tek geniş ekran (tasarım) */
export function Desk({ screen = 'code', n = 0, dual = true, ...p }) {
  return (
    <group {...p}>
      <RoundedBox args={[1.5, 0.035, 0.75]} radius={0.008} position={[0, 0.74, 0]} material={MAT.deskTop} castShadow receiveShadow />
      {[-0.7, 0.7].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.37, -0.3]} material={MAT.steel} castShadow>
            <boxGeometry args={[0.04, 0.74, 0.04]} />
          </mesh>
          <mesh position={[0, 0.37, 0.3]} material={MAT.steel} castShadow>
            <boxGeometry args={[0.04, 0.74, 0.04]} />
          </mesh>
        </group>
      ))}
      <mesh position={[-0.5, 0.3, -0.02]} material={MAT.pedestal} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.58, 0.55]} />
      </mesh>
      {dual ? (
        <>
          <Screen kind={screen} n={n} w={0.52} h={0.3} position={[-0.27, 1.02, -0.22]} rotation-y={0.12} />
          <Screen kind={screen} n={n + 1} w={0.52} h={0.3} position={[0.27, 1.02, -0.22]} rotation-y={-0.12} />
        </>
      ) : (
        <Screen kind={screen} n={n} w={0.66} h={0.38} position={[0, 1.07, -0.22]} />
      )}
      <mesh position={[0, 0.84, -0.24]} material={MAT.steel}>
        <boxGeometry args={[0.04, 0.2, 0.03]} />
      </mesh>
      <mesh position={[0, 0.761, -0.24]} material={MAT.steel}>
        <boxGeometry args={[0.24, 0.012, 0.16]} />
      </mesh>
      <RoundedBox args={[0.42, 0.016, 0.13]} radius={0.005} position={[0, 0.765, 0.1]} material={MAT.white} castShadow />
      <RoundedBox args={[0.06, 0.022, 0.1]} radius={0.01} position={[0.32, 0.765, 0.1]} material={MAT.white} />
    </group>
  )
}

/** Ergonomik ofis sandalyesi (siyah file sırtlık) */
export function Chair({ exec = false, ...p }) {
  const back = exec ? 0.75 : 0.58
  return (
    <group {...p}>
      <RoundedBox args={[0.5, 0.07, 0.48]} radius={0.025} position={[0, 0.47, 0]} material={MAT.black} castShadow receiveShadow />
      <RoundedBox args={[0.46, back, 0.05]} radius={0.04} position={[0, 0.5 + back / 2 + 0.06, 0.24]} rotation-x={0.1} material={MAT.mesh} castShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.25, 0.62, 0.02]} material={MAT.black} castShadow>
          <boxGeometry args={[0.04, 0.04, 0.3]} />
        </mesh>
      ))}
      <mesh position={[0, 0.25, 0]} material={MAT.steel}>
        <cylinderGeometry args={[0.025, 0.025, 0.42, 12]} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} rotation-y={(i / 5) * Math.PI * 2}>
          <mesh position={[0, 0.05, 0.17]} material={MAT.steel} castShadow>
            <boxGeometry args={[0.035, 0.03, 0.34]} />
          </mesh>
          <mesh position={[0, 0.03, 0.32]} material={MAT.black}>
            <sphereGeometry args={[0.028, 10, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Sunucu dolabı: siyah gövde, cam kapak ardında mavi LED satırları */
export function Rack({ ...p }) {
  const leds = useMemo(() => {
    const out = []
    for (let r = 0; r < 14; r++) for (let c = 0; c < 6; c++) if ((r * 7 + c * 3) % 5 !== 0) out.push([c, r])
    return out
  }, [])
  return (
    <group {...p}>
      <RoundedBox args={[0.6, 2.0, 0.9]} radius={0.015} position={[0, 1.0, 0]} material={MAT.black} castShadow receiveShadow />
      <group position={[0, 0, 0.452]}>
        {leds.map(([c, r], i) => (
          <mesh key={i} position={[-0.2 + c * 0.08, 0.3 + r * 0.115, 0]}>
            <planeGeometry args={[0.045, 0.012]} />
            <meshBasicMaterial color={i % 9 === 0 ? '#7dd3fc' : '#2f7bff'} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, 1.1, 0.7]} color="#3b82f6" intensity={0.6} distance={1.8} />
    </group>
  )
}

/** Saksı bitkisi: kavisli yaprak kümeleri (büyük: ficus/yucca, küçük: masa bitkisi) */
export function Plant({ size = 1, dark = false, ...p }) {
  const leaves = useMemo(() => {
    const out = []
    const n = Math.round(70 * Math.sqrt(size))
    for (let i = 0; i < n; i++) {
      const u = i / n
      out.push({
        a: i * 2.399,
        y: (0.15 + Math.pow(u, 0.7) * 0.95) * size, // aşağıdan yukarı katmanlar
        tilt: 1.25 - u * 0.75 + ((i * 13) % 7) / 25, // alt yapraklar yatık, üstler dik
        len: (0.32 + ((i * 7) % 5) / 14) * size * (1 - u * 0.35),
        m: i % LEAF.length,
      })
    }
    return out
  }, [size])
  const leafGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    s.bezierCurveTo(0.22, 0.25, 0.2, 0.7, 0, 1)
    s.bezierCurveTo(-0.2, 0.7, -0.22, 0.25, 0, 0)
    const g = new THREE.ShapeGeometry(s, 8)
    // yaprağı orta damarı boyunca hafifçe kıvır
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.abs(p.getX(i)) * 0.35 - p.getY(i) * p.getY(i) * 0.25)
    g.computeVertexNormals()
    return g
  }, [])
  const pr = 0.16 * Math.max(0.7, size)
  return (
    <group {...p}>
      <mesh position={[0, pr * 1.1, 0]} material={dark ? MAT.potDark : MAT.pot} castShadow receiveShadow>
        <cylinderGeometry args={[pr, pr * 0.8, pr * 2.2, 28]} />
      </mesh>
      <mesh position={[0, pr * 2.2 - 0.01, 0]} material={MAT.soil}>
        <cylinderGeometry args={[pr * 0.94, pr * 0.94, 0.02, 20]} />
      </mesh>
      <mesh position={[0, pr * 2.2 + size * 0.4, 0]} material={MAT.soil}>
        <cylinderGeometry args={[0.012 * size, 0.02 * size, size * 0.8, 6]} />
      </mesh>
      {leaves.map((l, i) => (
        <group key={i} position={[0, pr * 2.2 + l.y, 0]} rotation={[0, l.a, 0]}>
          <mesh geometry={leafGeo} material={LEAF[l.m]} rotation={[-l.tilt, 0, 0]} scale={[l.len * 0.95, l.len * 1.2, l.len * 0.8]} castShadow />
        </group>
      ))}
    </group>
  )
}

export function LoungeChair({ color = '#8f8d8a', ...p }) {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.95 }), [color])
  return (
    <group {...p}>
      <RoundedBox args={[0.8, 0.3, 0.75]} radius={0.12} position={[0, 0.32, 0]} material={m} castShadow receiveShadow />
      <RoundedBox args={[0.82, 0.55, 0.22]} radius={0.1} position={[0, 0.6, 0.3]} material={m} castShadow />
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.16, 0.38, 0.7]} radius={0.07} position={[s * 0.36, 0.5, 0.02]} material={m} castShadow />
      ))}
      {[[-0.3, -0.28], [0.3, -0.28], [-0.3, 0.28], [0.3, 0.28]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z]} material={MAT.black}>
          <cylinderGeometry args={[0.018, 0.012, 0.16, 8]} />
        </mesh>
      ))}
    </group>
  )
}

export function CoffeeTable(p) {
  return (
    <group {...p}>
      <mesh position={[0, 0.42, 0]} material={MAT.white} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.03, 40]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos(i * 2.09) * 0.25, 0.2, Math.sin(i * 2.09) * 0.25]} material={MAT.black}>
          <cylinderGeometry args={[0.014, 0.014, 0.4, 8]} />
        </mesh>
      ))}
    </group>
  )
}

export function Bookshelf(p) {
  return (
    <group {...p}>
      <mesh position={[0, 0.95, 0]} material={MAT.black} castShadow receiveShadow>
        <boxGeometry args={[0.9, 1.9, 0.35]} />
      </mesh>
      <mesh position={[0, 0.95, 0.176]}>
        <planeGeometry args={[0.82, 1.8]} />
        <meshStandardMaterial map={books()} roughness={0.8} />
      </mesh>
    </group>
  )
}

/** Duvar ekranı (ince çerçeveli TV) */
export function WallTV({ kind = 'landscape', w = 2, h = 1.12, ...p }) {
  return <Screen kind={kind} n={0} w={w} h={h} {...p} />
}

export function ExecDesk(p) {
  return (
    <group {...p}>
      <RoundedBox args={[2.3, 0.06, 0.95]} radius={0.015} position={[0, 0.76, 0]} material={MAT.execDesk} castShadow receiveShadow />
      <mesh position={[0, 0.37, 0.1]} material={MAT.execDesk} castShadow>
        <boxGeometry args={[2.1, 0.74, 0.6]} />
      </mesh>
      <mesh position={[0, 0.4, 0.405]}>
        <boxGeometry args={[1.8, 0.5, 0.01]} />
        <meshStandardMaterial color="#4a5164" roughness={0.4} />
      </mesh>
      {/* dizüstü */}
      <group position={[0, 0.79, 0.05]}>
        <mesh material={new THREE.MeshStandardMaterial({ color: '#c9ccd2', metalness: 0.8, roughness: 0.3 })}>
          <boxGeometry args={[0.34, 0.012, 0.24]} />
        </mesh>
        <mesh position={[0, 0.12, -0.12]} rotation-x={0.25} material={new THREE.MeshStandardMaterial({ color: '#c9ccd2', metalness: 0.8, roughness: 0.3 })}>
          <boxGeometry args={[0.34, 0.24, 0.01]} />
        </mesh>
      </group>
      {/* masa lambası */}
      <group position={[-0.85, 0.79, -0.15]}>
        <mesh material={MAT.black}>
          <cylinderGeometry args={[0.07, 0.08, 0.02, 20]} />
        </mesh>
        <mesh position={[0.05, 0.2, 0]} rotation-z={-0.3} material={MAT.black}>
          <cylinderGeometry args={[0.008, 0.008, 0.42, 8]} />
        </mesh>
        <mesh position={[0.12, 0.38, 0]} rotation-z={0.9} material={MAT.black}>
          <coneGeometry args={[0.06, 0.1, 20, 1, true]} />
        </mesh>
        <pointLight position={[0.14, 0.32, 0]} color="#ffd9a8" intensity={0.5} distance={1.5} />
      </group>
      <Plant size={0.35} position={[0.8, 0.79, -0.2]} />
    </group>
  )
}

export function Cabinet({ w = 1.2, ...p }) {
  return (
    <group {...p}>
      <mesh position={[0, 0.36, 0]} material={MAT.potDark} castShadow receiveShadow>
        <boxGeometry args={[w, 0.72, 0.42]} />
      </mesh>
      {[-w / 4, w / 4].map((x) => (
        <mesh key={x} position={[x, 0.36, 0.212]}>
          <planeGeometry args={[w / 2 - 0.03, 0.66]} />
          <meshStandardMaterial color="#3b3f45" roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}
