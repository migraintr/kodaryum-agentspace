// 3D sahnenin tema yardımcıları
import * as THREE from 'three'
import { useStore } from '../store.js'

export const useDark = () => useStore((s) => s.theme === 'dark')

// Parıltılar koyu zeminde eklemeli karışımla ışık gibi parlar; açık zeminde eklemeli ışık
// görünmez olur, bu yüzden normal (saydam renk) karışıma geçilir.
export const glowBlending = (dark) => (dark ? THREE.AdditiveBlending : THREE.NormalBlending)
