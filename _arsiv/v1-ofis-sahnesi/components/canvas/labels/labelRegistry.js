/**
 * KKM — 3D ETİKET KAYDI (DOM ↔ 3D köprüsü)
 *
 * Etiketler (kurul rozetleri, agent statüleri, Başkan) normal React DOM
 * ağacında yaşar; 3D sahnenin içinde değil. Her etiket, takip edeceği dünya
 * koordinatını ve kendi DOM düğümünü bu kayda bırakır. Canvas içindeki
 * <LabelProjector> her karede kayıttaki noktaları ekrana izdüşürür ve
 * düğümlerin konumunu doğrudan (React render'ı olmadan) günceller.
 *
 * Neden drei <Html> değil? <Html> her etiket için ayrı bir React kökü açar;
 * R3F v9 StrictMode'u Canvas'a taşıdığından geliştirme modunda kökler yarış
 * durumuna girip etiket içeriklerini silebiliyordu. Bu yaklaşımda tek kök
 * vardır ve konum güncellemesi tamamen imperatif (hızlı) yapılır.
 */

import { useCallback, useRef } from 'react'
import * as THREE from 'three'

/** @type {Map<string, { position: THREE.Vector3, element: HTMLElement }>} */
const entries = new Map()

export const getLabelEntries = () => entries

/**
 * Bir DOM düğümünü dünya koordinatına bağlayan ref callback döndürür.
 * @param {string} id                      Benzersiz etiket kimliği
 * @param {[number, number, number]} position  Takip edilecek dünya koordinatı
 */
export function useLabelAnchor(id, position) {
  const positionRef = useRef(new THREE.Vector3())
  positionRef.current.set(position[0], position[1], position[2])

  return useCallback(
    (element) => {
      if (element) {
        element.style.visibility = 'hidden' // ilk izdüşüme kadar gizli (köşede parlamasın)
        entries.set(id, { position: positionRef.current, element })
      } else {
        entries.delete(id)
      }
    },
    [id],
  )
}
