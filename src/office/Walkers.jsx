// Mola Odası'ndaki iki kişi (Kaan · Canan) fotoğraftan ayrılmış canlı figürler: ayakta sohbet ederler,
// ara sıra kahve tezgâhına yürür, bekler ve yerlerine dönerler. Yürüyüşte adım sekmesi, salınım, bakış yönü
// çevirme ve zemin gölgesi vardır; ışık (gündüz/akşam/gece) fotoğrafla aynı çarpanla renklendirilir.
import { useEffect, useMemo, useRef } from 'react'
import { LIGHTS } from './LivingPlate.jsx'

// Ölçüler dünya birimi (1672×690). home: ayak ucu merkezi. Görsel boyutu = piksel / 2.
export const WALKERS = {
  kaan: { src: '/office/walker-man.png', w: 34.5, h: 114.5, home: [958, 587] },
  canan: { src: '/office/walker-woman.png', w: 34, h: 112.5, home: [995, 593.5] },
}
// Gidilecek yerler (ayak konumu): tezgâh önü ve sağ boşluk
const TRIPS = [[905, 550], [1075, 550], [1010, 552], [1190, 590]]
const SPEED = 30 // dünya birimi / saniye
const rand = (a, b) => a + Math.random() * (b - a)
const lightColor = (name) => {
  const L = LIGHTS[name] ?? LIGHTS.day
  const c = L.amb.map((v, i) => Math.round(Math.min(1, v * L.tint[i]) * 255))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

export default function Walkers({ lighting, onEnter, onLeave }) {
  const refs = useRef({})
  const tint = useMemo(() => lightColor(lighting), [lighting])

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const ids = Object.keys(WALKERS)
    const S = ids.map((id, i) => {
      const s = WALKERS[id]
      return { id, s, x: s.home[0], y: s.home[1], flip: 1, flipTo: 1, mode: 'idle', until: 4 + i * 7, target: null, phase: Math.random() * 6, ph: i * 2.7, moving: 0 }
    })
    let raf = 0
    let last = 0
    let t = 0
    let busyWith = null // aynı anda yalnızca biri yürür
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.1, (now - last) / 1000 || 0.033)
      if (now - last < 30) return
      last = now
      t += dt
      for (const w of S) {
        const el = refs.current[w.id]
        if (!el) continue
        let vx = 0
        let vy = 0
        if (w.mode === 'idle') {
          if (!reduce && t > w.until && !busyWith) {
            busyWith = w.id
            w.target = TRIPS[Math.floor(Math.random() * TRIPS.length)]
            w.mode = 'go'
          }
        } else if (w.mode === 'go' || w.mode === 'back') {
          const [tx, ty] = w.mode === 'go' ? w.target : w.s.home
          const dx = tx - w.x
          const dy = ty - w.y
          const d = Math.hypot(dx, dy)
          const sp = SPEED * Math.min(1, 0.25 + w.moving * 0.75) // yavaş kalkış
          if (d < 1.5) {
            w.moving = 0
            if (w.mode === 'go') {
              w.mode = 'wait'
              w.until = t + rand(3.5, 6.5)
            } else {
              w.mode = 'idle'
              w.flipTo = 1
              w.until = t + rand(12, 22)
              busyWith = null
            }
          } else {
            w.moving = Math.min(1, w.moving + dt * 1.6)
            const step = Math.min(d, sp * dt)
            vx = (dx / d) * step
            vy = (dy / d) * step
            w.x += vx
            w.y += vy
            if (Math.abs(dx) > 6) w.flipTo = dx > 0 ? 1 : -1
          }
        } else if (w.mode === 'wait' && t > w.until) {
          w.mode = 'back'
        }

        const walking = vx !== 0 || vy !== 0
        if (walking) w.phase += dt * 2.3
        w.flip += (w.flipTo - w.flip) * Math.min(1, dt * 9) // dönüş: yatayda sıkışıp açılır
        const step = Math.abs(Math.sin(w.phase * Math.PI))
        const bob = walking ? step * 1.9 : 0
        const sway = walking ? Math.sin(w.phase * Math.PI) * 1.5 : Math.sin(t * 0.6 + w.ph) * 0.5
        const lean = walking ? Math.sign(vx) * 1.2 : 0
        const breath = 1 + Math.sin(t * 1.7 + w.ph) * 0.004 + (walking ? 0 : Math.max(0, Math.sin(t * 0.35 + w.ph * 3)) * 0.003)
        const shift = walking ? 0 : Math.sin(t * 0.23 + w.ph * 2) * 1.4 // ağırlık aktarma
        const sc = 1 + (w.y - 590) * 0.0012 // derinlik: öne gelen büyür
        el.style.transform = `translate3d(${(w.x + shift).toFixed(2)}px, ${w.y.toFixed(2)}px, 0)`
        const body = el.firstChild
        body.style.transform = `translateY(${(-bob).toFixed(2)}px) rotate(${(sway + lean).toFixed(2)}deg) scale(${(w.flip * sc).toFixed(3)}, ${(sc * breath).toFixed(4)})`
      }
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="po-layer po-walkers">
      {Object.entries(WALKERS).map(([id, s]) => (
        <div key={id} ref={(el) => (refs.current[id] = el)} className="po-wk" style={{ transform: `translate3d(${s.home[0]}px, ${s.home[1]}px, 0)` }}>
          <div
            className="po-wk-body"
            style={{ width: s.w, height: s.h, left: -s.w / 2, top: -s.h }}
            onPointerEnter={(e) => onEnter(id, e)}
            onPointerMove={(e) => onEnter(id, e)}
            onPointerLeave={onLeave}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <img src={s.src} alt="" draggable={false} />
            <i className="po-wk-tint" style={{ background: tint, maskImage: `url(${s.src})`, WebkitMaskImage: `url(${s.src})` }} />
          </div>
          <i className="po-wk-shadow" style={{ width: s.w * 0.95 }} />
        </div>
      ))}
    </div>
  )
}
