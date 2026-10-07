// Nargile dumanı: SMOKE_QUEUE'dan gelen parçacıklar yükselir, rüzgârla savrulur, büyüyüp söner.
// Tek draw call; parçacık boyutu ve saydamlığı tek tek (özel shader) ayarlanır.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SMOKE_QUEUE } from './presence.js'
import { dotTexture } from './textures.js'
import { useDark } from './theme.js'

const MAX = 260

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  varying float vAlpha;
  uniform float uScale;
  void main() {
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`
const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }
`

export default function Smoke() {
  const dark = useDark()
  const geometry = useRef()
  const pool = useMemo(
    () => Array.from({ length: MAX }, () => ({ alive: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, age: 0, life: 1, size: 0, grow: 0, peak: 0 })),
    [],
  )
  const attrs = useMemo(
    () => ({ position: new Float32Array(MAX * 3), size: new Float32Array(MAX), alpha: new Float32Array(MAX) }),
    [],
  )
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: { uMap: { value: dotTexture() }, uColor: { value: new THREE.Color() }, uScale: { value: 300 } },
      }),
    [],
  )
  material.uniforms.uColor.value.set(dark ? '#e2e8f0' : '#94a3b8')

  useFrame(({ size, camera }, delta) => {
    const dt = Math.min(delta, 0.05)
    // Ekran yüksekliği ve görüş açısına göre nokta ölçeği (dünya birimini piksele çevirir)
    material.uniforms.uScale.value = size.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2))

    // Kuyruktaki yeni parçacıkları boş yuvalara yerleştir
    let slot = 0
    while (SMOKE_QUEUE.length) {
      const e = SMOKE_QUEUE.shift()
      while (slot < MAX && pool[slot].alive) slot++
      if (slot >= MAX) {
        SMOKE_QUEUE.length = 0
        break
      }
      const p = pool[slot]
      const s = e.strength
      p.alive = true
      p.x = e.x + (Math.random() - 0.5) * 0.04
      p.y = e.y
      p.z = e.z + (Math.random() - 0.5) * 0.04
      p.vx = (Math.random() - 0.5) * 0.12 * s
      p.vz = (Math.random() - 0.3) * 0.12 * s
      p.vy = (0.18 + Math.random() * 0.22) * (0.6 + s * 0.4)
      p.age = 0
      p.life = 2.4 + Math.random() * 1.6
      p.size = 0.06 + Math.random() * 0.06
      p.grow = (0.25 + Math.random() * 0.25) * (0.5 + s * 0.5)
      p.peak = (0.32 + Math.random() * 0.2) * Math.min(1, 0.45 + s * 0.55)
    }

    const { position, size: sizes, alpha } = attrs
    for (let i = 0; i < MAX; i++) {
      const p = pool[i]
      if (p.alive) {
        p.age += dt
        if (p.age >= p.life) p.alive = false
      }
      if (!p.alive) {
        alpha[i] = 0
        sizes[i] = 0
        continue
      }
      const u = p.age / p.life
      p.vx += Math.sin(p.age * 1.7 + i) * 0.02 * dt // hafif kıvrılma
      p.vy *= 1 - 0.35 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += p.vz * dt
      position[i * 3] = p.x
      position[i * 3 + 1] = p.y
      position[i * 3 + 2] = p.z
      sizes[i] = p.size + p.grow * u
      alpha[i] = p.peak * Math.min(1, u * 6) * (1 - u) ** 1.4
    }
    const g = geometry.current.attributes
    g.position.needsUpdate = true
    g.aSize.needsUpdate = true
    g.aAlpha.needsUpdate = true
  })

  return (
    <points frustumCulled={false} material={material}>
      <bufferGeometry ref={geometry}>
        <bufferAttribute attach="attributes-position" args={[attrs.position, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[attrs.size, 1]} />
        <bufferAttribute attach="attributes-aAlpha" args={[attrs.alpha, 1]} />
      </bufferGeometry>
    </points>
  )
}
