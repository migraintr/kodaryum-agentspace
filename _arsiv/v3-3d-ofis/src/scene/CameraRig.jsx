// Kamera: ofisi, cam panellerin arasında kalan boş "sahne" alanına sığdırır ve ortalar
// (setViewOffset), seçilen oda/kurula süzülerek yaklaşır, kullanıcı sürükleyince uçuşu bırakır.
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store.js'
import { FLOOR_D, FLOOR_W, ROOMS, ROOM_BY_ID } from './layout.js'

export const FOV = 24
const PITCH = THREE.MathUtils.degToRad(56) // yataydan yükseklik açısı
const DIR = new THREE.Vector3(0, Math.sin(PITCH), Math.cos(PITCH))
const HOME = { cx: 0, cz: 0.3, w: FLOOR_W + 1.8, d: FLOOR_D + 2.4, h: 3.4 }

function bounds(rooms) {
  const x0 = Math.min(...rooms.map((r) => r.x0))
  const x1 = Math.max(...rooms.map((r) => r.x1))
  const z0 = Math.min(...rooms.map((r) => r.z0))
  const z1 = Math.max(...rooms.map((r) => r.z1))
  return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0 + 1.6, d: z1 - z0 + 1.6, h: 2.6 }
}

// Seçime göre hedef kutu → kutuyu sahne alanına sığdıran kamera konumu
function plan(stage) {
  const { roomId, selectedId } = useStore.getState()
  const rooms = roomId ? [ROOM_BY_ID.get(roomId)] : selectedId ? ROOMS.filter((r) => r.board === selectedId) : null
  const b = rooms?.length ? bounds(rooms) : HOME
  const projectedH = b.d * Math.sin(PITCH) + b.h * Math.cos(PITCH)
  const ppu = Math.min((stage.w * 0.9) / b.w, (stage.h * 0.88) / projectedH) // piksel / dünya birimi
  const dist = stage.ch / ppu / (2 * Math.tan(THREE.MathUtils.degToRad(FOV) / 2))
  const target = new THREE.Vector3(b.cx, 0.6, b.cz)
  return { target, position: target.clone().addScaledVector(DIR, dist) }
}

export function CameraRig({ stageRef }) {
  const controls = useRef()
  const camera = useThree((s) => s.camera)
  const canvas = useThree((s) => s.gl.domElement)
  const roomId = useStore((s) => s.roomId)
  const selectedId = useStore((s) => s.selectedId)
  const stage = useRef(null)
  const flight = useRef(null)

  const fly = () => {
    if (stage.current) flight.current = plan(stage.current)
  }

  // Sahne alanını ölç: değiştikçe görüntüyü o alana ortala ve yeniden sığdır
  useEffect(() => {
    const measure = () => {
      const c = canvas.getBoundingClientRect()
      if (!c.width || !c.height) return
      const s = stageRef?.current?.getBoundingClientRect()
      const visible = s && s.width > 40 && s.height > 40
      const first = !stage.current
      stage.current = visible
        ? { x: s.left - c.left, y: s.top - c.top, w: s.width, h: s.height, cw: c.width, ch: c.height }
        : { x: 0, y: 0, w: c.width, h: c.height, cw: c.width, ch: c.height }
      const st = stage.current
      camera.setViewOffset(st.cw, st.ch, -(st.x + st.w / 2 - st.cw / 2), -(st.y + st.h / 2 - st.ch / 2), st.cw, st.ch)
      const next = plan(st)
      if (first) {
        // açılış: uzaktan süzülerek gel
        camera.position.copy(next.target).addScaledVector(DIR, next.position.distanceTo(next.target) * 1.9).add(new THREE.Vector3(-14, 0, 0))
        controls.current?.target.copy(next.target)
      }
      flight.current = next
    }
    const observer = new ResizeObserver(measure)
    observer.observe(canvas)
    if (stageRef?.current) observer.observe(stageRef.current)
    measure()
    return () => observer.disconnect()
  }, [camera, canvas, stageRef])

  useEffect(fly, [roomId, selectedId])

  useFrame((_, dt) => {
    const c = controls.current
    if (!c) return
    const f = flight.current
    if (f) {
      const k = 1 - Math.exp(-dt * 2.6)
      camera.position.lerp(f.position, k)
      c.target.lerp(f.target, k)
      if (camera.position.distanceToSquared(f.position) < 0.0004 && c.target.distanceToSquared(f.target) < 0.0004) flight.current = null
    }
    c.update()
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={5}
      maxDistance={180}
      minPolarAngle={0.2}
      maxPolarAngle={1.2}
      minAzimuthAngle={-0.9}
      maxAzimuthAngle={0.9}
      zoomSpeed={0.8}
      onStart={() => {
        flight.current = null
      }}
    />
  )
}
