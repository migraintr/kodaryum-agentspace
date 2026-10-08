// Cihaz sınıfı: 3B sahne ve animasyon maliyeti buna göre ayarlanır.
//   high: masaüstü · mid: telefon/tablet · low: düşük bellekli / az çekirdekli telefon veya "veri tasarrufu"
const nav = typeof navigator === 'undefined' ? {} : navigator
const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
const narrow = typeof innerWidth === 'number' && innerWidth < 768
const weak = (nav.deviceMemory && nav.deviceMemory <= 4) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) || nav.connection?.saveData

export const IS_TOUCH = coarse || narrow
export const TIER = !IS_TOUCH ? 'high' : weak ? 'low' : 'mid'

export const PERF = {
  dpr: { high: [1, 1.75], mid: [1, 1.5], low: [1, 1] }[TIER],
  shadowMap: { high: 4096, mid: 2048, low: 1024 }[TIER],
  ao: TIER === 'high', // N8AO (ekran uzayı ortam tıkanması) en pahalı efekt
  smaa: TIER === 'high',
  bloom: TIER !== 'low',
  post: TIER !== 'low', // low: efekt zinciri hiç kurulmaz
  seatedEvery: { high: 1, mid: 2, low: 3 }[TIER], // oturan çalışan pozlarını her N karede bir güncelle
}
