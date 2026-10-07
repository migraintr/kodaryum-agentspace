/**
 * KKM — BAŞKAN KOMUTA KANALLARI
 *
 * Başkan çekirdeğinden 18 kurulun uplink fenerine uzanan ince amber ışınlar.
 *
 *   - Ortam nabzı: Başkan sürekli orkestrasyon yapar; rastgele bir kanaldan
 *     düzenli aralıklarla küçük bir sinyal paketi kurula koşar.
 *   - Direktif patlaması: Başkan bir emri kurula devrettiğinde (store'da yeni
 *     DIRECTIVE olayı) o kanal parlar ve art arda büyük paketler fırlar.
 *     (Komuta Merkezi sohbeti Adım 4'te bu akışı tetikleyecek.)
 *   - Seçili kurulun kanalı vurgulanır; Başkan odaktayken tüm kanallar parlar.
 */

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { QuadraticBezierLine } from '@react-three/drei'
import { useShallow } from 'zustand/react/shallow'
import * as THREE from 'three'
import { ACTIVITY_TYPE } from '../../../data/constants.js'
import { useKKMStore } from '../../../store/useKKMStore.js'
import { hdr } from '../kit/color.js'
import { HIDDEN_SCALE } from '../kit/instancing.js'
import { Sphere } from '../kit/OfficeKit.jsx'
import { buildCommandArc } from './flowGeometry.js'

const AMBER = '#fbbf24'
const POOL_SIZE = 24 // aynı anda uçabilecek en fazla paket
const AMBIENT_INTERVAL = 0.85 // sn — ortam nabzı sıklığı
const BURST_COUNT = 4 // bir direktifte art arda fırlayan paket sayısı
const BURST_SPACING = 0.18 // sn

const LINE_COLOR = hdr(AMBER, 1.6)
const PACKET_COLOR = new THREE.Color(AMBER)

export function CommandChannels() {
  const boardIds = useKKMStore(useShallow((s) => s.boards.map((b) => b.id)))
  const selectedBoardId = useKKMStore((s) => s.selectedBoardId)
  const presidentFocused = useKKMStore((s) => s.isPresidentFocused)

  const arcs = useMemo(() => boardIds.map((id) => buildCommandArc(id)), [boardIds])
  const indexOf = useMemo(() => new Map(boardIds.map((id, i) => [id, i])), [boardIds])

  const lineRefs = useRef([])
  const packetRefs = useRef([])
  const flashes = useRef([]) // kanal başına parlama (0-1, zamanla söner)
  const pool = useRef(Array.from({ length: POOL_SIZE }, () => ({ active: false, channel: 0, u: 0, speed: 0.6, size: 0.08, power: 3 })))
  const queue = useRef([]) // gecikmeli fırlatılacak paketler
  const ambientTimer = useRef(0)
  const point = useMemo(() => new THREE.Vector3(), [])

  const launch = (channel, { size = 0.08, power = 3, speed = 0.55 } = {}) => {
    const slot = pool.current.find((p) => !p.active)
    if (!slot) return
    Object.assign(slot, { active: true, channel, u: 0, size, power, speed })
  }

  // Store'a yeni düşen DIRECTIVE olaylarını dinle → ilgili kanalda patlama
  useEffect(
    () =>
      useKKMStore.subscribe(
        (s) => s.activityFeed,
        (feed, previous) => {
          const known = new Set(previous.map((e) => e.id))
          for (const event of feed) {
            if (known.has(event.id)) break // akış yeniden eskiye sıralı
            if (event.type !== ACTIVITY_TYPE.DIRECTIVE) continue
            const channel = indexOf.get(event.boardId)
            if (channel === undefined) continue
            flashes.current[channel] = 1
            for (let k = 0; k < BURST_COUNT; k++) {
              queue.current.push({ channel, delay: k * BURST_SPACING })
            }
          }
        },
      ),
    [indexOf],
  )

  useFrame((_, delta) => {
    const count = arcs.length
    if (!count) return

    // 1) Ortam nabzı
    ambientTimer.current += delta
    if (ambientTimer.current > AMBIENT_INTERVAL) {
      ambientTimer.current = 0
      launch(Math.floor(Math.random() * count), { size: 0.06, power: 2.4, speed: 0.45 })
    }

    // 2) Bekleyen direktif paketleri
    queue.current = queue.current.filter((item) => {
      item.delay -= delta
      if (item.delay > 0) return true
      launch(item.channel, { size: 0.13, power: 5, speed: 0.7 })
      return false
    })

    // 3) Paketleri ilerlet
    pool.current.forEach((p, i) => {
      const mesh = packetRefs.current[i]
      if (!mesh) return
      if (!p.active) {
        mesh.scale.setScalar(HIDDEN_SCALE)
        return
      }
      p.u += delta * p.speed
      if (p.u >= 1) {
        p.active = false
        mesh.scale.setScalar(HIDDEN_SCALE)
        return
      }
      arcs[p.channel].curve.getPoint(p.u, point)
      mesh.position.copy(point)
      mesh.scale.setScalar(p.size * (0.6 + Math.sin(Math.PI * p.u) * 0.6))
      mesh.color.copy(PACKET_COLOR).multiplyScalar(p.power)
    })

    // 4) Kanal parlamaları + kesik akışı
    lineRefs.current.forEach((line, i) => {
      if (!line) return
      const flash = (flashes.current[i] ?? 0) * Math.exp(-delta * 1.2)
      flashes.current[i] = flash
      const material = line.material
      material.dashOffset -= delta * (0.8 + flash * 4)
      material.opacity = Math.min(1, line.userData.baseOpacity + flash * 0.9)
    })
  })

  return (
    <>
      {arcs.map((arc, i) => {
        if (!arc) return null
        const id = boardIds[i]
        const focus = presidentFocused || id === selectedBoardId
        const dim = selectedBoardId && id !== selectedBoardId
        const baseOpacity = focus ? 0.85 : dim ? 0.04 : 0.16
        return (
          <QuadraticBezierLine
            key={id}
            ref={(el) => {
              lineRefs.current[i] = el
              if (el) el.userData.baseOpacity = baseOpacity
            }}
            start={arc.start}
            end={arc.end}
            mid={arc.mid}
            segments={40}
            color={LINE_COLOR}
            lineWidth={focus ? 2 : 1.1}
            dashed
            dashSize={0.25}
            gapSize={0.35}
            transparent
            opacity={baseOpacity}
            depthWrite={false}
            toneMapped={false}
          />
        )
      })}
      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <Sphere key={i} kind="glow" ref={(el) => (packetRefs.current[i] = el)} radius={HIDDEN_SCALE} />
      ))}
    </>
  )
}
