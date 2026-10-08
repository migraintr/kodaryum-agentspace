// Masa başı oturuş pozu (work.js durumundan her karede kurulur):
//  · Gövde: oturuş + öne eğilme / arkaya yaslanma, fareye uzanırken hafif dönüş, nefes; bacaklarda küçük kıpırtı.
//  · Kollar: iki kemikli IK (omuz → dirsek → bilek); bilek, work.js'in verdiği hedefe (klavyede ana sıra, fare,
//    çene, kupa…) gider; dirsek verilen yöne bakar. Uzanırken köprücük kemiği öne kayar.
//  · El: ön kol + bilek burulmasıyla avuç istenen yöne döner (klavyede aşağı, kupada içe); el, parmak köklerine
//    doğru yönelir. Parmaklar eklem eklem bükülür; tuş vuruşu işaret/orta/yüzük/serçe/başparmakta ayrı ayrı.
//  · Baş ve gözler: baş, bakış noktasını yaylı ve gecikmeli izler (boyun %40, baş kalanı); gözler noktaya
//    hemen sıçrar (sakkad). Kadın modelinde göz kırpma.
import * as THREE from 'three'
import { aim, aimWorld, childOf, rollPalm, rotateWorld } from './rig.js'

const V3 = THREE.Vector3
const Y = new V3(0, 1, 0)
const Z = new V3(0, 0, 1)
const FINGERS = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']
// büküm ve vuruşun eklemlere dağılımı (kök · orta · uç)
const CURL_W = [
  [0.3, 0.55, 0.45],
  [1, 1.1, 0.7],
  [1, 1.1, 0.7],
  [1, 1.1, 0.7],
  [1, 1.1, 0.7],
]
const PRESS_W = [
  [0.32, 0.22, 0.1],
  [0.42, 0.2, 0.1],
  [0.42, 0.2, 0.1],
  [0.4, 0.2, 0.1],
  [0.4, 0.2, 0.1],
]
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a))

/** seatH: sandalye oturak yüksekliği (kalça bunun ~8 cm üstüne iner) */
export function createDeskPose(model, b, rest, seatH = 0.5) {
  const root = model.parent
  const arm = {}
  const restInv = new Map()
  let hipY = 0
  // ── ölçüm (dinlenme pozunda): kol boyları, başın/gözlerin dinlenme yönü, kalça yüksekliği
  {
    for (const [n, q] of rest) b[n]?.quaternion.copy(q)
    model.position.set(0, 0, 0)
    root.updateMatrixWorld(true)
    const rq = root.getWorldQuaternion(new THREE.Quaternion()).invert()
    for (const side of ['Left', 'Right']) {
      const A = b[`${side}Arm`].getWorldPosition(new V3())
      const F = b[`${side}ForeArm`].getWorldPosition(new V3())
      const H = b[`${side}Hand`].getWorldPosition(new V3())
      arm[side] = { a: A.distanceTo(F), b: F.distanceTo(H) }
    }
    for (const n of ['Head', 'LeftEye', 'RightEye']) {
      if (!b[n]) continue
      restInv.set(n, rq.clone().multiply(b[n].getWorldQuaternion(new THREE.Quaternion())).invert())
    }
    hipY = root.worldToLocal(b.Hips.getWorldPosition(new V3())).y
  }
  const drop = hipY - seatH - 0.08

  const _a = new V3()
  const _b = new V3()
  const _h = new V3()
  const _t = new V3()
  const _tc = new V3()
  const _u = new V3()
  const _e = new V3()
  const _r = new V3()
  const _p = new V3()
  const _i = new V3()
  const _k = new V3()
  const _n = new V3()
  const _ax = new V3()
  const _f = new V3()
  const _l = new V3()
  const _d = new V3()
  const _hp = new V3()
  const _q = new THREE.Quaternion()
  const _qa = new THREE.Quaternion()
  const _pw = new THREE.Quaternion()
  const _pi = new THREE.Quaternion()
  const _rq = new THREE.Quaternion()
  const _rqi = new THREE.Quaternion()
  const gaze = new V3(0, 1, 0.8)
  let ready = false

  const A = (n, x, y, z, w) => aim(b[n], _d.set(x, y, z), model, w)
  // kemiği DÜNYA uzayındaki bir eksen etrafında döndür
  function turn(bone, axis, angle) {
    bone.parent.getWorldQuaternion(_pw)
    _pi.copy(_pw).invert()
    _qa.setFromAxisAngle(axis, angle)
    bone.quaternion.premultiply(_pi.multiply(_qa).multiply(_pw))
    bone.updateMatrixWorld(true)
  }
  // kemiğin karakter uzayındaki bakış yönü (dinlenmede +Z)
  function facing(n, out) {
    b[n].getWorldQuaternion(_q).premultiply(_rqi)
    return out.copy(Z).applyQuaternion(restInv.get(n)).applyQuaternion(_q)
  }
  const yawOf = (v) => Math.atan2(v.x, v.z)
  const pitchOf = (v) => Math.atan2(-v.y, Math.hypot(v.x, v.z)) // + aşağı

  // ── kol IK'sı: bilek hedefi + dirsek yönü (karakter uzayında)
  function reach(side, s, h) {
    const L = arm[side]
    const Arm = b[`${side}Arm`]
    const Fore = b[`${side}ForeArm`]
    const Hand = b[`${side}Hand`]
    // köprücük: ileri uzanırken öne, kollar yukarıdayken yukarı
    const sh = b[`${side}Shoulder`]
    if (sh) {
      const fwd = clamp((h.pos.z - 0.24) * 0.7, 0, 0.14)
      const up = clamp((h.pos.y - 1.25) * 0.5, 0, 0.25)
      if (fwd) rotateWorld(sh, Y, -s * fwd, root)
      if (up) rotateWorld(sh, Z, s * up, root)
    }
    const T = root.localToWorld(_t.copy(h.pos))
    const pole = _p.copy(h.pole).applyQuaternion(_rq)
    const H = Arm.getWorldPosition(_h)
    _u.subVectors(T, H)
    const dist = _u.length()
    _u.divideScalar(dist || 1)
    const d = clamp(dist, Math.abs(L.a - L.b) + 0.02, (L.a + L.b) * 0.998)
    _tc.copy(H).addScaledVector(_u, d)
    pole.addScaledVector(_u, -pole.dot(_u)).normalize()
    const cosA = clamp((L.a * L.a + d * d - L.b * L.b) / (2 * L.a * d), -1, 1)
    _e.copy(H).addScaledVector(_u, L.a * cosA).addScaledVector(pole, L.a * Math.sqrt(1 - cosA * cosA))
    aimWorld(Arm, _r.subVectors(_e, H))
    Fore.getWorldPosition(_e)
    aimWorld(Fore, _r.subVectors(_tc, _e))
    // burulma ön kol ile bilek arasında paylaşılır; sonra el parmak köklerine yönelir ve avuç döner
    const idx = b[`${side}HandIndex1`]
    const pky = b[`${side}HandPinky1`]
    rollPalm(Fore, idx, pky, h.palm, root, s, 0.55)
    aimWorld(Hand, _r.copy(h.dir).applyQuaternion(_rq))
    rollPalm(Hand, idx, pky, h.palm, root, s, 1)
  }

  // ── parmaklar: her eklem avuca doğru bükülür (+ tuş vuruşu); başparmak avuç içine/aşağı
  function fingers(side, s, h) {
    const hand = b[`${side}Hand`]
    const idx = b[`${side}HandIndex1`]
    const pky = b[`${side}HandPinky1`]
    if (!idx || !pky) return
    hand.getWorldPosition(_a)
    idx.getWorldPosition(_i).sub(_a)
    pky.getWorldPosition(_k).sub(_a)
    _n.crossVectors(_i, _k).multiplyScalar(-s).normalize() // avuç yönü
    // avuç merkezi + yönü karakter uzayında (kupa gibi tutulan eşyalar buna oturur)
    h.palmAt.copy(_i).add(_k).multiplyScalar(0.5 * 0.85).add(_a)
    root.worldToLocal(h.palmAt)
    h.palmN.copy(_n).applyQuaternion(_rqi)
    const across = _k.sub(_i).normalize() // işaretten serçeye
    for (let f = 0; f < 5; f++) {
      const c = h.curl[f]
      const pr = h.press[f]
      for (let j = 1; j <= 3; j++) {
        const bone = b[`${side}Hand${FINGERS[f]}${j}`]
        if (!bone) continue
        const ang = c * CURL_W[f][j - 1] + pr * PRESS_W[f][j - 1]
        if (Math.abs(ang) < 1e-3) continue
        bone.getWorldPosition(_a)
        const kid = childOf(bone)
        if (kid) kid.getWorldPosition(_b).sub(_a)
        else _b.copy(_a).sub(bone.parent.getWorldPosition(_r))
        _ax.copy(_n)
        if (f === 0) _ax.addScaledVector(across, 0.6) // başparmak avucun içine doğru kıvrılır
        _ax.crossVectors(_b, _ax).normalize()
        turn(bone, _ax, ang)
      }
    }
  }

  // ── bakış: boyun + baş (yaylı hedef), gözler (anlık hedef)
  function lookBone(n, w, yawD, pitD) {
    facing('Head', _f)
    const yf = yawOf(_f)
    const dy = wrap(yawD - yf) * w
    const dp = (pitD - pitchOf(_f)) * w
    rotateWorld(b[n], Y, dy, root)
    _l.set(Math.cos(yf + dy), 0, -Math.sin(yf + dy))
    rotateWorld(b[n], _l, dp, root)
  }
  function look(target, raw, tilt) {
    root.worldToLocal(b.Head.getWorldPosition(_hp))
    _d.subVectors(target, _hp)
    const yawD = clamp(yawOf(_d), -1.15, 1.15)
    const pitD = clamp(pitchOf(_d), -0.6, 0.75)
    if (b.Neck) lookBone('Neck', 0.4, yawD, pitD)
    lookBone('Head', 1, yawD, pitD + tilt)
    for (const n of ['LeftEye', 'RightEye']) {
      const e = b[n]
      if (!e) continue
      root.worldToLocal(e.getWorldPosition(_a))
      _d.subVectors(raw, _a)
      facing(n, _f)
      const yf = yawOf(_f)
      const dy = clamp(wrap(yawOf(_d) - yf), -0.45, 0.45)
      const dp = clamp(pitchOf(_d) - pitchOf(_f), -0.35, 0.35)
      rotateWorld(e, Y, dy, root)
      _l.set(Math.cos(yf + dy), 0, -Math.sin(yf + dy))
      rotateWorld(e, _l, dp, root)
    }
  }

  /** S: work.S · t: zaman · phase: kişiye özgü kayma */
  function pose(t, dt, S, phase = 0) {
    for (const [n, q] of rest) b[n]?.quaternion.copy(q)
    model.position.set(0, -drop, 0)
    root.updateMatrixWorld(true)
    root.getWorldQuaternion(_rq)
    _rqi.copy(_rq).invert()

    // gövde
    const lean = S.lean
    const breath = Math.sin(t * 1.5) * 0.012
    A('Spine', 0, 1, 0.08 + (lean > 0 ? lean * 0.1 : lean * 0.2) + breath)
    A('Spine1', 0, 1, 0.12 + (lean > 0 ? lean * 0.08 : lean * 0.16))
    A('Spine2', 0, 1, 0.1 + (lean > 0 ? lean * 0.05 : lean * 0.1))
    if (Math.abs(S.twist) > 1e-3) {
      rotateWorld(b.Spine1, Y, S.twist * 0.5, root)
      rotateWorld(b.Spine2, Y, S.twist * 0.5, root)
    }
    // bacaklar: oturuş + yavaş kıpırtı (ayak bileği/diz)
    for (const s of [1, -1]) {
      const L = s > 0 ? 'Left' : 'Right'
      const fid = Math.sin(t * 0.23 + s * 1.7 + phase * 5) * 0.03
      A(`${L}UpLeg`, s * 0.08 + fid * 0.5, -0.05, 1)
      A(`${L}Leg`, s * 0.02 + Math.sin(t * 0.3 + s) * 0.01, -1, 0.12 + fid)
      A(`${L}Foot`, 0, -0.35, 1)
    }

    // kollar ve eller
    reach('Left', 1, S.L)
    reach('Right', -1, S.R)
    fingers('Left', 1, S.L)
    fingers('Right', -1, S.R)

    // baş: hedef yaylı izlenir (göz önce sıçrar, baş ~0,15 sn gecikmeyle döner)
    if (!ready) {
      gaze.copy(S.gaze)
      ready = true
    }
    gaze.lerp(S.gaze, 1 - Math.exp(-dt * 7))
    look(gaze, S.gaze, S.tilt)
  }

  return { pose, drop }
}
