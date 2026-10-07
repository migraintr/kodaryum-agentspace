// CEO kürsüsünden kurullara yay boyunca akan veri parçacıkları (tek draw call).
// CEO bir kurula talimat verdiğinde o akış birkaç saniye hızlanır ve parlar.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BOARDS } from '../data.js'
import { useStore } from '../store.js'
import { DAIS_RADIUS, boardPosition, dotTexture } from './helpers.js'

const OUT = 9 // CEO → kurul (talimat)
const IN = 4 // kurul → CEO (rapor)
const PER = OUT + IN
const PULSE_MS = 2600
const REPORT = new THREE.Color('#475569')

const ARCS = BOARDS.map((b) => {
  const [x, , z] = boardPosition(b.angle)
  const dir = new THREE.Vector3(x, 0, z).normalize()
  const start = dir.clone().multiplyScalar(DAIS_RADIUS - 0.4).setY(1)
  const end = new THREE.Vector3(x, 0.9, z).addScaledVector(dir, -2.6)
  const mid = start.clone().lerp(end, 0.5).setY(2.6)
  return { id: b.id, curve: new THREE.QuadraticBezierCurve3(start, mid, end), color: new THREE.Color(b.color) }
})

export default function Flows() {
  const geometry = useRef()
  const { positions, colors } = useMemo(
    () => ({ positions: new Float32Array(ARCS.length * PER * 3), colors: new Float32Array(ARCS.length * PER * 4) }),
    [],
  )
  const point = useMemo(() => new THREE.Vector3(), [])
  const color = useMemo(() => new THREE.Color(), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const now = Date.now()
    const { pulses, selectedId } = useStore.getState()

    ARCS.forEach((arc, a) => {
      const since = now - (pulses[arc.id] ?? 0)
      const boost = since < PULSE_MS ? 1 - since / PULSE_MS : 0
      const dim = selectedId && selectedId !== arc.id ? 0.25 : 1
      const speed = 0.14 + boost * 0.6

      for (let i = 0; i < PER; i++) {
        const inbound = i >= OUT
        let u = (t * speed * (inbound ? 0.7 : 1) + i / (inbound ? IN : OUT) + a * 0.137) % 1
        if (inbound) u = 1 - u
        arc.curve.getPoint(u, point)
        point.toArray(positions, (a * PER + i) * 3)
        // Renk + alfa: uçlarda solar, talimat anında parlar
        color.copy(inbound ? REPORT : arc.color).multiplyScalar(inbound ? 1 : 1 + boost * 1.5)
        const c = (a * PER + i) * 4
        colors[c] = color.r
        colors[c + 1] = color.g
        colors[c + 2] = color.b
        colors[c + 3] = Math.sin(Math.PI * u) ** 0.6 * dim
      }
    })
    geometry.current.attributes.position.needsUpdate = true
    geometry.current.attributes.color.needsUpdate = true
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometry}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 4]} />
      </bufferGeometry>
      <pointsMaterial map={dotTexture()} size={0.34} vertexColors transparent alphaTest={0.02} depthWrite={false} toneMapped={false} />
    </points>
  )
}
