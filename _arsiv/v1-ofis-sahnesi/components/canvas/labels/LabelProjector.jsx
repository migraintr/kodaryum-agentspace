/**
 * KKM — ETİKET PROJEKTÖRÜ (Canvas içinde, görünmez)
 *
 * Her karede kayıtlı etiketlerin dünya konumlarını kameraya göre ekrana
 * izdüşürür ve DOM düğümlerini taşır. Kameranın arkasında kalan veya ekranın
 * çok dışına düşen etiketler gizlenir; yakın olan etiket üstte görünür.
 *
 * Canvas içinde CameraRig'den SONRA monte edilmelidir → kamera o karede
 * hareket ettikten sonra izdüşüm yapılır (etiketler titremez).
 */

import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getLabelEntries } from './labelRegistry.js'

const MARGIN = 0.25 // NDC cinsinden ekran dışı tolerans

export function LabelProjector() {
  const ndc = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera, size }) => {
    for (const { position, element } of getLabelEntries().values()) {
      ndc.copy(position).project(camera)
      const visible =
        ndc.z < 1 && Math.abs(ndc.x) < 1 + MARGIN && Math.abs(ndc.y) < 1 + MARGIN

      if (!visible) {
        if (element.style.visibility !== 'hidden') element.style.visibility = 'hidden'
        continue
      }

      const x = (ndc.x * 0.5 + 0.5) * size.width
      const y = (-ndc.y * 0.5 + 0.5) * size.height
      element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      element.style.zIndex = String(Math.round((1 - ndc.z) * 100000))
      if (element.style.visibility !== 'visible') element.style.visibility = 'visible'
    }
  })

  return null
}
