// Animasyonlu çalışan karakteri: iki temel model (erkek: ReadyPlayerMe, kadın: Michelle), kıyafet/ten
// renklendirme, Xbot animasyonlarının aktarımı (idle, walk, agree, headShake) ve prosedürel oturma/yazma pozu.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { PERF } from '../perf.js'
import { aim, bakeRetarget, baseName, boneHeight, prefixOf, restMap, roll } from './rig.js'

export const MODELS = {
  // Depodaki (sıkıştırılmış) çalışan modelleri
  man: '/agents/man.glb',
  woman: '/agents/woman.glb',
  // Yerel deneme modelleri (public/models, depoda yok)
  m: '/models/readyplayer.me.glb',
  f: '/models/Michelle.glb',
  mpfb: '/models/mpfb.glb',
  avaturn: '/models/avaturn.glb',
  avatarsdk: '/models/avatarsdk.glb',
  brunette: '/models/brunette.glb',
}
const ANIMS = '/agents/anims.glb'
;[MODELS.man, MODELS.woman].forEach((u) => useGLTF.preload(u))
useGLTF.preload(ANIMS)

// Takım elbise boyası: yalnızca renkli kumaşı (ceket, yelek, pantolon) boyar; beyaz gömlek ve koyu
// detaylar (kravat, düğme) korunur. Kumaş dokusu parlaklık üzerinden aynen kalır.
function suit(mat, color, accent) {
  const m = mat.clone()
  m.userData.suit = new THREE.Color(color)
  m.userData.accent = new THREE.Color(accent ?? color)
  m.onBeforeCompile = (s) => {
    s.uniforms.uSuit = { value: m.userData.suit }
    s.uniforms.uAccent = { value: m.userData.accent }
    s.fragmentShader = s.fragmentShader.replace('void main() {', 'uniform vec3 uSuit;\nuniform vec3 uAccent;\nvoid main() {').replace(
      '#include <map_fragment>',
      `#include <map_fragment>
      vec3 c0 = diffuseColor.rgb;
      float hi = max(c0.r, max(c0.g, c0.b));
      float lo = min(c0.r, min(c0.g, c0.b));
      float sat = (hi - lo) / (hi + 0.0001);
      float lum = dot(c0, vec3(0.299, 0.587, 0.114));
      float cloth = smoothstep(0.1, 0.22, sat);              // renkli kumaş → boya
      float vest = smoothstep(0.04, 0.0, c0.g - c0.b) * cloth; // morumsu yelek → aksan rengi
      vec3 dyed = mix(uSuit, uAccent, vest) * (0.35 + lum * 1.25);
      diffuseColor.rgb = mix(c0, dyed, cloth);`,
    )
  }
  m.customProgramCacheKey = () => `suit-${color}-${accent}`
  return m
}

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
      if (name === 'Wolf3D_Outfit_Top' && look.suit) o.material = suit(o.material, look.suit, look.vest)
      else if (name === 'Wolf3D_Outfit_Top' && look.top) o.material = dye(o.material, look.top)
      if (name === 'Wolf3D_Outfit_Bottom' && look.suit) o.material = suit(o.material, look.suit)
      else if (name === 'Wolf3D_Outfit_Bottom' && look.bottom) o.material = dye(o.material, look.bottom)
      if (/shoes/i.test(name) && look.shoes) o.material = dye(o.material, look.shoes, 0.9)
      if (name === 'Wolf3D_Outfit_Footwear' && look.shoes) o.material = dye(o.material, look.shoes, 0.8)
      if (name === 'Ch03_Body' && look.tint) {
        o.material = o.material.clone()
        o.material.color = new THREE.Color(look.tint)
      }
      o.material.envMapIntensity = 0.9
    })
    // Şapka gizlenince kısa kesim saç: kafa derisi bağlama pozundaki (bind pose) konuma göre boyanır —
    // tepe, şakaklar ve ense saç rengini alır, alın ve yüz açık kalır; hafif doku gürültüsü saç telini andırır.
    const head = model.getObjectByName('Wolf3D_Head')
    if (look.hair && head && !head.userData.hair) {
      head.geometry.computeBoundingBox()
      const bb = head.geometry.boundingBox
      const m = head.material.clone()
      m.userData.hair = new THREE.Color(look.hair)
      m.onBeforeCompile = (s) => {
        s.uniforms.uHair = { value: m.userData.hair }
        s.uniforms.uTop = { value: bb.max.y }
        s.uniforms.uFront = { value: bb.max.z }
        s.uniforms.uMidZ = { value: (bb.min.z + bb.max.z) / 2 }
        s.vertexShader = s.vertexShader
          .replace('void main() {', 'varying vec3 vBind;\nvoid main() {\n  vBind = position;')
        s.fragmentShader = s.fragmentShader
          .replace('void main() {', 'uniform vec3 uHair;\nuniform float uTop;\nuniform float uFront;\nuniform float uMidZ;\nvarying vec3 vBind;\nvoid main() {')
          .replace(
            '#include <map_fragment>',
            `#include <map_fragment>
            float d = uTop - vBind.y;                                   // tepeden aşağı (m)
            float back = smoothstep(uMidZ + 0.03, uMidZ - 0.03, vBind.z); // başın arka yarısı
            float ax = abs(vBind.x);
            float line = 0.068 + 0.022 * smoothstep(0.02, 0.06, ax);      // alın ortası yüksek, şakaklara doğru iner
            float hairline = smoothstep(line + 0.006, line - 0.006, d);
            float nape = back * smoothstep(0.155, 0.14, d);                // ense
            float temple = smoothstep(0.058, 0.066, ax) * smoothstep(0.11, 0.1, d) * smoothstep(uFront - 0.055, uFront - 0.075, vBind.z); // favoriler (kulak önü)
            float mask = clamp(max(max(hairline, nape), temple), 0.0, 1.0);
            float n = fract(sin(dot(floor(vBind.xz * 900.0), vec2(12.9898, 78.233))) * 43758.5453);
            vec3 hc = uHair * (0.75 + 0.5 * n);
            diffuseColor.rgb = mix(diffuseColor.rgb, hc, mask);`,
          )
      }
      m.customProgramCacheKey = () => `hair-${look.hair}`
      head.material = m
      head.userData.hair = true
    }
  }, [model]) // eslint-disable-line react-hooks/exhaustive-deps

  const src = useMemo(() => clone(anim.scene), [anim.scene])
  const clips = useRef({})
  const current = useRef(null)
  useEffect(() => {
    if (action === 'type' || action === 'sit') {
      mixer.stopAllAction()
      current.current = null
      return
    }
    const name = { idle: 'idle', walk: 'walk', agree: 'agree', no: 'headShake' }[action] ?? 'idle'
    let clip = clips.current[name]
    if (!clip) {
      // Aktarım her zaman bağlama pozundan yapılır. (Önceden o anki animasyonlu poz "dinlenme" sanılıyordu:
      // yürü ↔ dur geçişlerinde iskelet her seferinde farklı bozuluyor, yürüyüş çarpıklaşıyordu.)
      const saved = []
      model.traverse((o) => {
        if (!o.isBone) return
        saved.push([o, o.quaternion.clone(), o.position.clone()])
        const q = rest.get(baseName(o.name))
        if (q) o.quaternion.copy(q)
      })
      model.updateMatrixWorld(true)
      clip = clips.current[name] = bakeRetarget(anim.animations.find((a) => a.name === name), src, model)
      for (const [o, q, pos] of saved) o.quaternion.copy(q), o.position.copy(pos)
      model.updateMatrixWorld(true)
    }
    const a = mixer.clipAction(clip)
    a.reset()
    a.timeScale = speed
    a.play()
    if (current.current && current.current !== a) a.crossFadeFrom(current.current, 0.35, true)
    else a.time = phase * clip.duration
    current.current = a
  }, [action]) // eslint-disable-line react-hooks/exhaustive-deps

  const sit = action === 'type' || action === 'sit'
  const drop = useRef(0)
  const posed = useRef(false)
  const frame = useRef(0)
  const acc = useRef(0)
  useEffect(() => {
    model.visible = false // ilk poz uygulanana kadar gizli: T-pozu hiç görünmez
    posed.current = false
  }, [model])
  useFrame((st, dt) => {
    if (!posed.current && (sit ? bones.current.Hips : true)) {
      posed.current = true
      requestAnimationFrame(() => (model.visible = true))
    }
    if (!sit) {
      model.position.y = 0
      mixer.update(dt)
      const b = bones.current
      if (!b.Hips || !b.LeftFoot) return
      model.updateMatrixWorld(true)
      // Ayakların ileri-geri farkı → kolu karşı yöne salla (sol ayak öndeyse sağ kol önde)
      const lf = model.worldToLocal(b.LeftFoot.getWorldPosition(new THREE.Vector3()))
      const rf = model.worldToLocal(b.RightFoot.getWorldPosition(new THREE.Vector3()))
      const step = (lf.z - rf.z) / (Math.abs(lf.z - rf.z) + 0.35) // −1..1
      const walking = action === 'walk'
      const w = walking ? 0.9 : 0.55
      for (const sd of [1, -1]) {
        const L = sd > 0 ? 'Left' : 'Right'
        const swing = walking ? -sd * step * 0.62 : 0
        aim(b[`${L}Arm`], V(sd * 0.13, -1, swing), model, w)
        aim(b[`${L}ForeArm`], V(sd * 0.05, -1, swing + 0.18 + Math.max(0, swing) * 0.5), model, w)
        aim(b[`${L}Hand`], V(sd * 0.02, -1, swing + 0.12), model, w * 0.8)
      }
      return
    }
    // Oturan çalışanın prosedürel pozu pahalı (kemik başına dünya matrisi): zayıf cihazlarda her N karede bir
    acc.current += dt
    if (posed.current && frame.current++ % PERF.seatedEvery) return
    acc.current = 0
    const { clock } = st
    // Oturma / yazma: dinlenme pozundan başlayıp her kemiği karakter uzayında hedef yöne çevir.
    // Model +Z yönüne bakar; karakterin solu +X.
    const b = bones.current
    if (!b.Hips) return // iskelet henüz hazırlanmadı
    for (const [n, q] of rest) b[n]?.quaternion.copy(q)
    model.position.y = 0
    model.updateMatrixWorld(true)
    const t = clock.elapsedTime + phase * 13
    const typing = action === 'type'
    const sm = (a, z, x) => {
      const k = Math.min(1, Math.max(0, (x - a) / (z - a)))
      return k * k * (3 - 2 * k)
    }
    const breath = Math.sin(t * 1.5) * 0.012
    const glance = Math.max(0, Math.sin(t * 0.27 + phase * 5)) ** 8 // ara sıra başını kaldırıp ofise bakar
    const lean = Math.max(0, Math.sin(t * 0.13 + phase * 3)) ** 10 // ara sıra arkasına yaslanır
    // Yazma atakları: düşünme/okuma araları ile kesintili yazma (0..1)
    const burst = typing ? sm(-0.15, 0.35, Math.sin(t * 0.55 + phase * 9) + 0.6 * Math.sin(t * 1.43 + phase * 4)) * (1 - glance) * (1 - lean) : 0
    // Sağ el ara sıra fareye geçer (yazma atağı yokken daha olası)
    const mouse = typing ? sm(0.35, 0.7, Math.sin(t * 0.19 + phase * 7) - burst * 0.5) : 0
    const A = (n, x, y, z, w) => aim(b[n], V(x, y, z), model, w)

    // gövde: hafif öne eğik, nefes; fareye uzanırken çok hafif döner
    A('Spine', mouse * -0.03, 1, 0.08 - lean * 0.22 + breath)
    A('Spine1', mouse * -0.04, 1, 0.13 - lean * 0.18 + burst * 0.02)
    A('Spine2', 0, 1, 0.11 - lean * 0.1)
    for (const s of [1, -1]) {
      const L = s > 0 ? 'Left' : 'Right'
      A(`${L}UpLeg`, s * 0.08, -0.05, 1)
      A(`${L}Leg`, s * 0.02 + Math.sin(t * 0.3 + s) * 0.01, -1, 0.12)
      A(`${L}Foot`, 0, -0.35, 1)
      // kollar: dirsekler gövde yanında, ön kollar klavyeye uzanır; sağ el fareye geçer
      const m = s < 0 ? mouse : 0
      A(`${L}Arm`, s * 0.3, -1, 0.42 - lean * 0.3 + m * 0.05)
      // her elin kendi ritmi: tuş vuruşunda bilek ve ön kol hafif iner, el klavyede yatay kayar
      const jit = Math.sin(t * (s > 0 ? 2.3 : 2.9) + s) * 0.03 * burst
      const press = burst * Math.max(0, Math.sin(t * (s > 0 ? 13.7 : 15.3) + s * 2)) ** 3
      const fx = -s * 0.28 * (1 - m) + s * 0.02 * m + jit
      A(`${L}ForeArm`, fx, 0.04 - press * 0.05 - lean * 0.4 + m * 0.03, 1)
      // fare: küçük daireler + tık
      const mx = m ? Math.sin(t * 2.1) * 0.05 * m : 0
      const click = m * Math.max(0, Math.sin(t * 3.7 + 1)) ** 16
      // avuç klavyeye/fareye bakar: başparmak içe ve hafif yukarı (ön kol + bilek burulması)
      const thumb = b[`${L}HandThumb1`]
      const palm = V(-s, m ? 0.15 : 0.45, 0.1)
      roll(b[`${L}ForeArm`], thumb, palm, model, 0.75)
      A(`${L}Hand`, -s * 0.12 * (1 - m) + mx, -0.12 - press * 0.12 - m * 0.06, 1)
      roll(b[`${L}Hand`], thumb, palm, model, 1)
      // parmaklar: atak sırasında farklı ritimlerle tuşlara basar; fare elinde işaret parmağı tıklar
      ;['Index', 'Middle', 'Ring', 'Pinky'].forEach((f, k) => {
        const rate = 9 + ((k * 3.1 + (s > 0 ? 0 : 1.7)) % 5) * 1.6
        const tap = m ? (f === 'Index' ? click : 0) : burst * Math.max(0, Math.sin(t * rate + k * 1.9 + s)) ** 6
        const curl = m ? 0.55 : 0.4
        A(`${L}Hand${f}1`, -s * (0.03 * (k - 1.5)), -curl - tap * 0.9, 1, 0.85)
        A(`${L}Hand${f}2`, -s * 0.02 * (k - 1.5), -curl - 0.35 - tap * 0.5, 1, 0.8)
      })
    }
    // baş: ekranı okur (küçük yatay göz/baş taramaları), ara sıra klavyeye, nadiren ofise bakar
    const read = Math.sin(t * 0.85 + phase * 3) * 0.035 * (1 - glance)
    const down = typing ? sm(0.6, 0.9, Math.sin(t * 0.37 + phase * 11)) * 0.12 : 0
    A('Neck', read * 0.5, 1, 0.22 - glance * 0.12 + down * 0.4)
    A('Head', read + Math.sin(t * 0.21 + phase) * 0.25 * glance + mouse * -0.04, 1, 0.2 - glance * 0.12 + down)

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
