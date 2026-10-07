/**
 * KKM — ODA SEÇİM ÇERÇEVESİ
 *
 * Üzerine gelinen veya seçilen odanın 8 köşesinde beliren holografik
 * "hedefleme köşebentleri" + zeminde ışıklı çevre çizgisi.
 *   hovered  → sabit, orta parlaklık
 *   selected → nabız atan, yüksek parlaklık
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { hdr } from '../kit/color.js'
import { Box } from '../kit/OfficeKit.jsx'

const ARM = 0.85 // köşebent kolu uzunluğu
const BAR = 0.045 // kalınlık
const MARGIN = 0.18 // duvarlardan uzaklık
const TOP = 2.95

function buildBrackets(width, depth) {
  const hx = width / 2 + MARGIN
  const hz = depth / 2 + MARGIN
  const bars = []
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      for (const [y, sy] of [[0.04, -1], [TOP, 1]]) {
        bars.push({ size: [ARM, BAR, BAR], position: [sx * (hx - ARM / 2), y, sz * hz] })
        bars.push({ size: [BAR, BAR, ARM], position: [sx * hx, y, sz * (hz - ARM / 2)] })
        bars.push({ size: [BAR, ARM, BAR], position: [sx * hx, y - sy * (ARM / 2), sz * hz] })
      }
    }
  }
  // Zemin çevre çizgisi (köşebentler arası ince hat)
  const thin = 0.018
  bars.push({ size: [width + MARGIN * 2, thin, thin], position: [0, 0.02, -hz], perimeter: true })
  bars.push({ size: [width + MARGIN * 2, thin, thin], position: [0, 0.02, hz], perimeter: true })
  bars.push({ size: [thin, thin, depth + MARGIN * 2], position: [-hx, 0.02, 0], perimeter: true })
  bars.push({ size: [thin, thin, depth + MARGIN * 2], position: [hx, 0.02, 0], perimeter: true })
  return bars
}

export function RoomSelectionFrame({ width, depth, color, mode }) {
  const bars = useMemo(() => buildBrackets(width, depth), [width, depth])
  const base = useMemo(() => hdr(color), [color])
  const refs = useRef([])
  const modeRef = useRef(mode)
  modeRef.current = mode

  useFrame(({ clock }) => {
    const selected = modeRef.current === 'selected'
    const pulse = selected ? 3.2 + Math.sin(clock.elapsedTime * 3.5) * 0.9 : 2.2
    refs.current.forEach((bar, i) => {
      if (!bar) return
      bar.color.copy(base).multiplyScalar(bars[i].perimeter ? pulse * 0.7 : pulse)
    })
  })

  return bars.map((bar, i) => (
    <Box key={i} kind="glow" ref={(el) => (refs.current[i] = el)} size={bar.size} position={bar.position} />
  ))
}
