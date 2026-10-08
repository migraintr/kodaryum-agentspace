// Suspense'siz tembel modül: ilk ihtiyaçta (ya da boşta önceden) yüklenir, hazır olunca bileşen yeniden çizilir.
// (Menü ekranlarında React.lazy + Suspense, 3B sahne yüklenirken ilk açılışta bazen hiç görünmüyordu.)
import { useEffect, useState } from 'react'

export function deferred(load) {
  let mod = null
  let promise = null
  const get = () => (promise ??= load().then((m) => (mod = m)))
  function useModule(want) {
    const [, rerender] = useState(0)
    useEffect(() => {
      if (!want || mod) return
      let alive = true
      get().then(() => alive && rerender((n) => n + 1))
      return () => {
        alive = false
      }
    }, [want])
    return want || mod ? mod : null
  }
  return { get, useModule }
}

/** Tarayıcı boştayken çalıştır (Safari'de requestIdleCallback yok) */
export const whenIdle = (fn, timeout = 4000) =>
  typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout }) : setTimeout(fn, 1200)
