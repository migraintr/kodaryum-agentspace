// Ekran uzayındaki kamera katmanı: sensör greni, lens kararması ve canlı güvenlik kamerası bilgileri.
// Kameranın yakınlaşmasından bağımsızdır (gren yakınlaşınca büyümez); tıklamayı engellemez.
import { useEffect, useMemo, useState } from 'react'

// Bir kez üretilen gürültü dokusu (128×128, gri tonlu) → CSS ile titreştirilir
function useGrain() {
  return useMemo(() => {
    if (typeof document === 'undefined') return ''
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')
    const img = ctx.createImageData(128, 128)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (Math.random() + Math.random() + Math.random() - 1.5) * 90
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    return c.toDataURL()
  }, [])
}

function Stamp() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const d = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const t = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return (
    <span className="po-feed-ts">
      {d} {t}
    </span>
  )
}

export default function CameraFeed() {
  const grain = useGrain()
  return (
    <div className="po-feed" aria-hidden="true">
      <i className="po-feed-grain" style={{ backgroundImage: `url(${grain})` }} />
      <i className="po-feed-lens" />
      <div className="po-feed-hud">
        <span className="po-feed-live">
          <i /> CANLI
        </span>
        <span>KAM-01 · KODARYUM HQ · KAT 3</span>
      </div>
      <div className="po-feed-foot">
        <Stamp />
      </div>
    </div>
  )
}
