// Statik ofis maketini çizer: her parça türü tek bir InstancedMesh (≈6 draw call) +
// dokulu duvar ekranları + dönen hologramlar. Monitör içerikleri yavaşça kayar.
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildOffice } from './build.js'
import { beamTexture, glowTexture, uiTexture, wallTexture } from './textures.js'
import { glowBlending, useDark } from './theme.js'

// Her tema için bir kez kurulur (geometri aynı, yalnızca renkler değişir)
const OFFICES = {}
const officeFor = (theme) => (OFFICES[theme] ??= buildOffice(theme))

function Instanced({ items, geometry, material }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const mesh = ref.current
    const o = new THREE.Object3D()
    const c = new THREE.Color()
    items.forEach((it, i) => {
      o.position.set(it.x, it.y, it.z)
      o.rotation.set(0, it.ry, 0)
      o.scale.set(it.sx, it.sy, it.sz)
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
      mesh.setColorAt(i, c.set(it.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} />
}

function WallScreen({ type, color, x, y, z, w, h, dark }) {
  const map = useMemo(() => wallTexture(type, color, w, h), [type, color, w, h])
  return (
    <group position={[x, y, z]}>
      {/* duvara vuran ekran ışığı */}
      <mesh position-z={-0.015} scale={[w * 1.7, h * 2.4, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={glowTexture()} color={color} transparent opacity={dark ? 0.28 : 0.14} blending={glowBlending(dark)} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
    </group>
  )
}

// Kaide üzerinde dönen tel kafes hologram + aşağıdan yükselen ışık konisi
function Holograms({ items, dark }) {
  const refs = useRef([])
  useFrame(({ clock }, dt) => {
    refs.current.forEach((m, i) => {
      m.rotation.y += dt * 0.6
      m.position.y = items[i].y + Math.sin(clock.elapsedTime * 1.4 + i) * 0.05
    })
  })
  return items.map((h, i) => {
    const height = h.y - h.base
    return (
      <group key={i}>
        <mesh ref={(el) => (refs.current[i] = el)} position={[h.x, h.y, h.z]}>
          <icosahedronGeometry args={[h.r, h.type === 'globe' ? 2 : 1]} />
          <meshBasicMaterial color={h.color} wireframe transparent opacity={0.85} toneMapped={false} />
        </mesh>
        <mesh position={[h.x, h.base + height / 2, h.z]}>
          <cylinderGeometry args={[h.r * 1.1, 0.12, height, 24, 1, true]} />
          <meshBasicMaterial
            map={beamTexture()}
            color={h.color}
            transparent
            opacity={dark ? 0.5 : 0.3}
            side={THREE.DoubleSide}
            blending={glowBlending(dark)}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    )
  })
}

export default function Office() {
  const dark = useDark()
  const office = officeFor(dark ? 'dark' : 'light')
  const geo = useMemo(
    () => ({
      box: new THREE.BoxGeometry(1, 1, 1),
      cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 24),
      ball: new THREE.SphereGeometry(0.5, 24, 16),
      leaf: new THREE.IcosahedronGeometry(0.5, 0),
    }),
    [],
  )
  const mat = useMemo(
    () => ({
      solid: new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.15 }),
      leaf: new THREE.MeshStandardMaterial({ roughness: 0.75, flatShading: true }),
      neon: new THREE.MeshBasicMaterial({ toneMapped: false }),
      screen: new THREE.MeshBasicMaterial({ map: uiTexture(), toneMapped: false }),
    }),
    [],
  )

  useFrame((_, dt) => {
    const map = mat.screen.map
    map.offset.y = (map.offset.y + dt * 0.035) % 1
  })

  return (
    <group>
      <Instanced items={office.box} geometry={geo.box} material={mat.solid} />
      <Instanced items={office.cyl} geometry={geo.cyl} material={mat.solid} />
      <Instanced items={office.ball} geometry={geo.ball} material={mat.solid} />
      <Instanced items={office.leaf} geometry={geo.leaf} material={mat.leaf} />
      <Instanced items={office.neon} geometry={geo.box} material={mat.neon} />
      <Instanced items={office.screen} geometry={geo.box} material={mat.screen} />
      {office.panels.map((p, i) => (
        <WallScreen key={i} {...p} dark={dark} />
      ))}
      <Holograms items={office.holos} dark={dark} />
    </group>
  )
}
