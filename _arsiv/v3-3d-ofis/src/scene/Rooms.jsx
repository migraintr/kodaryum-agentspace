// Oda etkileşimi: zemindeki görünmez tıklama alanı + oda renginde ışık havuzu ve neon seçim çerçevesi.
// Durum her karede store'dan okunur (React yeniden çizimi yok); geçişler yumuşak.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store.js'
import { ROOMS } from './layout.js'
import { glowTexture } from './textures.js'
import { glowBlending, useDark } from './theme.js'

function frameGeometry(w, d, t) {
  const shape = new THREE.Shape()
  shape.moveTo(-w / 2, -d / 2)
  shape.lineTo(w / 2, -d / 2)
  shape.lineTo(w / 2, d / 2)
  shape.lineTo(-w / 2, d / 2)
  const hole = new THREE.Path()
  hole.moveTo(-w / 2 + t, -d / 2 + t)
  hole.lineTo(-w / 2 + t, d / 2 - t)
  hole.lineTo(w / 2 - t, d / 2 - t)
  hole.lineTo(w / 2 - t, -d / 2 + t)
  shape.holes.push(hole)
  return new THREE.ShapeGeometry(shape)
}

function Room({ room, dark }) {
  const glowProps = { transparent: true, blending: glowBlending(dark), depthWrite: false, toneMapped: false }
  const frame = useRef()
  const glow = useRef()
  const geometry = useMemo(() => frameGeometry(room.w - 0.3, room.d - 0.3, 0.07), [room])

  useFrame(({ clock }, dt) => {
    const s = useStore.getState()
    const selected = s.roomId ? s.roomId === room.id : !!s.selectedId && room.board === s.selectedId
    const hovered = s.hoveredRoom === room.id
    const focus = s.roomId || s.selectedId
    const k = 1 - Math.exp(-dt * 8)
    const pulse = 0.8 + Math.sin(clock.elapsedTime * 3) * 0.2
    const f = frame.current.material
    const g = glow.current.material
    f.opacity += ((selected ? pulse : hovered ? 0.55 : 0) - f.opacity) * k
    const level = selected ? 0.55 : hovered ? 0.4 : focus ? 0.08 : 0.2
    g.opacity += ((dark ? level : level * 0.6) - g.opacity) * k
    frame.current.visible = f.opacity > 0.01
  })

  const { focusRoom, hoverRoom } = useStore.getState()
  return (
    <group position={[room.cx, 0, room.cz]}>
      <mesh ref={glow} position-y={0.05} rotation-x={-Math.PI / 2} scale={[room.w * 1.05, room.d * 1.15, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={glowTexture()} color={room.color} opacity={0.2} {...glowProps} />
      </mesh>
      <mesh ref={frame} geometry={geometry} position-y={0.06} rotation-x={-Math.PI / 2}>
        <meshBasicMaterial color={room.color} opacity={0} {...glowProps} />
      </mesh>
      <mesh
        position-y={0.07}
        rotation-x={-Math.PI / 2}
        onPointerOver={(e) => {
          e.stopPropagation()
          hoverRoom(room.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          if (useStore.getState().hoveredRoom === room.id) hoverRoom(null)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (e.delta <= 4) focusRoom(room.id)
        }}
      >
        <planeGeometry args={[room.w, room.d]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  )
}

export default function Rooms() {
  const dark = useDark()
  return ROOMS.map((r) => <Room key={r.id} room={r} dark={dark} />)
}
