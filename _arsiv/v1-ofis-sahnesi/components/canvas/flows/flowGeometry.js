/**
 * KKM — AKIŞ GEOMETRİSİ
 *
 * Veri akışları, odaların "uplink" fenerleri arasında yükselen ikinci derece
 * Bézier yaylarıdır. Aynı iki oda arasında iki yönlü akış varsa (A→B ve B→A)
 * yaylar yana kaydırılır; böylece üst üste binmezler.
 */

import * as THREE from 'three'
import { PRESIDENT_CORE, getRoomUplink } from '../layout/floorPlan.js'

const UP = new THREE.Vector3(0, 1, 0)

/**
 * @param {number[]} from  Başlangıç [x, y, z]
 * @param {number[]} to    Bitiş [x, y, z]
 * @param {{ lift: (distance: number) => number, sideOffset?: number }} options
 * @returns {{ start: THREE.Vector3, mid: THREE.Vector3, end: THREE.Vector3, curve: THREE.QuadraticBezierCurve3, length: number }}
 */
export function buildArc(from, to, { lift, sideOffset = 0 }) {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const distance = start.distanceTo(end)
  const mid = start.clone().add(end).multiplyScalar(0.5)
  mid.y += lift(distance)

  if (sideOffset) {
    const side = new THREE.Vector3().subVectors(end, start).setY(0).normalize().cross(UP)
    mid.addScaledVector(side, sideOffset)
  }

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
  return { start, mid, end, curve, length: curve.getLength() }
}

/** Kurul → kurul veri akışı yayı (uplink'ten uplink'e) */
export function buildFlowArc(fromBoardId, toBoardId) {
  const from = getRoomUplink(fromBoardId)
  const to = getRoomUplink(toBoardId)
  if (!from || !to) return null
  return buildArc(from, to, { lift: (d) => 1.6 + d * 0.17, sideOffset: 0.9 })
}

/** Başkan çekirdeği → kurul komuta kanalı yayı */
export function buildCommandArc(boardId) {
  const to = getRoomUplink(boardId)
  if (!to) return null
  return buildArc(PRESIDENT_CORE.position, to, { lift: (d) => 0.8 + d * 0.07 })
}
