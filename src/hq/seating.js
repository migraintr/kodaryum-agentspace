// Masa ataması: çalışanlar departmanlarının masalarına sırayla oturur. Sahne (masadaki sabit fare gizlenir)
// ve çalışan katmanı (oturan karakter + masa üstü eşyaları) aynı listeyi kullanır.
import { CEO, PEOPLE } from '../data.js'
import { INSPECTOR } from './actors.js'
import { DESKS, SEAT_TO_DESK } from './plan.js'

export const MOVERS = new Set([CEO.id, INSPECTOR]) // senaryolu hareket edenler (masalarını korurlar)

export const SEATING = (() => {
  const used = {}
  const seats = []
  PEOPLE.forEach((p, i) => {
    if (p.id === CEO.id) return
    const k = (used[p.dept] = (used[p.dept] ?? -1) + 1)
    const d = DESKS[p.dept]?.[k]
    if (d && !MOVERS.has(p.id)) seats.push({ p, i, k, desk: d, x: d.x, z: d.z + SEAT_TO_DESK, ry: Math.PI })
  })
  return seats
})()

// "departman:sıra" → masada oturan biri var mı (sabit fare yerine çalışanın elindeki fare görünür)
export const OCCUPIED = new Set(SEATING.map((s) => `${s.p.dept}:${s.k}`))
