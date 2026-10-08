// Grafik kalitesi: 0 düşük · 1 orta · 2 yüksek. Açılışta cihaza göre seçilir; sahne takılırsa drei PerformanceMonitor
// otomatik bir kademe düşürür (HQ.jsx → AutoQuality), akıcılaşırsa geri çıkar. ?kalite=0|1|2 ya da localStorage
// 'kkm:kalite' ile elle sabitlenebilir ("auto" = otomatik).
import { create } from 'zustand'

const nav = typeof navigator === 'undefined' ? {} : navigator
const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
const narrow = typeof innerWidth === 'number' && innerWidth < 768
const weak = (nav.deviceMemory && nav.deviceMemory <= 4) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) || nav.connection?.saveData
export const IS_TOUCH = touch || narrow

export const LEVELS = [
  // lod: karakterler kameraya bu mesafeden (m) uzaksa sade ağ (~%28 üçgen) kullanır · shadowEvery: gölge haritası kaç karede bir yenilenir · seatedEvery: oturan çalışan pozu kaç karede bir
  { name: 'Düşük', dpr: [1, 1], shadowMap: 1024, shadowEvery: 4, ao: false, bloom: false, smaa: false, post: false, seatedEvery: 3, lod: 5 },
  { name: 'Orta', dpr: [1, 1.25], shadowMap: 2048, shadowEvery: 2, ao: false, bloom: true, smaa: false, post: true, seatedEvery: 2, lod: 8 },
  { name: 'Yüksek', dpr: [1, 1.75], shadowMap: 2048, shadowEvery: 1, ao: true, bloom: true, smaa: true, post: true, seatedEvery: 1, lod: 14 },
]

const read = () => {
  let v = null
  try {
    v = new URLSearchParams(location.search).get('kalite') ?? localStorage.getItem('kkm:kalite')
  } catch {
    /* erişilemiyor */
  }
  const n = v === 'dusuk' ? 0 : v === 'orta' ? 1 : v === 'yuksek' ? 2 : Number.isInteger(+v) && v !== '' && v !== null ? Math.min(2, Math.max(0, +v)) : null
  return n
}
const forced = read()
const auto = forced === null
const start = forced ?? (!IS_TOUCH ? 2 : weak ? 0 : 1)

export const useQuality = create((set, get) => ({
  level: start,
  auto,
  max: start, // otomatik yükselme bu seviyeyi aşmaz
  set: (level) => get().level !== level && set({ level }),
  down: () => get().auto && get().level > 0 && set({ level: get().level - 1, max: Math.max(get().level - 1, 0) }),
  up: () => get().auto && get().level < get().max && set({ level: get().level + 1 }),
}))
export const Q = () => LEVELS[useQuality.getState().level]
export const useQ = () => LEVELS[useQuality((s) => s.level)]
if (typeof window !== 'undefined' && import.meta.env.DEV) window.__q = useQuality
