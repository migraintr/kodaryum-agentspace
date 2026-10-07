// Kurul düğümü: altıgen seramik kaide + kurula özel yapı + isim etiketi + tıklama alanı.
// Sabit bilgiler (ad, renk, form) data.js'ten gelir; store'dan yalnızca sağlık ve seçim
// durumu okunur → simülasyon tikleri bu bileşeni sağlık değişmedikçe yeniden çizmez.
import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, useCursor } from '@react-three/drei'
import * as THREE from 'three'
import { HEALTH, useStore } from '../store.js'
import { boardPosition, glowTexture, labelTexture } from './helpers.js'
import { STRUCTURES } from './structures.jsx'

function Board({ board }) {
  const health = useStore((s) => s.boards.find((b) => b.id === board.id).health)
  const selected = useStore((s) => s.selectedId === board.id)
  const hovered = useStore((s) => s.hoveredId === board.id)
  const dimmed = useStore((s) => s.selectedId !== null && s.selectedId !== board.id)
  const select = useStore((s) => s.select)
  const hover = useStore((s) => s.hover)
  useCursor(hovered)

  const position = useMemo(() => boardPosition(board.angle), [board.angle])
  const label = useMemo(
    () => labelTexture(board.id, board.short, `${board.chair.name} · ${board.agents.length + 1} AJAN`, board.color),
    [board],
  )
  const Structure = STRUCTURES[board.shape]

  const body = useRef()
  const targetScale = selected ? 1.12 : hovered ? 1.06 : 1
  useFrame((_, dt) => body.current.scale.setScalar(THREE.MathUtils.damp(body.current.scale.x, targetScale, 8, dt)))

  return (
    <group position={position}>
      {/* Kaide */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[2.55, 2.85, 0.6, 6]} />
        <meshPhysicalMaterial color="#f4f6fa" roughness={0.32} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, 0.605, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[2.22, 2.4, 6, 1, Math.PI / 6]} />
        <meshBasicMaterial color={board.color} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[3.05, 3.14, 72]} />
        <meshBasicMaterial color={HEALTH[health].color} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial map={glowTexture()} color={board.color} transparent opacity={selected ? 0.5 : 0.28} depthWrite={false} />
      </mesh>

      <group ref={body} position={[0, 0.6, 0]}>
        <Structure color={board.color} />
      </group>

      <Billboard position={[0, 6.3, 0]}>
        <mesh>
          <planeGeometry args={[4.4, 1.24]} />
          <meshBasicMaterial map={label} transparent depthWrite={false} opacity={dimmed ? 0.3 : 1} toneMapped={false} />
        </mesh>
      </Billboard>

      {/* Görünmez tıklama alanı (yapının tüm parçalarına tek tek ışın atmamak için) */}
      <mesh
        position={[0, 3.2, 0]}
        visible={false}
        onPointerOver={(e) => (e.stopPropagation(), hover(board.id))}
        onPointerOut={() => useStore.getState().hoveredId === board.id && hover(null)}
        onClick={(e) => {
          e.stopPropagation()
          if (e.delta <= 4) select(board.id)
        }}
      >
        <cylinderGeometry args={[3, 3, 6.4, 12]} />
      </mesh>
    </group>
  )
}

export default memo(Board)
