/**
 * KKM — 3D renk yardımcıları
 * (Bileşen dosyalarından ayrı tutulur → Vite Fast Refresh sorunsuz çalışır)
 */

import * as THREE from 'three'

/** HDR renk: yoğunluk > 1 olan renkler Bloom eşiğini aşar ve parlar */
export const hdr = (hex, intensity = 1) => new THREE.Color(hex).multiplyScalar(intensity)

/**
 * İki rengi algısal (sRGB) uzayda karıştırır (t=0 → a, t=1 → b).
 * Lineer uzayda karıştırmak koyu tonları beklenenden çok açar.
 */
export const mixColor = (a, b, t) =>
  new THREE.Color(a)
    .convertLinearToSRGB()
    .lerp(new THREE.Color(b).convertLinearToSRGB(), t)
    .convertSRGBToLinear()
