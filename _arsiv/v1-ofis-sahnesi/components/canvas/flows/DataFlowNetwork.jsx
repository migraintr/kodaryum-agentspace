/**
 * KKM — KURULLAR ARASI VERİ AKIŞLARI (parlayan lazer yayları)
 *
 * Her akış (store.dataFlows) iki katmanla çizilir:
 *   1) Kesikli ışık hattı — kesikler akış yönünde kayar (dashOffset animasyonu)
 *   2) Veri paketleri — yay boyunca ilerleyen parlak küreler
 *
 * Renk akış tipinden gelir (Direktif · Veri · Rapor · Alarm), hız ve
 * parlaklık akış yoğunluğundan (throughput). Bir kurul seçiliyken yalnızca o
 * kurulun bağlı olduğu akışlar parlar, diğerleri soluklaşır.
 */

import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { QuadraticBezierLine } from '@react-three/drei'
import * as THREE from 'three'
import { FLOW_TYPE_META } from '../../../data/constants.js'
import { useKKMStore } from '../../../store/useKKMStore.js'
import { hdr } from '../kit/color.js'
import { HIDDEN_SCALE } from '../kit/instancing.js'
import { Sphere } from '../kit/OfficeKit.jsx'
import { buildFlowArc } from './flowGeometry.js'

const PACKETS_PER_FLOW = 3

/** Vurgu seviyesine göre görünüm */
const EMPHASIS = {
  focus: { opacity: 0.95, width: 2.4, packet: 0.11, glow: 4.2 },
  normal: { opacity: 0.32, width: 1.3, packet: 0.075, glow: 3.0 },
  dim: { opacity: 0.05, width: 1, packet: 0, glow: 0 },
}

function FlowBeamBase({ flow, arc, emphasis }) {
  const meta = FLOW_TYPE_META[flow.type]
  const style = EMPHASIS[emphasis]
  const lineColor = useMemo(() => hdr(meta.color, 1.7), [meta.color])
  const packetColor = useMemo(() => hdr(meta.color, style.glow), [meta.color, style.glow])

  const lineRef = useRef(null)
  const packetRefs = useRef([])
  const throughputRef = useRef(flow.throughput)
  throughputRef.current = flow.throughput
  const point = useMemo(() => new THREE.Vector3(), [])

  // Yay uzunluğundan bağımsız sabit görsel hız (m/sn)
  const speed = meta.speed * 2.4

  useFrame(({ clock }, delta) => {
    const material = lineRef.current?.material
    if (material) material.dashOffset -= delta * speed * (0.5 + throughputRef.current)

    const t = clock.elapsedTime
    const progressPerSecond = (speed * (0.4 + throughputRef.current)) / arc.length
    packetRefs.current.forEach((packet, i) => {
      if (!packet) return
      const u = (t * progressPerSecond + i / PACKETS_PER_FLOW) % 1
      arc.curve.getPoint(u, point)
      packet.position.copy(point)
      // Uçlarda küçülerek kaybolur, ortada tam boy
      const size = style.packet * Math.sin(Math.PI * u) * (0.7 + throughputRef.current * 0.6)
      packet.scale.setScalar(Math.max(HIDDEN_SCALE, size))
    })
  })

  return (
    <>
      <QuadraticBezierLine
        ref={lineRef}
        start={arc.start}
        end={arc.end}
        mid={arc.mid}
        segments={48}
        color={lineColor}
        lineWidth={style.width}
        dashed
        dashSize={0.55}
        gapSize={0.4}
        transparent
        opacity={style.opacity * (0.6 + flow.throughput * 0.4)}
        depthWrite={false}
        toneMapped={false}
      />
      {Array.from({ length: PACKETS_PER_FLOW }, (_, i) => (
        <Sphere key={i} kind="glow" ref={(el) => (packetRefs.current[i] = el)} radius={HIDDEN_SCALE} color={packetColor} />
      ))}
    </>
  )
}

const FlowBeam = memo(FlowBeamBase)

export function DataFlowNetwork() {
  const flows = useKKMStore((s) => s.dataFlows)
  const selectedBoardId = useKKMStore((s) => s.selectedBoardId)
  const presidentFocused = useKKMStore((s) => s.isPresidentFocused)

  // Yay geometrisi akışın uçlarına bağlıdır; yoğunluk değişimleri yeniden hesaplatmaz
  const routeKey = flows.map((f) => `${f.id}:${f.from}>${f.to}`).join('|')
  const arcs = useMemo(() => {
    const map = {}
    for (const part of routeKey.split('|')) {
      if (!part) continue
      const [id, route] = part.split(':')
      const [from, to] = route.split('>')
      map[id] = buildFlowArc(from, to)
    }
    return map
  }, [routeKey])

  return flows.map((flow) => {
    const arc = arcs[flow.id]
    if (!arc || !flow.active) return null
    const connected = flow.from === selectedBoardId || flow.to === selectedBoardId
    const emphasis = presidentFocused ? 'dim' : selectedBoardId ? (connected ? 'focus' : 'dim') : 'normal'
    return <FlowBeam key={flow.id} flow={flow} arc={arc} emphasis={emphasis} />
  })
}
