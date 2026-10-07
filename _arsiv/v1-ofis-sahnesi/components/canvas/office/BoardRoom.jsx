/**
 * KKM — KURUL ODASI
 *
 * Her kurul, kat planında kendi hücresine yerleşen cam bölmeli bir ofistir:
 *   - Arka duvarda kurulun dijital tabelası (kod + ad, kurul renginde)
 *   - Kurul Başkanı: arka duvar önünde, ekibine bakan yönetici masası
 *   - Uzman agent'lar: ekranları kameraya dönük çalışma masaları
 *   - Kurul renginde LED şeritler ve zemin halısı (uzaktan tanınabilirlik)
 *   - Sağ duvarda canlı veri ekranı, sol duvarda kitaplık, köşelerde bitkiler
 *
 * Kurul sağlığı KRİTİK olduğunda LED'ler kırmızı nabızla yanıp söner.
 *
 * ETKİLEŞİM (Adım 3)
 *   - Zemin hizasındaki görünmez "isabet düzlemi" üzerinden hover / tıklama
 *     (binlerce instance parçasına ışın atmak yerine tek düzlem → hızlı)
 *   - Hover: köşebent çerçevesi + LED'ler parlar, imleç el olur
 *   - Tık: kurul store'a seçilir → kamera odaya uçar, agent etiketleri açılır
 *   - Başka oda seçiliyken bu oda kısılır (LED + etiket)
 *   - Seçili odada her agent tıklanabilir (avatarın etrafında görünmez küre)
 */

import { memo, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import { BOARD_HEALTH } from '../../../data/constants.js'
import { useKKMStore } from '../../../store/useKKMStore.js'
import { selectBoardInteraction } from '../../../store/selectors.js'
import { hdr, mixColor } from '../kit/color.js'
import { Box, Cylinder, Sphere } from '../kit/OfficeKit.jsx'
import { getCarpetTexture, getSignTexture } from '../kit/textures.js'
import {
  CHAIR_SLOT,
  ROOM,
  ROOM_FLOOR_THICKNESS,
  UPLINK_HEIGHT,
  getAgentAnchors,
  getBoardRoomRect,
  getMemberSlots,
} from '../layout/floorPlan.js'
import { Bookshelf, GlassWall, Plant, SignBoard, WallDisplay } from './furniture.jsx'
import { RoomSelectionFrame } from './RoomSelectionFrame.jsx'
import { Workstation } from './Workstation.jsx'

const ALARM = hdr('#f43f5e', 3.6)
const FLOOR_THICKNESS = ROOM_FLOOR_THICKNESS
const CLICK_TOLERANCE_PX = 4 // bundan fazla sürükleme tıklama sayılmaz (kamera döndürme)

/** Etkileşim durumuna göre LED parlaklık çarpanı */
const GLOW_FACTOR = { selected: 1.7, hovered: 1.4, idle: 1, dimmed: 0.3 }

// ─────────────────────────────────────────────────────────────────────────────
//  Seçili odada agent'a tıklama hedefi (avatarın çevresinde görünmez küre)
// ─────────────────────────────────────────────────────────────────────────────
function AgentFocus({ agent, position }) {
  const selectAgent = useKKMStore((s) => s.selectAgent)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh
        position={[0, 1.15, 0]}
        visible={false}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          if (e.delta <= CLICK_TOLERANCE_PX) selectAgent(agent.id)
        }}
      >
        <sphereGeometry args={[0.6, 12, 8]} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Kurul odası
// ─────────────────────────────────────────────────────────────────────────────
function BoardRoomBase({ board }) {
  const rect = useMemo(() => getBoardRoomRect(board.id), [board.id])
  const accent = board.color

  // Etkileşim durumu (ilkel değerler → yalnızca değiştiğinde render)
  const interaction = useKKMStore(selectBoardInteraction(board.id))
  const dimmed = useKKMStore(
    (s) => s.isPresidentFocused || (s.selectedBoardId !== null && s.selectedBoardId !== board.id),
  )
  const selectBoard = useKKMStore((s) => s.selectBoard)
  const hoverBoard = useKKMStore((s) => s.hoverBoard)
  useCursor(interaction === 'hovered')

  const glowTarget = interaction === 'idle' ? (dimmed ? GLOW_FACTOR.dimmed : GLOW_FACTOR.idle) : GLOW_FACTOR[interaction]
  const glowTargetRef = useRef(glowTarget)
  glowTargetRef.current = glowTarget
  const glow = useRef(1)

  const ledColor = useMemo(() => hdr(accent, 2.6), [accent])
  const rugColor = useMemo(() => mixColor('#141923', accent, 0.2), [accent])
  const displayTint = useMemo(() => mixColor('#ffffff', accent, 0.6).multiplyScalar(1.1), [accent])
  const signTexture = useMemo(
    () => getSignTexture(board.id, { eyebrow: `${board.code} · KURUL`, title: board.shortName, accent }),
    [board.id, board.code, board.shortName, accent],
  )

  // LED şeritleri + uplink feneri: sağlık ve etkileşim durumuna göre her karede renklenir
  const ledRefs = useRef([])
  const healthRef = useRef(board.health)
  healthRef.current = board.health
  const ledRef = (index) => (el) => {
    ledRefs.current[index] = el
  }

  useFrame(({ clock }, delta) => {
    glow.current += (glowTargetRef.current - glow.current) * (1 - Math.exp(-delta * 6))
    const critical = healthRef.current === BOARD_HEALTH.CRITICAL
    const k = critical ? 0.5 + 0.5 * Math.sin(clock.elapsedTime * 4.2) : 0
    for (const led of ledRefs.current) {
      if (!led) continue
      led.color.copy(ledColor)
      if (critical) led.color.lerp(ALARM, k)
      led.color.multiplyScalar(glow.current)
    }
  })

  const anchors = useMemo(() => getAgentAnchors(board), [board])

  // ── İşaretçi olayları (isabet düzlemi) ──
  const handlePointerOver = (e) => {
    e.stopPropagation()
    hoverBoard(board.id)
  }
  const handlePointerOut = () => {
    if (useKKMStore.getState().hoveredBoardId === board.id) hoverBoard(null)
  }
  const handleClick = (e) => {
    e.stopPropagation()
    if (e.delta <= CLICK_TOLERANCE_PX) selectBoard(board.id)
  }

  if (!rect) return null
  const { width: W, depth: D } = rect
  const carpet = getCarpetTexture([W / 2, D / 2])
  const memberSlots = getMemberSlots(board.members.length)
  const isSelected = interaction === 'selected'

  // Ön alçak duvar: sağ tarafta kapı boşluğu
  const doorCenter = W / 2 - 1.9
  const doorStart = doorCenter - ROOM.doorWidth / 2
  const doorEnd = doorCenter + ROOM.doorWidth / 2
  const frontLeftLength = doorStart + W / 2
  const frontRightLength = W / 2 - doorEnd

  return (
    <group position={rect.position}>
      {/* ── Zemin: halı karo ── */}
      <mesh position={[0, FLOOR_THICKNESS / 2, 0]} receiveShadow>
        <boxGeometry args={[W, FLOOR_THICKNESS, D]} />
        <meshStandardMaterial map={carpet} roughness={0.95} metalness={0} />
      </mesh>

      <group position={[0, FLOOR_THICKNESS, 0]}>
        {/* Ekip alanı halısı — kurul renginde */}
        <Box kind="fabric" size={[W - 2.4, 0.008, 4.7]} position={[0, 0.004, 0.95]} color={rugColor} />

        {/* ── Cam bölmeler ── */}
        <GlassWall length={W} position={[0, 0, -D / 2]} led={{ ref: ledRef(0), color: ledColor }} />
        <GlassWall length={D} position={[-W / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} led={{ ref: ledRef(1), color: ledColor }} />
        <GlassWall length={D} position={[W / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} led={{ ref: ledRef(2), color: ledColor }} />
        <GlassWall
          length={frontLeftLength}
          height={ROOM.frontWallHeight}
          position={[-W / 2 + frontLeftLength / 2, 0, D / 2]}
          ledTop={{ ref: ledRef(3), color: ledColor }}
        />
        <GlassWall
          length={frontRightLength}
          height={ROOM.frontWallHeight}
          mullionSpacing={frontRightLength}
          position={[W / 2 - frontRightLength / 2, 0, D / 2]}
          ledTop={{ ref: ledRef(4), color: ledColor }}
        />

        {/* ── Kurul tabelası (arka duvar) ── */}
        <SignBoard texture={signTexture} position={[0, 1.98, -D / 2 + 0.09]} />

        {/* ── Kurul Başkanı ── */}
        <Workstation agent={board.chair} accent={accent} executive position={CHAIR_SLOT.position} rotation={CHAIR_SLOT.rotation} />

        {/* ── Uzman agent'lar ── */}
        {board.members.map((member, i) => (
          <Workstation key={member.id} agent={member} accent={accent} position={memberSlots[i]} />
        ))}

        {/* ── Dekor ── */}
        <WallDisplay
          variant="chart"
          tint={displayTint}
          position={[W / 2 - 0.06, 1.45, -0.3]}
          rotation={[0, -Math.PI / 2, 0]}
        />
        <Bookshelf seed={board.order} position={[-W / 2 + 0.2, 0, 0.4]} rotation={[0, Math.PI / 2, 0]} />
        <Plant variant="floor" seed={board.order} position={[-W / 2 + 0.5, 0, -D / 2 + 0.5]} />
        <Plant variant="bush" seed={board.order + 40} position={[W / 2 - 0.55, 0, -D / 2 + 0.55]} />
        <Plant variant="tall" seed={board.order + 80} position={[-W / 2 + 0.45, 0, D / 2 - 0.45]} />

        {/* ── Uplink feneri: veri akışları ve komuta ışınlarının bağlandığı nokta ── */}
        <Cylinder kind="metal" radius={0.014} height={0.3} position={[0, ROOM.wallHeight + 0.15, -D / 2 + 0.1]} />
        <Sphere
          kind="glow"
          ref={ledRef(5)}
          radius={0.075}
          position={[0, UPLINK_HEIGHT - FLOOR_THICKNESS, -D / 2 + 0.1]}
          color={ledColor}
        />

        {/* ── Etkileşim katmanı ── */}
        <mesh
          position={[0, 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <planeGeometry args={[W, D]} />
        </mesh>

        {interaction !== 'idle' && <RoomSelectionFrame width={W} depth={D} color={accent} mode={interaction} />}

        {/* Seçili odada agent'lar tıklanabilir (etiketleri DOM katmanında: labels/LabelLayer) */}
        {isSelected &&
          anchors.map(({ agent, position }) => <AgentFocus key={agent.id} agent={agent} position={position} />)}
      </group>
    </group>
  )
}

/** Yalnızca kendi kurul nesnesi değiştiğinde yeniden render edilir */
export const BoardRoom = memo(BoardRoomBase)
