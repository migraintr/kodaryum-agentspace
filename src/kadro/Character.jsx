// Animasyonlu çalışan karakteri: iki temel model (erkek: ReadyPlayerMe, kadın: Michelle), kıyafet/ten
// renklendirme, Xbot animasyonlarının aktarımı (idle, walk, agree, headShake) ve prosedürel oturma/yazma pozu.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { aim, bakeRetarget, boneHeight, prefixOf, restMap } from './rig.js'

export const MODELS = {
  m: '/models/readyplayer.me.glb',
  f: '/models/Michelle.glb',
  mpfb: '/models/mpfb.glb',
  avaturn: '/models/avaturn.glb',
  avatarsdk: '/models/avatarsdk.glb',
  brunette: '/models/brunette.glb',
}
const ANIMS = '/models/Xbot.glb'
Object.values(MODELS).forEach((u) => useGLTF.preload(u))
useGLTF.preload(ANIMS)

// Dokuyu gri tona çevirip verilen renkle boyar: kumaş dokusu korunur, renk değişir
function dye(mat, color, strength = 1) {
  const m = mat.clone()
  m.color = new THREE.Color(color)
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
      float g = dot(diffuseColor.rgb / max(diffuse, vec3(0.001)), vec3(0.299, 0.587, 0.114));
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuse * g * 1.9, ${strength.toFixed(2)});`,
    )
  }
  m.customProgramCacheKey = () => `dye-${color}-${strength}`
  return m
}

const V = (x, y, z) => new THREE.Vector3(x, y, z)
export const SEAT_H = 0.5 // sandalye oturak yüksekliği (m)

export default function Character({ look, action = 'idle', height = 1.75, speed = 1, phase = 0, ...props }) {
  const { scene } = useGLTF(MODELS[look.model])
  const anim = useGLTF(ANIMS)
  const model = useMemo(() => clone(scene), [scene])
  const prefix = useMemo(() => prefixOf(model), [model])
  const rest = useMemo(() => restMap(model), [model])
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model])
  const bones = useRef({})

  useEffect(() => {
    model.scale.setScalar(1)
    model.scale.setScalar(height / boneHeight(model, prefix))
    model.traverse((o) => {
      if (o.isBone) bones.current[o.name.slice(prefix.length)] = o
      if (!o.isMesh) return
      o.castShadow = true
      o.receiveShadow = true
      const name = o.material.name
      if (name === 'Wolf3D_Headwear' || (name === 'Wolf3D_Beard' && !look.beard)) o.visible = false
      if (name === 'Wolf3D_Outfit_Top' && look.top) o.material = dye(o.material, look.top)
      if (name === 'Wolf3D_Outfit_Bottom' && look.bottom) o.material = dye(o.material, look.bottom)
      if (name === 'Wolf3D_Outfit_Footwear' && look.shoes) o.material = dye(o.material, look.shoes, 0.8)
      if (name === 'Ch03_Body' && look.tint) {
        o.material = o.material.clone()
        o.material.color = new THREE.Color(look.tint)
      }
      o.material.envMapIntensity = 0.9
    })
  }, [model]) // eslint-disable-line react-hooks/exhaustive-deps

  const src = useMemo(() => clone(anim.scene), [anim.scene])
  useEffect(() => {
    mixer.stopAllAction()
    if (action === 'type' || action === 'sit') return
    const name = { idle: 'idle', walk: 'walk', agree: 'agree', no: 'headShake' }[action] ?? 'idle'
    const clip = bakeRetarget(anim.animations.find((a) => a.name === name), src, model)
    const a = mixer.clipAction(clip)
    a.timeScale = speed
    a.time = phase * clip.duration
    a.play()
  }, [action]) // eslint-disable-line react-hooks/exhaustive-deps

  const sit = action === 'type' || action === 'sit'
  const drop = useRef(0)
  useFrame(({ clock }, dt) => {
    if (!sit) {
      model.position.y = 0
      return mixer.update(dt)
    }
    // Oturma / yazma: dinlenme pozundan başlayıp her kemiği karakter uzayında hedef yöne çevir.
    // Model +Z yönüne bakar; karakterin solu +X.
    const b = bones.current
    if (!b.Hips) return // iskelet henüz hazırlanmadı
    for (const [n, q] of rest) b[n]?.quaternion.copy(q)
    model.position.y = 0
    model.updateMatrixWorld(true)
    const t = clock.elapsedTime + phase * 13
    const typing = action === 'type'
    const breath = Math.sin(t * 1.5) * 0.012
    const glance = Math.max(0, Math.sin(t * 0.27 + phase * 5)) ** 8 // ara sıra başını kaldırıp bakar
    const lean = Math.max(0, Math.sin(t * 0.13 + phase * 3)) ** 10 // ara sıra arkasına yaslanır
    const A = (n, x, y, z) => aim(b[n], V(x, y, z), model)

    A('Spine', 0, 1, 0.08 - lean * 0.22 + breath)
    A('Spine1', 0, 1, 0.12 - lean * 0.18)
    A('Spine2', 0, 1, 0.1 - lean * 0.1)
    for (const s of [1, -1]) {
      const L = s > 0 ? 'Left' : 'Right'
      A(`${L}UpLeg`, s * 0.08, -0.05, 1)
      A(`${L}Leg`, s * 0.02, -1, 0.12)
      A(`${L}Foot`, 0, -0.35, 1)
      A(`${L}Arm`, s * 0.32, -1, 0.42 - lean * 0.3)
      const tap = typing ? Math.max(0, Math.sin(t * (s > 0 ? 17 : 15) + s)) * 0.06 * (1 - glance) : 0
      A(`${L}ForeArm`, -s * 0.28, 0.05 + tap - lean * 0.4, 1)
      A(`${L}Hand`, -s * 0.15, -0.15 - tap, 1)
    }
    A('Neck', 0, 1, 0.22 - glance * 0.12)
    A('Head', Math.sin(t * 0.21 + phase) * 0.25 * glance, 1, 0.2 - glance * 0.12)

    // kalçayı oturak yüksekliğine indir (ayaklar yere değer)
    if (!drop.current) {
      const hip = new THREE.Vector3()
      b.Hips.getWorldPosition(hip)
      drop.current = (hip.y - model.parent.getWorldPosition(new THREE.Vector3()).y) - SEAT_H - 0.08
    }
    model.position.y = -drop.current / model.parent.getWorldScale(new THREE.Vector3()).y
  })

  return (
    <group {...props}>
      <primitive object={model} />
    </group>
  )
}
