// Prosedürel yürüyüş ve ayakta duruş: ayak basma mantığı (ters kinematik).
// Karakterin kökü (sahnedeki grup) nereye ve ne hızla giderse gitsin, gövde hızı her karede ölçülür ve:
//  • Yere basan ayak dünyada SABİT kalır (kayma yok); gövde onun üzerinden geçer.
//  • Bir ayak, sıradaki basma noktasından yeterince uzaklaşınca adım atar; aynı anda yalnızca bir ayak havada
//    olur (çift destek anı korunur). Basma noktası, gövdenin ayak yere değdiği andaki konumu + yarım adım
//    ileriye öngörülür; durunca ayaklar omuz hizasında yan yana toplanır, yerinde dönüşte de adım atılır.
//  • Salınımda ayak yay çizer: parmak ucuyla itiş (topuk kalkık) → havada → topukla basış (parmaklar yukarı)
//    → ayak tabanı yere oturur. Arkadaki ayağın topuğu, öndeki ayak öne salınırken kalkar (parmak üstünde döner).
//  • Kalça: basan bacağın üstünde en yüksek, çift destekte en alçak (dikey salınım), basan ayağa doğru yana
//    kayma, salınan tarafın kalçası hafif düşer ve öne döner; omuzlar ters döner, kollar karşı bacakla sallanır.
//  • Bacaklar iki kemikli IK ile çözülür: diz hep ayak ucu yönüne bakar, bacak boyu aşılmaz.
import * as THREE from 'three'
import { aim, aimWorld, rollPalm, rotateWorld } from './rig.js'

const V3 = THREE.Vector3
const UP = new V3(0, 1, 0)
const AX = new V3(1, 0, 0) // karakter uzayında yana eksen (sol = +X)
const AZ = new V3(0, 0, 1) // karakter uzayında ileri
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const sm = (a, b, x) => {
  const k = clamp((x - a) / (b - a), 0, 1)
  return k * k * (3 - 2 * k)
}
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a))
const fwdOf = (yaw, out) => out.set(Math.sin(yaw), 0, Math.cos(yaw))
const leftOf = (yaw, out) => out.set(Math.cos(yaw), 0, -Math.sin(yaw))
const V = (x, y, z) => new V3(x, y, z)

export function createGait(model, b, rest) {
  const root = model.parent
  const legs = []
  const P = new V3()
  const Q = new THREE.Quaternion()
  const _f = new V3()
  const _l = new V3()
  const _n = new V3()
  const _t = new V3()
  const _r = new V3()
  const _h = new V3()
  const _k = new V3()
  const _u = new V3()
  const _pole = new V3()
  const _v = new V3()
  const st = { ready: false, prev: new V3(), vel: new V3(), m: 0, bob: 0, sway: 0, roll: 0, sinceLand: 1, idle: 0 }

  // ── Ölçüm: dinlenme pozunda bacak boyları, bilek yüksekliği, ayak yönü (kök uzayında, yüz +Z)
  {
    const saved = model.position.clone()
    for (const [n, q] of rest) b[n]?.quaternion.copy(q)
    model.position.set(0, 0, 0)
    root.updateMatrixWorld(true)
    const O = root.getWorldPosition(new V3())
    const inv = root.getWorldQuaternion(new THREE.Quaternion()).invert()
    const loc = (o) => o.getWorldPosition(new V3()).sub(O).applyQuaternion(inv)
    for (const side of ['Left', 'Right']) {
      const U = loc(b[`${side}UpLeg`])
      const K = loc(b[`${side}Leg`])
      const A = loc(b[`${side}Foot`])
      const toe = b[`${side}ToeBase`]
      const T = toe ? loc(toe) : A.clone().add(V(0, -A.y * 0.7, 0.13))
      const end = toe && toe.children.find((c) => c.isBone)
      const E = end ? loc(end) : T.clone().add(V(0, 0, 0.06))
      const fd = T.clone().sub(A)
      legs.push({
        side,
        sign: side === 'Left' ? 1 : -1,
        a: U.distanceTo(K),
        b: K.distanceTo(A),
        lat: A.x,
        fwd0: A.z,
        ankleH: A.y,
        footDir: fd.clone().normalize(),
        toeDir: E.clone().sub(T).normalize(),
        toeLen: Math.hypot(fd.x, fd.z),
        toeH: fd.y,
        plant: new V3(),
        yaw: 0,
        swing: null,
        landT: 1,
        landPitch: 0,
        heel: 0,
        g: new V3(),
        fy: 0,
        pitch: 0,
        lift: 0,
        A: new V3(),
        dir: new V3(),
      })
    }
    model.position.copy(saved)
  }
  const [Lf, Rf] = legs

  const neutral = (L, yaw, out) => out.copy(P).addScaledVector(leftOf(yaw, _l), L.lat).addScaledVector(fwdOf(yaw, _f), L.fwd0).setY(P.y)
  // Adımın yere değeceği nokta: o andaki nötr konum + kalan süre boyunca gövdenin gideceği yol + yarım adım
  const target = (L, yaw, remain, dur, out) => {
    neutral(L, yaw, out).addScaledVector(st.vel, remain)
    // yarım adım öne: gövdenin önüne en fazla bacak boyunun ~%45'i kadar basılır
    const sp = st.vel.length()
    if (sp > 1e-3) out.addScaledVector(st.vel, Math.min(0.5 * dur * st.m * sp, (L.a + L.b) * 0.45) / sp)
    return out.setY(P.y)
  }

  function reset(yaw) {
    for (const L of legs) {
      neutral(L, yaw, L.plant)
      L.yaw = yaw
      L.swing = null
      L.landT = 1
      L.landPitch = 0
      L.heel = 0
    }
    st.prev.copy(P)
    st.vel.set(0, 0, 0)
    st.m = 0
    st.sinceLand = 1
  }

  // Zemin noktası + ayak açısı + eğim → bilek hedefi ve ayak yönü (topuk kalkınca parmak ucunda döner)
  function ankleFrom(L) {
    const f = fwdOf(L.fy, _f)
    const lat = leftOf(L.fy, _l)
    L.A.copy(L.g).setY(P.y + L.ankleH + L.lift)
    if (L.pitch > 0) {
      _t.copy(L.A).addScaledVector(f, L.toeLen)
      _t.y += L.toeH
      _r.copy(L.A).sub(_t).applyAxisAngle(lat, L.pitch)
      L.A.copy(_t).add(_r)
    }
    L.dir.copy(L.footDir).applyAxisAngle(UP, L.fy).applyAxisAngle(lat, L.pitch)
  }

  // İki kemikli bacak IK'sı: kalça → diz → bilek, diz `kneeDir` yönüne bakar
  function solveLeg(L, kneeDir) {
    const up = b[`${L.side}UpLeg`]
    const kn = b[`${L.side}Leg`]
    const ft = b[`${L.side}Foot`]
    const H = up.getWorldPosition(_h)
    _u.copy(L.A).sub(H)
    const dist = _u.length()
    _u.divideScalar(dist || 1)
    const d = clamp(dist, Math.abs(L.a - L.b) + 0.02, (L.a + L.b) * 0.999)
    const T = _t.copy(H).addScaledVector(_u, d)
    _pole.copy(kneeDir).addScaledVector(_u, -kneeDir.dot(_u)).normalize()
    const cosA = clamp((L.a * L.a + d * d - L.b * L.b) / (2 * L.a * d), -1, 1)
    const K = _k.copy(H).addScaledVector(_u, L.a * cosA).addScaledVector(_pole, L.a * Math.sqrt(1 - cosA * cosA))
    aimWorld(up, _r.copy(K).sub(H))
    kn.getWorldPosition(K)
    aimWorld(kn, _r.copy(T).sub(K))
    aimWorld(ft, L.dir)
    // topuk kalkıkken parmaklar yerde düz kalır
    const toe = b[`${L.side}ToeBase`]
    if (toe && L.pitch > 0.02) aimWorld(toe, _r.copy(L.toeDir).applyAxisAngle(UP, L.fy))
  }

  /**
   * o.inspect: denetim duruşu (etrafı tarar, tablete bakar, ara sıra eliyle gösterir)
   * o.tablet: sağ el tablet tutar (o kol sallanmaz)
   */
  function update(dt, t, o = {}) {
    dt = clamp(dt, 1e-4, 0.05)
    for (const [n, q] of rest) b[n]?.quaternion.copy(q)
    model.position.set(0, 0, 0)
    root.updateMatrixWorld(true)
    root.getWorldPosition(P)
    root.getWorldQuaternion(Q)
    _v.set(0, 0, 1).applyQuaternion(Q)
    const yaw = Math.atan2(_v.x, _v.z)
    if (!st.ready || P.distanceTo(st.prev) > 1) {
      reset(yaw)
      st.ready = true
    }

    // gövde hızı (kök hareketinden)
    _v.copy(P).sub(st.prev).divideScalar(dt).setY(0)
    st.prev.copy(P)
    st.vel.lerp(_v, 1 - Math.exp(-dt * 10))
    const speed = st.vel.length()
    st.m += (sm(0.06, 0.6, speed) - st.m) * (1 - Math.exp(-dt * 6))
    const m = st.m
    const moving = speed > 0.12
    st.idle = moving ? 0 : st.idle + dt
    const stepDur = 0.56 - 0.08 * clamp(speed / 1.4, 0, 1)
    const fwd = fwdOf(yaw, new V3())
    const left = leftOf(yaw, new V3())

    // ── 1) Adım kararı: havada ayak yoksa ve son basıştan beri çift destek süresi geçtiyse
    st.sinceLand += dt
    if (!legs.some((L) => L.swing) && st.sinceLand > (moving ? 0.035 : 0.12)) {
      const dur = moving ? stepDur : 0.4
      let best = null
      let bestScore = 1
      for (const L of legs) {
        if (moving && L.landT < 0.12) continue // yeni basan ayak hemen kalkmaz
        target(L, yaw, dur, dur, _n)
        const d = Math.hypot(L.plant.x - _n.x, L.plant.z - _n.z)
        const thr = moving ? Math.max(0.08, 1.35 * speed * dur) : st.idle > 0.6 ? 0.055 : 0.12
        const yawErr = Math.abs(wrap(L.yaw - yaw))
        const score = Math.max(d / thr, yawErr / (moving ? 0.4 : 0.5))
        if (score >= bestScore) {
          bestScore = score
          best = L
        }
      }
      if (best) best.swing = { t: 0, dur, from: best.plant.clone(), yaw0: best.yaw, heel0: best.heel }
    }

    // ── 2) Salınan ayak: yay çizerek hedefe (hedef her karede güncellenir: dönüş/duruş anında doğru yere basar)
    for (const L of legs) {
      const s = L.swing
      if (!s) continue
      s.t += dt / s.dur
      const p = Math.min(1, s.t)
      const e = p * p * (3 - 2 * p)
      target(L, yaw, (1 - p) * s.dur, s.dur, _n)
      L.g.lerpVectors(s.from, _n, e)
      const amp = s.dur > 0.45 || m > 0.3 ? 0.03 + 0.06 * m : 0.025
      L.lift = amp * Math.sin(Math.PI * Math.pow(p, 0.8))
      L.fy = s.yaw0 + wrap(yaw - s.yaw0) * e
      L.pitch = (s.heel0 + (0.62 * m - s.heel0) * sm(0, 0.18, p)) * (1 - sm(0.18, 0.5, p)) - 0.3 * m * sm(0.55, 0.95, p)
      if (p >= 1) {
        L.plant.copy(_n).setY(P.y)
        L.yaw = L.fy
        L.landPitch = L.pitch
        L.landT = 0
        L.heel = 0
        L.lift = 0
        L.swing = null
        st.sinceLand = 0
      }
    }

    // ── 3) Basan ayak: dünyada sabit; topukla basıştan sonra taban yere oturur, karşı ayak öne geçerken topuk kalkar
    for (const L of legs) {
      if (L.swing) continue
      const other = L === Lf ? Rf : Lf
      L.landT += dt
      const heelT = other.swing ? m * 0.5 * sm(0.3, 1, Math.min(1, other.swing.t)) : m > 0.3 ? L.heel : 0
      L.heel += (heelT - L.heel) * (heelT > L.heel ? 1 : 1 - Math.exp(-dt * 8))
      L.g.copy(L.plant)
      L.lift = 0
      L.fy = L.yaw
      L.pitch = L.heel > 0.01 ? L.heel : L.landPitch * (1 - sm(0, 0.13, L.landT))
    }

    // ── 4) Kalça: dikey salınım + basan ayağa yana kayma
    const sw = legs.find((L) => L.swing)
    const q = sw ? Math.min(1, sw.swing.t) : 0
    const bobT = -(0.016 + 0.032 * m) + 0.03 * m * Math.sin(Math.PI * q) + (1 - m) * Math.sin(t * 1.5) * 0.003
    st.bob += (bobT - st.bob) * (1 - Math.exp(-dt * 16))
    const stance = sw ? (sw === Lf ? Rf : Lf) : null
    const swayT = stance ? stance.sign * 0.024 * m * Math.sin(Math.PI * q) : (1 - m) * 0.01 * Math.sin(t * 0.37)
    st.sway += (swayT - st.sway) * (1 - Math.exp(-dt * 10))
    model.position.set(st.sway, st.bob, 0)
    root.updateMatrixWorld(true)

    for (const L of legs) ankleFrom(L)
    const dRel = clamp(((Lf.A.x - Rf.A.x) * fwd.x + (Lf.A.z - Rf.A.z) * fwd.z) / 0.6, -1, 1) // + : sol ayak önde

    // ── 5) Gövde: kalça dönüşü/eğimi, omuzların ters dönüşü, hafif öne eğilme
    const rollT = sw ? -sw.sign * 0.05 * m * Math.sin(Math.PI * q) : 0
    st.roll += (rollT - st.roll) * (1 - Math.exp(-dt * 12))
    rotateWorld(b.Hips, UP, -0.14 * m * dRel, model)
    rotateWorld(b.Hips, AZ, st.roll, model)
    if (b.Spine) {
      rotateWorld(b.Spine, AZ, -st.roll * 0.9, model)
      rotateWorld(b.Spine, AX, 0.045 * m + 0.01 * Math.sin(t * 1.5) * (1 - m), model)
    }
    if (b.Spine1) rotateWorld(b.Spine1, UP, 0.22 * m * dRel, model)

    // ── 6) Kollar: karşı bacakla sallanır (sol ayak önde → sağ kol önde); tablet tutan kol bükülü
    const point = o.inspect ? sm(0.75, 0.95, Math.sin(t * 0.33 + 1.3)) : 0
    for (const L of legs) {
      const s = L.sign
      const S = L.side
      const palm = (want, w = 1) => rollPalm(b[`${S}Hand`], b[`${S}HandIndex1`], b[`${S}HandPinky1`], want, model, s, w)
      if (o.tablet && s < 0) {
        aim(b[`${S}Arm`], V(s * 0.16, -1, 0.22), model)
        aim(b[`${S}ForeArm`], V(-s * 0.35, -0.05, 1), model)
        aim(b[`${S}Hand`], V(-s * 0.25, 0.02, 1), model)
        palm(V(0, 1, -0.15))
        continue
      }
      const swing = -s * dRel * 0.55 * m
      if (point > 0.01 && s > 0) {
        // denetimde ara sıra eliyle masaları gösterir
        aim(b[`${S}Arm`], V(s * 0.25, -1 + point * 0.95, swing + point * 0.9), model)
        aim(b[`${S}ForeArm`], V(s * 0.1, -1 + point * 1.0, swing + 0.2 + point * 0.9), model)
        aim(b[`${S}Hand`], V(s * 0.05, -1 + point * 0.95, swing + 0.15 + point), model)
        continue
      }
      aim(b[`${S}Arm`], V(s * 0.11, -1, swing * 0.8), model)
      aim(b[`${S}ForeArm`], V(s * 0.03, -1, swing + 0.22 + Math.max(0, swing) * 0.7), model)
      aim(b[`${S}Hand`], V(s * 0.02, -1, swing + 0.2), model)
      palm(V(-s, 0, -0.25)) // avuç uyluğa dönük
      for (const f of ['Index', 'Middle', 'Ring', 'Pinky']) {
        aim(b[`${S}Hand${f}1`], V(-s * 0.3, -1, swing * 0.5), model, 0.8)
        aim(b[`${S}Hand${f}2`], V(-s * 0.6, -1, swing * 0.5), model, 0.8)
      }
    }

    // ── 7) Baş: yürürken ileri bakar; durunca etrafa göz gezdirir; denetimde odayı tarar ve tablete bakar
    const tabletLook = o.inspect ? sm(0.25, 0.85, Math.sin(t * 0.47)) : 0
    const look = o.inspect ? 0.6 * Math.sin(t * 0.55) * (1 - tabletLook) * (1 - point * 0.5) : (1 - m) * 0.25 * Math.sin(t * 0.23)
    const nod = o.inspect ? tabletLook * 0.42 + 0.06 * Math.max(0, Math.sin(t * 2.1)) ** 8 : 0
    aim(b.Neck, V(0, 1, 0.05 + 0.03 * m), model)
    aim(b.Head, V(0, 1, 0.09), model)
    if (b.Neck) rotateWorld(b.Neck, UP, look * 0.35, model)
    rotateWorld(b.Head, UP, look * 0.65, model)
    rotateWorld(b.Head, AX, nod, model)

    // ── 8) Bacaklar (en son: kalça ve gövde konumu kesinleşti)
    for (const L of legs) {
      fwdOf(yaw + wrap(L.fy - yaw) * 0.6, _pole).addScaledVector(left, L.sign * 0.12).normalize()
      solveLeg(L, _pole.clone())
    }
    return { speed, m }
  }

  const api = { update, reset: () => (st.ready = false), legs, st, P }
  if (import.meta.env.DEV) (window.__gaits ??= []).push(api)
  return api
}
