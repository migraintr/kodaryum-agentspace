/**
 * KKM — KAMERA DÜZENEĞİ
 *
 *  - Açılışta sinematik giriş: kamera yüksekten süzülerek binaya yaklaşır
 *  - Odak uçuşları: store'daki seçim değiştiğinde kamera yumuşakça uçar
 *      kurul seçildi   → odanın önüne-üstüne
 *      Başkan odakta   → komuta merkezine
 *      seçim kalktı    → ev (tüm bina) görünümüne
 *  - OrbitControls: sol tık döndür, sağ tık kaydır, tekerlek (imlece doğru) yakınlaş
 *  - Sınırlar: zeminin altına inilemez, bina dışına fazla kaydırılamaz
 *  - Kullanıcı kontrolü ele aldığı an (sürükleme/tekerlek) uçuş durur
 *  - Görüş kaydırma (setViewOffset): 2D paneller açıldıkça sahnenin optik
 *    merkezi panellerin bıraktığı boş alanın ortasına yumuşakça kayar
 */

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { shallow } from 'zustand/shallow'
import * as THREE from 'three'
import { useKKMStore } from '../../store/useKKMStore.js'
import { computeHudInsets } from '../ui/layout.js'
import { CAMERA, ZONES, getBoardRoomRect } from './layout/floorPlan.js'

const REFERENCE_ASPECT = 1.75 // ev konumu bu en/boy oranında binayı tam kadraja alır
const SPEED = { intro: 1.35, focus: 2.2 } // üstel sönüm hızı (büyük = hızlı)

/**
 * Dar ekranlarda (dikey monitör, tablet, mobil) kamerayı geri çekme katsayısı.
 * Üst sınır: telefonda binayı tamamen sığdırmak kamerayı sisin içine iter;
 * 2,2× ile kenarlar hafif taşar, kullanıcı kaydırarak/yakınlaşarak gezer.
 */
const MAX_FIT = 2.2
const fitFactor = (aspect) => Math.min(MAX_FIT, Math.max(1, REFERENCE_ASPECT / aspect))

/**
 * Store durumundan kameranın gideceği yeri hesaplar.
 * @returns {{ position: THREE.Vector3, target: THREE.Vector3 }}
 */
function resolveDestination({ selectedBoardId, isPresidentFocused }, aspect) {
  const fit = fitFactor(aspect)
  const closeFit = fit ** 0.6 // yakın planlarda daha ılımlı geri çekilme

  const fromOffset = (target, offset, k) => ({
    target,
    position: target.clone().add(new THREE.Vector3(...offset).multiplyScalar(k)),
  })

  const rect = selectedBoardId ? getBoardRoomRect(selectedBoardId) : null
  if (rect) {
    const target = new THREE.Vector3(rect.position[0], 0.9, rect.position[2] + 0.4)
    return fromOffset(target, CAMERA.roomOffset, closeFit)
  }
  if (isPresidentFocused) {
    const [x, , z] = ZONES.commandCenter.position
    return fromOffset(new THREE.Vector3(x, 1.8, z), CAMERA.presidentOffset, closeFit)
  }
  const target = new THREE.Vector3(...CAMERA.home.target)
  const offset = new THREE.Vector3(...CAMERA.home.position).sub(target)
  return { target, position: target.clone().add(offset.multiplyScalar(fit)) }
}

/**
 * Panellerin kaplamadığı serbest alanın en/boy oranı.
 * Kamera binayı tüm ekrana değil, bu alana sığdırır.
 */
function freeAspect(ui, size) {
  const insets = computeHudInsets(ui, size.width)
  const width = Math.max(1, size.width - insets.left - insets.right)
  const height = Math.max(1, size.height - insets.top - insets.bottom)
  return Math.max(0.3, width / height)
}

export function CameraRig() {
  const controlsRef = useRef(null)
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const size = useThree((s) => s.size)
  const sizeRef = useRef(size)
  sizeRef.current = size

  /** Aktif uçuş: kamera ve odak noktası bu hedeflere üstel sönümle yaklaşır */
  const flight = useRef(null)
  if (flight.current === null) {
    const ui = useKKMStore.getState()
    flight.current = { active: true, speed: SPEED.intro, ...resolveDestination({}, freeAspect(ui, size)) }
  }
  const clampOffset = useMemo(() => new THREE.Vector3(), [])
  /** Sahnenin serbest alana kaydırılması (piksel, sönümlü) */
  const viewShift = useRef({ x: 0, y: 0 })

  // Açılış: kamera yüksekten başlar
  useEffect(() => {
    camera.position.set(...CAMERA.intro)
    camera.lookAt(...CAMERA.home.target)
  }, [camera])

  // Seçim değişince yeni hedefe uç
  useEffect(
    () =>
      useKKMStore.subscribe(
        (s) => [s.selectedBoardId, s.isPresidentFocused],
        ([selectedBoardId, isPresidentFocused]) => {
          // Panel açılıp kapanması da bu güncellemeyle aynı anda olur → yeni serbest alana göre sığdır
          const ui = useKKMStore.getState()
          flight.current = {
            active: true,
            speed: SPEED.focus,
            ...resolveDestination({ selectedBoardId, isPresidentFocused }, freeAspect(ui, sizeRef.current)),
          }
        },
        { equalityFn: shallow },
      ),
    [],
  )

  // Geliştirme kolaylığı (production'da yok): tarayıcı konsolundan
  //   __KKM_CAMERA__.goTo([x, y, z], [tx, ty, tz])  → kamerayı taşı
  //   __KKM_CAMERA__.home()                         → ev konumuna uç
  //   __KKM_CAMERA__.info()                         → mesh / instance sayısı
  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__KKM_CAMERA__ = {
      scene,
      camera,
      goTo(position, target) {
        flight.current.active = false
        camera.position.set(...position)
        controlsRef.current?.target.set(...target)
        controlsRef.current?.update()
      },
      home() {
        flight.current = {
          active: true,
          speed: SPEED.focus,
          ...resolveDestination({}, freeAspect(useKKMStore.getState(), sizeRef.current)),
        }
      },
      info() {
        let meshes = 0
        let instances = 0
        scene.traverse((o) => {
          if (!o.isMesh || !o.visible) return
          meshes += 1
          if (o.isInstancedMesh) instances += o.count
        })
        return { meshes, instances, textures: gl.info.memory.textures, geometries: gl.info.memory.geometries }
      },
    }
    return () => delete window.__KKM_CAMERA__
  }, [camera, gl, scene])

  useFrame(({ size: viewport }, delta) => {
    const controls = controlsRef.current
    if (!controls) return

    // 0) Görüş kaydırma: sahnenin optik merkezini panellerin bıraktığı boş alanın
    //    ortasına taşır (izdüşüm matrisine uygulanır → ışın atma ve etiketler uyumlu kalır)
    const insets = computeHudInsets(useKKMStore.getState(), viewport.width)
    const shift = viewShift.current
    const k = 1 - Math.exp(-delta * 5)
    shift.x += (-(insets.left - insets.right) / 2 - shift.x) * k
    shift.y += (-(insets.top - insets.bottom) / 2 - shift.y) * k
    camera.setViewOffset(viewport.width, viewport.height, shift.x, shift.y, viewport.width, viewport.height)

    // 1) Uçuş: kamera ve odak noktası birlikte hedefe süzülür
    const f = flight.current
    if (f.active) {
      const k = 1 - Math.exp(-delta * f.speed)
      camera.position.lerp(f.position, k)
      controls.target.lerp(f.target, k)
      controls.update()
      if (camera.position.distanceToSquared(f.position) < 1e-3 && controls.target.distanceToSquared(f.target) < 1e-3) {
        f.active = false
      }
    }

    // 2) Odak noktasını bina sınırları içinde tut (kamera ile birlikte kaydır)
    const { x: maxX, z: maxZ } = CAMERA.targetBounds
    const target = controls.target
    clampOffset.set(
      THREE.MathUtils.clamp(target.x, -maxX, maxX) - target.x,
      THREE.MathUtils.clamp(target.y, 0, 3) - target.y,
      THREE.MathUtils.clamp(target.z, -maxZ, maxZ) - target.z,
    )
    if (clampOffset.lengthSq() > 0) {
      target.add(clampOffset)
      camera.position.add(clampOffset)
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={CAMERA.home.target}
      enableDamping
      dampingFactor={0.07}
      minDistance={5}
      maxDistance={185}
      minPolarAngle={0.12}
      maxPolarAngle={1.35}
      screenSpacePanning={false}
      zoomToCursor
      onStart={() => {
        flight.current.active = false
      }}
    />
  )
}
