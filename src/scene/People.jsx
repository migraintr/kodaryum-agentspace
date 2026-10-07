// Masalarında oturan yapay zekâ çalışanları: ayakkabı, bacaklar, gövde, omuzlar, yaka, boyun, iki parçalı kollar,
// eller, kulaklar, baş, saç (uzun saç), operasyon ekibinde kulaklık. Tüm figürler 3 InstancedMesh'te; her karede klavye vuruşu,
// nefes ve ara sıra etrafa bakma hareketi.
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PLACES } from './layout.js'

const SEATED = PLACES.filter((p) => !p.standing)
const SKINS = ['#f1c7a6', '#e2ad86', '#c98f68', '#a06c4a', '#f5d6bf']
const HAIRS = ['#1b1410', '#3a2416', '#5b3a21', '#8a5a2b', '#111827', '#6b4f3a']
const PANTS = '#1e2638'
const SHOES = '#0f1117'
const HEADSET = '#0f172a'
const KINDS = ['box', 'cap', 'ball']

const LOOKS = SEATED.map((p, i) => ({
  skin: SKINS[(i * 7) % SKINS.length],
  hair: HAIRS[(i * 5 + 2) % HAIRS.length],
  shirt: `#${new THREE.Color(p.room.color).lerp(new THREE.Color(i % 2 ? '#f1f5f9' : '#1e293b'), 0.42).getHexString()}`,
  collar: i % 3 ? '#f8fafc' : '#1e293b',
  long: !!p.person.long,
  headset: p.room.id === 'operasyon',
  phase: i * 1.37,
}))

// Baş merkezine göre (dx, dz) ofsetini y ekseninde döndürür
const turn = (cx, cz, dx, dz, yaw) => [cx + dx * Math.cos(yaw) + dz * Math.sin(yaw), cz - dx * Math.sin(yaw) + dz * Math.cos(yaw)]

const UP = new THREE.Vector3(0, 1, 0)
const A = new THREE.Vector3()
const B = new THREE.Vector3()
const Q = new THREE.Quaternion()

// Tüm parçaları sırayla üretir: emit(tür, x, y, z, sx, sy, sz, renk, rx, ry, quaternion)
function forEachPart(t, emit) {
  // İki nokta arası kapsül uzuv (birim kapsül: yarıçap 0.5, toplam boy 1.5)
  const limb = (x0, y0, z0, x1, y1, z1, r, color) => {
    A.set(x0, y0, z0)
    B.set(x1, y1, z1)
    const len = A.distanceTo(B)
    Q.setFromUnitVectors(UP, B.sub(A).normalize())
    emit('cap', (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, r * 2, (len + r * 2) / 1.5, r * 2, color, 0, 0, Q)
  }

  SEATED.forEach((p, i) => {
    const L = LOOKS[i]
    const { x, z } = p
    const ph = L.phase
    const gaze = Math.max(0, Math.sin(t * 0.32 + ph)) ** 5 // ara sıra başını çevirir
    const yaw = Math.sin(t * 0.9 + ph) * 0.6 * gaze
    const hy = 1.33 + Math.sin(t * 1.9 + ph) * 0.012
    const hz = z - 0.03

    // bacaklar (uyluk + baldır) ve ayakkabılar
    for (const s of [-1, 1]) {
      emit('cap', x + s * 0.1, 0.56, z - 0.18, 0.15, 0.36, 0.15, PANTS, Math.PI / 2)
      emit('cap', x + s * 0.1, 0.3, z - 0.4, 0.13, 0.4, 0.13, PANTS)
      emit('box', x + s * 0.1, 0.05, z - 0.46, 0.11, 0.08, 0.22, SHOES)
    }
    const breath = 1 + Math.sin(t * 1.5 + ph) * 0.02
    emit('cap', x, 0.86, z, 0.4, 0.45 * breath, 0.27, L.shirt, -0.12)
    for (const s of [-1, 1]) emit('ball', x + s * 0.19, 1.06, z - 0.01, 0.17, 0.15, 0.17, L.shirt) // omuzlar
    emit('box', x, 1.12, z - 0.05, 0.2, 0.05, 0.14, L.collar) // yaka
    emit('cap', x, 1.17, z - 0.02, 0.1, 0.13, 0.1, L.skin) // boyun

    for (const s of [-1, 1]) {
      const tap = Math.max(0, Math.sin(t * 15 + ph + s * 1.7)) * 0.018 * (1 - gaze)
      limb(x + s * 0.21, 1.07, z - 0.02, x + s * 0.24, 0.87, z - 0.15, 0.056, L.shirt)
      limb(x + s * 0.24, 0.87, z - 0.15, x + s * 0.13, 0.8 + tap, z - 0.45, 0.05, L.shirt)
      emit('ball', x + s * 0.13, 0.8 + tap, z - 0.48, 0.09, 0.07, 0.11, L.skin)
    }

    emit('ball', x, hy, hz, 0.29, 0.34, 0.3, L.skin, 0, yaw)
    for (const s of [-1, 1]) {
      const [ex, ez] = turn(x, hz, s * 0.145, 0.01, yaw)
      emit('ball', ex, hy - 0.01, ez, 0.05, 0.08, 0.06, L.skin, 0, yaw) // kulaklar
    }
    const [sx, sz] = turn(x, hz, 0, 0.018, yaw)
    emit('ball', sx, hy + 0.04, sz, 0.322, 0.29, 0.322, L.hair, 0, yaw)
    if (L.long) {
      const [lx, lz] = turn(x, hz, 0, 0.11, yaw)
      emit('box', lx, hy - 0.17, lz, 0.28, 0.34, 0.09, L.hair, 0, yaw)
    }
    if (L.headset) {
      emit('box', x, hy + 0.165, hz, 0.33, 0.03, 0.05, HEADSET, 0, yaw)
      for (const s of [-1, 1]) {
        const [ex, ez] = turn(x, hz, s * 0.155, 0, yaw)
        emit('ball', ex, hy, ez, 0.08, 0.12, 0.12, HEADSET)
      }
      const [mx, mz] = turn(x, hz, -0.12, -0.12, yaw)
      emit('box', mx, hy - 0.08, mz, 0.025, 0.025, 0.16, '#60a5fa', 0, yaw + 0.5)
    }
  })
}

export default function People() {
  const box = useRef()
  const cap = useRef()
  const ball = useRef()
  const meshes = { box, cap, ball }
  const counts = useMemo(() => {
    const c = { box: 0, cap: 0, ball: 0 }
    forEachPart(0, (kind) => c[kind]++)
    return c
  }, [])
  const geo = useMemo(
    () => ({ box: new THREE.BoxGeometry(), cap: new THREE.CapsuleGeometry(0.5, 0.5, 8, 18), ball: new THREE.SphereGeometry(0.5, 28, 20) }),
    [],
  )
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.02 }), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])

  const write = (t, withColor) => {
    const cursor = { box: 0, cap: 0, ball: 0 }
    forEachPart(t, (kind, x, y, z, sx, sy, sz, c, rx = 0, ry = 0, q = null) => {
      const mesh = meshes[kind].current
      const i = cursor[kind]++
      dummy.position.set(x, y, z)
      if (q) dummy.quaternion.copy(q)
      else dummy.rotation.set(rx, ry, 0)
      dummy.scale.set(sx, sy, sz)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      if (withColor) mesh.setColorAt(i, color.set(c))
    })
    for (const k of KINDS) {
      meshes[k].current.instanceMatrix.needsUpdate = true
      if (withColor) meshes[k].current.instanceColor.needsUpdate = true
    }
  }

  useLayoutEffect(() => write(0, true), []) // eslint-disable-line react-hooks/exhaustive-deps
  useFrame(({ clock }) => write(clock.elapsedTime, false))

  return KINDS.map((k) => <instancedMesh key={k} ref={meshes[k]} args={[geo[k], material, counts[k]]} frustumCulled={false} castShadow receiveShadow />)
}
