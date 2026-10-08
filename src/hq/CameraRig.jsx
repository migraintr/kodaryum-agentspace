// 360° ofis kamerası — her şey fareyle:
//  · Sol tık + sürükle: kat çevresinde 360° döndür (yatay) ve eğ (dikey); bırakınca ataletle yavaşlar.
//  · Sağ tık + sürükle (ya da Shift/Ctrl + sol tık): zemine paralel kaydır. Orta tık + sürükle: yakınlaş/uzaklaş.
//  · Tekerlek: imlecin gösterdiği noktaya doğru yumuşak yakınlaşma (o nokta ekranda yerinde kalır).
//    Dokunmatik yüzeyde iki parmak yatay kaydırma döndürür, sıkıştırma (pinch) yakınlaştırır.
//  · Çift tık: tıklanan noktaya süzülüp yaklaş; boşluğa çift tık: genel görünüm. Odaya tek tık: odaklan.
//  · İmleç: tut (grab) · sürüklerken kapalı el · kaydırırken taşı · odanın üstünde el işareti.
// Geçişler küresel koordinatlarda (yön, eğim, uzaklık) yapılır: 180° dönüşte kamera sahnenin içinden geçmez.
// Bakılan nokta kat sınırları içinde tutulur.
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store.js'
import { BACK, C, FRONT, ROOMS, W } from './plan.js'

export const HOME = { target: new THREE.Vector3(0, 0, -0.2), pos: new THREE.Vector3(0, 21, 23) }
export const LIMITS = { minDistance: 4, maxDistance: 60, minPolarAngle: 0.02, maxPolarAngle: 1.36 }
const HOME_SPH = new THREE.Spherical().setFromVector3(HOME.pos.clone().sub(HOME.target))
const ROOM_VIEW = { dist: 12.75, polar: 0.84 } // odaya odaklanınca

const TAU = Math.PI * 2
const wrap = (a) => a - TAU * Math.round(a / TAU) // → [-π, π]
const near = (base, a) => base + wrap(a - base) // a açısının base'e en yakın eşdeğeri
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const clampFloor = (v) => v.set(clamp(v.x, -W / 2, W / 2), clamp(v.y, 0, 2.5), clamp(v.z, BACK[0], FRONT[1]))

const _o = new THREE.Vector3()
const _d = new THREE.Vector3()
const _p = new THREE.Vector3()
const _s = new THREE.Spherical()
const _ndc = new THREE.Vector2()
const _ray = new THREE.Raycaster()
const _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

export function CameraRig() {
  const controls = useThree((s) => s.controls)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  const roomId = useStore((s) => s.roomId)
  const camReset = useStore((s) => s.camReset)
  const anim = useRef(null) // { now, to, rate } — now: o anki yön/eğim/uzaklık/hedef, to: varılacak
  const drag = useRef(null) // 'rotate' | 'pan' | 'dolly' | null

  const read = () => {
    _s.setFromVector3(_o.copy(camera.position).sub(controls.target))
    return { az: _s.theta, polar: _s.phi, dist: _s.radius, target: controls.target.clone() }
  }
  // Yeni hedef: süren geçişin varış noktasından hesaplanır (art arda tekerlek adımları birikir)
  const base = () => anim.current?.to ?? read()
  const go = (to, rate = 3.2) => {
    const now = anim.current?.now ?? read()
    anim.current = { now, to: { ...base(), ...to }, rate }
  }

  // Oda odağı ve genel görünüm (odak, mevcut yönü korur: arkadan bakıyorsanız oda da arkadan açılır)
  useEffect(() => {
    if (!controls) return
    const r = ROOMS.find((x) => x.id === roomId)
    const b = base()
    if (r) {
      const [cx, cz] = C(r)
      go({ target: new THREE.Vector3(cx, 0.6, cz), az: b.az, polar: ROOM_VIEW.polar, dist: ROOM_VIEW.dist, home: false })
    } else go({ target: HOME.target.clone(), az: near(b.az, 0), polar: HOME_SPH.phi, dist: HOME_SPH.radius, home: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, camReset, controls])

  // ── Fare
  useEffect(() => {
    if (!controls) return
    const el = controls.domElement
    const ndc = (e) => {
      const r = el.getBoundingClientRect()
      return _ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    }
    const cursor = () => {
      const hovered = useStore.getState().hoveredRoom
      el.style.cursor = drag.current === 'rotate' ? 'grabbing' : drag.current === 'pan' ? 'move' : drag.current === 'dolly' ? 'ns-resize' : hovered ? 'pointer' : 'grab'
    }
    // tekerlek: imlece doğru yumuşak yakınlaşma · yatay kaydırma: döndür (OrbitControls'ün adımlı yakınlaşması yerine)
    const onWheel = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const b = base()
      const line = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1
      const dx = e.deltaX * line
      const dy = e.deltaY * line
      if (!e.ctrlKey && Math.abs(dx) > Math.abs(dy) * 1.2) {
        go({ az: b.az + dx * 0.0022, home: false }, 9)
        return
      }
      const k = Math.exp(clamp(dy, -300, 300) * (e.ctrlKey ? 0.012 : 0.0015))
      const dist = clamp(b.dist * k, LIMITS.minDistance, LIMITS.maxDistance)
      const kk = dist / b.dist
      // imlecin altındaki nokta (bakılan noktanın yüksekliğindeki zemin düzlemi)
      _ray.setFromCamera(ndc(e), camera)
      _plane.constant = -b.target.y
      const hit = _ray.ray.intersectPlane(_plane, _p)
      const target = b.target.clone()
      if (hit && hit.distanceTo(b.target) < 60) target.lerp(hit, 1 - kk)
      go({ dist, target: clampFloor(target), home: false }, 7)
    }
    // çift tık: tıklanan noktaya süzül (boşluksa genel görünüm)
    const onDbl = (e) => {
      _ray.setFromCamera(ndc(e), camera)
      const hits = _ray.intersectObjects(scene.children, true).filter((h) => h.object.isMesh && h.object.visible && !h.object.material?.transparent)
      if (!hits.length) {
        useStore.getState().resetView()
        return
      }
      const p = hits[0].point.clone()
      p.y = clamp(p.y, 0, 1.2)
      const b = base()
      go({ target: clampFloor(p), dist: clamp(Math.min(b.dist * 0.55, 13), 6, 18), polar: clamp(b.polar, 0.55, 1.05), home: false }, 3.6)
    }
    const onDown = (e) => {
      drag.current = e.button === 2 || (e.button === 0 && (e.shiftKey || e.ctrlKey || e.metaKey)) ? 'pan' : e.button === 1 ? 'dolly' : 'rotate'
      cursor()
    }
    const onUp = () => {
      drag.current = null
      cursor()
    }
    const onStart = () => (anim.current = null) // kullanıcı sürükleyince süren geçiş biter
    el.addEventListener('wheel', onWheel, { passive: false, capture: true })
    el.addEventListener('dblclick', onDbl)
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    controls.addEventListener('start', onStart)
    const unsub = useStore.subscribe((s, p) => s.hoveredRoom !== p.hoveredRoom && cursor())
    cursor()
    return () => {
      el.removeEventListener('wheel', onWheel, { capture: true })
      el.removeEventListener('dblclick', onDbl)
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      controls.removeEventListener('start', onStart)
      unsub()
      el.style.cursor = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls, camera, scene])

  useFrame((_, dt) => {
    if (!controls) return
    const st = useStore.getState()
    const a = anim.current
    if (a) {
      const k = 1 - Math.exp(-dt * a.rate)
      const { now, to } = a
      now.az += (to.az - now.az) * k
      now.polar += (to.polar - now.polar) * k
      now.dist += (to.dist - now.dist) * k
      now.target.lerp(to.target, k)
      const done =
        Math.abs(to.az - now.az) < 2e-4 && Math.abs(to.polar - now.polar) < 2e-4 && Math.abs(to.dist - now.dist) < 2e-3 && now.target.distanceToSquared(to.target) < 1e-5
      if (done) {
        Object.assign(now, { az: to.az, polar: to.polar, dist: to.dist })
        now.target.copy(to.target)
        anim.current = null
      }
      controls.target.copy(now.target)
      camera.position.setFromSphericalCoords(now.dist, clamp(now.polar, LIMITS.minPolarAngle, LIMITS.maxPolarAngle), now.az).add(now.target)
      camera.lookAt(controls.target)
    }

    // Kaydırma sınırı: bakılan nokta kat dışına taşarsa kamerayla birlikte geri çek (açı bozulmaz)
    const t = controls.target
    _d.copy(t)
    clampFloor(_d).sub(t)
    if (_d.lengthSq() > 0) {
      t.add(_d)
      camera.position.add(_d)
      if (a) a.now.target.add(_d)
    }

    // oda tabelaları (kameraya göre köşe) ve "Genel görünüm" düğmesi için durum
    _s.setFromVector3(_o.copy(camera.position).sub(t))
    st.setCamAz(Math.round(THREE.MathUtils.radToDeg(wrap(_s.theta)) + 360) % 360)
    const goingHome = a?.to.home
    st.setCamMoved(!goingHome && (camera.position.distanceTo(HOME.pos) > 0.3 || t.distanceTo(HOME.target) > 0.15))
  })
  return null
}
