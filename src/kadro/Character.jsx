// Animasyonlu çalışan karakteri: iki temel model (erkek: ReadyPlayerMe, kadın: Michelle), kıyafet/ten
// renklendirme, Xbot animasyonlarının aktarımı (idle, walk, agree, headShake) ve prosedürel oturma/yazma pozu.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { createDeskPose } from './deskPose.js'
import { createGait } from './gait.js'
import { aim, bakeRetarget, baseName, boneHeight, prefixOf, restMap, roll, rollPalm } from './rig.js'

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

// Hareket türleri: ayakta/yürüyüş prosedürel (gait.js), oturma prosedürel, diğerleri (agree/no) animasyon klibi
const LOCO = new Set(['walk', 'idle', 'inspect'])
const SIT = new Set(['sit', 'type', 'chat'])
const _tq = new THREE.Quaternion()
const _tv = new THREE.Vector3()

// work (work.js): masa başı davranışı verilirse oturan çalışan klavye/fare/okuma/düşünme döngüsüyle çalışır
export default function Character({ look, action = 'idle', height = 1.75, speed = 1, phase = 0, speaking = false, tablet = false, work = null, ...props }) {
  const { scene } = useGLTF(MODELS[look.model])
  const anim = useGLTF(ANIMS)
  const model = useMemo(() => clone(scene), [scene])
  const prefix = useMemo(() => prefixOf(model), [model])
  const rest = useMemo(() => restMap(model), [model])
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model])
  const bones = useRef({})
  const blinkTargets = useRef([])

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
    // Göz kırpma morfları (varsa): eyeBlinkLeft/Right ya da eyesClosed
    blinkTargets.current = []
    model.traverse((o) => {
      const d = o.isMesh && o.morphTargetDictionary
      if (!d) return
      const idx = ['eyeBlinkLeft', 'eyeBlinkRight'].map((k) => d[k]).filter((i) => i != null)
      if (!idx.length && d.eyesClosed != null) idx.push(d.eyesClosed)
      if (idx.length) blinkTargets.current.push([o, idx])
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
    if (SIT.has(action) || LOCO.has(action)) {
      mixer.stopAllAction()
      current.current = null
      return
    }
    const name = { agree: 'agree', no: 'headShake' }[action] ?? 'idle'
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

  const sit = SIT.has(action)
  const desk = work && (action === 'type' || action === 'sit') // masa başında çalışıyor
  const deskPose = useRef(null)
  const blink = useRef({ at: 1 + phase * 4, t: -9 })
  const drop = useRef(0)
  const posed = useRef(false)
  const gait = useRef(null)
  const bonesAll = useMemo(() => {
    const a = []
    model.traverse((o) => o.isBone && a.push(o))
    return a
  }, [model])
  // Hareket değişince (otur ↔ kalk ↔ yürü) son pozdan yenisine 0,5 sn'de yumuşak geçiş
  const blend = useRef({ last: null, from: null, pos: new THREE.Vector3(), t: 1 })
  // Tablet (sağ elde): kök grubuna eklenir, her karede ele taşınır
  const tabletObj = useMemo(() => {
    if (!tablet) return null
    const g = new THREE.Group()
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.011, 0.26), new THREE.MeshStandardMaterial({ color: '#1b1f27', roughness: 0.4, metalness: 0.3 }))
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.235), new THREE.MeshBasicMaterial({ color: '#8fd3ff', toneMapped: false }))
    screen.rotation.x = -Math.PI / 2
    screen.position.y = 0.0062
    body.castShadow = true
    g.add(body, screen)
    return g
  }, [tablet])
  useEffect(() => {
    model.visible = false // ilk poz uygulanana kadar gizli: T-pozu hiç görünmez
    posed.current = false
  }, [model])
  useFrame((st, dt) => {
    const b = bones.current
    if (!b.Hips) return // iskelet henüz hazırlanmadı
    if (!posed.current) {
      posed.current = true
      requestAnimationFrame(() => (model.visible = true))
    }
    const bl = blend.current
    if (bl.last !== null && bl.last !== action) {
      bl.from = bonesAll.map((o) => o.quaternion.clone())
      bl.pos.copy(model.position)
      bl.t = 0
      if (LOCO.has(action) && !LOCO.has(bl.last)) gait.current?.reset()
    }
    bl.last = action
    pose(st, dt, b)
    if (bl.t < 1 && bl.from) {
      bl.t = Math.min(1, bl.t + dt / 0.5)
      const w = bl.t * bl.t * (3 - 2 * bl.t)
      bonesAll.forEach((o, i) => {
        _tq.copy(o.quaternion)
        o.quaternion.copy(bl.from[i]).slerp(_tq, w)
      })
      model.position.lerpVectors(bl.pos, _tv.copy(model.position), w)
    }
    // göz kırpma (masa başında work.js'in ritmi, diğer durumlarda kendi zamanlayıcısı)
    if (blinkTargets.current.length) {
      let v
      if (desk) v = work.S.blink
      else {
        const k = blink.current
        const now = st.clock.elapsedTime
        if (now > k.at) {
          k.t = now
          k.at = now + 1.8 + Math.random() * 3.7
        }
        const x = now - k.t
        v = x < 0.07 ? x / 0.07 : x < 0.17 ? 1 - (x - 0.07) / 0.1 : 0
      }
      for (const [o, idx] of blinkTargets.current) for (const i of idx) o.morphTargetInfluences[i] = v
    }
    if (tabletObj && b.RightHand) {
      const root = model.parent
      model.updateMatrixWorld(true)
      root.worldToLocal(b.RightHand.getWorldPosition(tabletObj.position))
      tabletObj.position.x += 0.07
      tabletObj.position.y += 0.03
      tabletObj.position.z += 0.07
      tabletObj.rotation.set(sit ? -0.35 : -0.6, 0.15, 0)
    }
  })

  function pose(st, dt, b) {
    if (LOCO.has(action)) {
      gait.current ??= createGait(model, b, rest)
      gait.current.update(dt, st.clock.elapsedTime + phase * 13, { inspect: action === 'inspect', tablet })
      return
    }
    if (desk) {
      deskPose.current ??= createDeskPose(model, b, rest, SEAT_H)
      // başın karakter uzayındaki konumu (önceki kare) davranışa verilir: çene, ağız, esneme hedefleri buna göre
      const head = b.Head ? model.parent.worldToLocal(b.Head.getWorldPosition(_tv)) : null
      work.update(dt, { busy: action === 'type', head })
      deskPose.current.pose(st.clock.elapsedTime + phase * 13, dt, work.S, phase)
      work.afterPose?.(dt)
      return
    }
    if (!sit) {
      model.position.set(0, 0, 0)
      mixer.update(dt)
      return
    }
    const { clock } = st
    // Oturma / yazma / sohbet: dinlenme pozundan başlayıp her kemiği karakter uzayında hedef yöne çevir.
    // Model +Z yönüne bakar; karakterin solu +X.
    for (const [n, q] of rest) b[n]?.quaternion.copy(q)
    model.position.set(0, 0, 0)
    model.updateMatrixWorld(true)
    const t = clock.elapsedTime + phase * 13
    const typing = action === 'type'
    const chat = action === 'chat'
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
    A('Spine', mouse * -0.03, 1, (chat ? -0.06 : 0.08) - lean * 0.22 + breath)
    A('Spine1', mouse * -0.04, 1, 0.13 - lean * 0.18 + burst * 0.02)
    A('Spine2', 0, 1, 0.11 - lean * 0.1)
    for (const s of [1, -1]) {
      const L = s > 0 ? 'Left' : 'Right'
      A(`${L}UpLeg`, s * 0.08, -0.05, 1)
      A(`${L}Leg`, s * 0.02 + Math.sin(t * 0.3 + s) * 0.01, -1, 0.12)
      A(`${L}Foot`, 0, -0.35, 1)
      if (chat) {
        // sohbet: dirsekler koltuk kolunda, eller kucakta; konuşurken eller anlatır, dinlerken arada başını sallar
        const g = speaking ? (0.5 + 0.5 * Math.sin(t * (s > 0 ? 2.6 : 3.3) + s)) * (s < 0 ? 1 : 0.6) : 0
        A(`${L}Arm`, s * 0.42, -1, 0.18 + g * 0.25)
        A(`${L}ForeArm`, -s * (0.15 + g * 0.1), -0.25 + g * 0.55, 1)
        A(`${L}Hand`, -s * 0.1, -0.35 + g * 0.6, 1)
        rollPalm(b[`${L}Hand`], b[`${L}HandIndex1`], b[`${L}HandPinky1`], V(-s * 0.5, 0.8 + g, g), model, s, 0.9)
        for (const f of ['Index', 'Middle', 'Ring', 'Pinky']) {
          A(`${L}Hand${f}1`, 0, -0.4 + g * 0.3, 1, 0.8)
          A(`${L}Hand${f}2`, 0, -0.8 + g * 0.4, 1, 0.8)
        }
        continue
      }
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
    if (chat) {
      const nodL = speaking ? Math.sin(t * 3.1) * 0.05 : Math.max(0, Math.sin(t * 1.3 + phase)) ** 12 * 0.18
      A('Neck', 0, 1, 0.08)
      A('Head', Math.sin(t * 0.7) * 0.06, 1, 0.06 + nodL)
    } else {
      A('Neck', read * 0.5, 1, 0.22 - glance * 0.12 + down * 0.4)
      A('Head', read + Math.sin(t * 0.21 + phase) * 0.25 * glance + mouse * -0.04, 1, 0.2 - glance * 0.12 + down)
    }

    // kalçayı oturak yüksekliğine indir (ayaklar yere değer)
    if (!drop.current) {
      const hip = new THREE.Vector3()
      b.Hips.getWorldPosition(hip)
      drop.current = (hip.y - model.parent.getWorldPosition(new THREE.Vector3()).y) - SEAT_H - 0.08
    }
    model.position.y = -drop.current / model.parent.getWorldScale(new THREE.Vector3()).y
  }

  return (
    <group {...props}>
      <primitive object={model} />
      {tabletObj && <primitive object={tabletObj} />}
    </group>
  )
}
