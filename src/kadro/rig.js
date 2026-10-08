// Karakter iskeleti yardımcıları: Mixamo uyumlu iskeletler arası animasyon aktarımı ve poz kurma.
// Aktarım her kemiğin dinlenme pozuna göre fark alır: q_hedef = dinlenme_hedef · dinlenme_kaynak⁻¹ · q_kaynak
import * as THREE from 'three'

export const baseName = (n) => n.replace(/^mixamorig:?/, '')

// Kemiğin "uzandığı" çocuk: baş → HeadTop/Neck zinciri, el → orta parmak (gözler, başparmak değil)
const PREFER = { Head: /HeadTop/, Hand: /HandMiddle1|HandIndex1/ }
export function childOf(b) {
  const kids = b.children.filter((c) => c.isBone)
  const key = Object.keys(PREFER).find((k) => baseName(b.name).endsWith(k))
  if (key) return kids.find((c) => PREFER[key].test(c.name)) ?? (key === 'Head' ? null : kids[0])
  return kids[0]
}

export function restMap(root) {
  const m = new Map()
  root.traverse((o) => o.isBone && m.set(baseName(o.name), o.quaternion.clone()))
  return m
}

export function prefixOf(root) {
  let p = ''
  root.traverse((o) => {
    if (o.isBone && /Hips$/.test(o.name)) p = o.name.replace(/Hips$/, '')
  })
  return p
}

const qa = new THREE.Quaternion()
const qb = new THREE.Quaternion()

export function retargetClip(clip, srcRest, dstRest, dstPrefix) {
  const tracks = []
  for (const t of clip.tracks) {
    const [node, prop] = t.name.split('.')
    if (prop !== 'quaternion') continue
    const bone = baseName(node)
    const rs = srcRest.get(bone)
    const rd = dstRest.get(bone)
    if (!rs || !rd) continue
    const inv = rs.clone().invert()
    const values = t.values.slice()
    for (let i = 0; i < values.length; i += 4) {
      qa.fromArray(values, i)
      qb.copy(rd).multiply(inv).multiply(qa)
      qb.toArray(values, i)
    }
    tracks.push(new THREE.QuaternionKeyframeTrack(`${dstPrefix}${bone}.quaternion`, t.times, values))
  }
  return new THREE.AnimationClip(clip.name, clip.duration, tracks)
}

/** Ayak ucu ile baş üstü arası yükseklik (deri ağının sınır kutusu güvenilir değil) */
export function boneHeight(root, prefix) {
  root.updateMatrixWorld(true)
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const top = root.getObjectByName(`${prefix}HeadTop_End`)
  ;(top ?? root.getObjectByName(`${prefix}Head`)).getWorldPosition(a)
  ;(root.getObjectByName(`${prefix}LeftToeBase`) ?? root.getObjectByName(`${prefix}LeftFoot`)).getWorldPosition(b)
  return (a.y - b.y) * (top ? 1 : 1.085) // HeadTop_End yoksa baş ortasından tepeye ≈ %8.5
}

/**
 * Dünya eksenli poz uygulama: kemiği, karakterin kendi uzayında verilen eksen etrafında döndürür.
 * Böylece farklı yerel eksenli iskeletlerde aynı poz tanımı çalışır.
 */
const wq = new THREE.Quaternion()
const pq = new THREE.Quaternion()
const ax = new THREE.Vector3()
export function rotateWorld(bone, axis, angle, root) {
  bone.parent.getWorldQuaternion(pq)
  root.getWorldQuaternion(wq)
  ax.copy(axis).applyQuaternion(wq) // karakter uzayı → dünya
  ax.applyQuaternion(pq.clone().invert()) // dünya → ebeveyn uzayı
  bone.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(ax.normalize(), angle))
  bone.updateMatrixWorld(true)
}

/**
 * Dünya uzayında aktarım: kaynak animasyonun her karesinde, her kemiğin dinlenme pozuna göre dünya
 * dönüş farkı hedef kemiğe uygulanır. Dinlenme pozları (T/A) ve yerel eksenler farklı olsa da doğru çalışır.
 * Sonuç, hedef iskelet için 30 fps örneklenmiş bir klip.
 */
export function bakeRetarget(clip, srcRoot, dstRoot, fps = 30) {
  const sp = prefixOf(srcRoot)
  const dp = prefixOf(dstRoot)
  const pairs = []
  // Hedef karakter bir grubun içinde yön çevirmiş (rotation-y) olabilir; aktarım her zaman karakterin kendi
  // uzayında yapılır (kaynak ile aynı çerçeve). Aksi halde bacak/gövde salınımı yönle birlikte yan yatar.
  const rInv = dstRoot.getWorldQuaternion(new THREE.Quaternion()).invert()
  dstRoot.traverse((d) => {
    if (!d.isBone) return
    const s = srcRoot.getObjectByName(sp + baseName(d.name))
    if (s) pairs.push({ s, d, name: baseName(d.name), values: [] })
  })
  const srcRest = new Map()
  const dstRest = new Map()
  const saveS = new Map()
  const saveD = new Map()
  srcRoot.updateMatrixWorld(true)
  dstRoot.updateMatrixWorld(true)
  // Kemik yönü (kemikten ilk çocuğa) dünya uzayında
  const dir = (b) => {
    const c = childOf(b)
    if (!c) return null
    const a = b.getWorldPosition(new THREE.Vector3())
    return c.getWorldPosition(new THREE.Vector3()).sub(a).normalize()
  }
  const dirIn = (b, inv) => dir(b)?.applyQuaternion(inv) ?? null
  for (const p of pairs) {
    srcRest.set(p.name, p.s.getWorldQuaternion(new THREE.Quaternion()))
    // Dinlenme pozları farklıysa (T / A): hedef kemiği kaynak kemiğin yönüne hizalayan dönüşle düzelt
    const wd = p.d.getWorldQuaternion(new THREE.Quaternion()).premultiply(rInv)
    const ds = dir(p.s)
    const dd = dirIn(p.d, rInv)
    if (ds && dd && /Shoulder|Arm|Hand$/.test(p.name)) wd.premultiply(new THREE.Quaternion().setFromUnitVectors(dd, ds))
    dstRest.set(p.name, wd)
    saveS.set(p.s, p.s.quaternion.clone())
    saveD.set(p.d, p.d.quaternion.clone())
  }
  // Kalça: kaynaktaki dikey iniş-çıkış, bacak boyu oranında ölçeklenip hedefe aktarılır (ileri kayma yok)
  const sHip = srcRoot.getObjectByName(sp + 'Hips')
  const dHip = dstRoot.getObjectByName(dp + 'Hips')
  const sHip0 = sHip?.getWorldPosition(new THREE.Vector3())
  const dHip0 = dHip?.getWorldPosition(new THREE.Vector3())
  const legOf = (root, pre, hip) => {
    const f = root.getObjectByName(pre + 'LeftFoot')
    return f && hip ? hip.y - f.getWorldPosition(new THREE.Vector3()).y : 1
  }
  const ratio = sHip && dHip ? legOf(dstRoot, dp, dHip0) / legOf(srcRoot, sp, sHip0) : 1
  const hipValues = []
  const hp = new THREE.Vector3()
  const mixer = new THREE.AnimationMixer(srcRoot)
  const action = mixer.clipAction(clip).play()
  const n = Math.max(2, Math.round(clip.duration * fps) + 1)
  const times = []
  const ws = new THREE.Quaternion()
  const pw = new THREE.Quaternion()
  const tw = new THREE.Quaternion()
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * clip.duration
    times.push(t)
    mixer.setTime(t)
    srcRoot.updateMatrixWorld(true)
    // hiyerarşi sırası (traverse önce ebeveyn) korunur
    for (const p of pairs) {
      p.s.getWorldQuaternion(ws)
      // D = Ws(t) · Ws_rest⁻¹  →  hedef dünya = D · Wd_rest
      tw.copy(ws).multiply(srcRest.get(p.name).clone().invert()).multiply(dstRest.get(p.name))
      p.d.parent.getWorldQuaternion(pw).premultiply(rInv)
      p.d.quaternion.copy(pw.invert().multiply(tw))
      p.d.updateMatrixWorld(true)
      p.values.push(...p.d.quaternion.toArray())
    }
    if (sHip && dHip) {
      const dy = sHip.getWorldPosition(hp).y - sHip0.y
      hp.copy(dHip0).setY(dHip0.y + dy * ratio)
      dHip.parent.worldToLocal(hp)
      hipValues.push(hp.x, hp.y, hp.z)
    }
  }
  action.stop()
  mixer.uncacheRoot(srcRoot)
  for (const [b, q] of saveS) b.quaternion.copy(q)
  for (const [b, q] of saveD) b.quaternion.copy(q)
  srcRoot.updateMatrixWorld(true)
  dstRoot.updateMatrixWorld(true)
  const tracks = pairs.map((p) => new THREE.QuaternionKeyframeTrack(`${dp}${p.name}.quaternion`, times, p.values))
  if (hipValues.length) tracks.push(new THREE.VectorKeyframeTrack(`${dp}Hips.position`, times, hipValues))
  return new THREE.AnimationClip(clip.name, clip.duration, tracks)
}

/** Kemiği, ilk çocuğuna doğru olan yönü karakter uzayında `target` yönüne bakacak şekilde çevirir (poz tanımı iskeletten bağımsız) */
const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const _q = new THREE.Quaternion()
const _w = new THREE.Quaternion()
export function aim(bone, target, root, blend = 1) {
  const child = bone && childOf(bone)
  if (!child) return
  bone.getWorldPosition(_a)
  child.getWorldPosition(_b)
  const cur = _b.sub(_a).normalize()
  root.getWorldQuaternion(_w)
  const want = target.clone().normalize().applyQuaternion(_w)
  _q.setFromUnitVectors(cur, want)
  if (blend < 1) _q.slerp(new THREE.Quaternion(), 1 - blend)
  // dünya dönüşünü yerel uzaya çevir: q_local' = P⁻¹ · R · P · q_local
  bone.parent.getWorldQuaternion(_w)
  const p = _w.clone()
  bone.quaternion.premultiply(p.clone().invert().multiply(_q).multiply(p))
  bone.updateMatrixWorld(true)
}

/**
 * Kemiği kendi uzanma ekseni etrafında çevirir (bilek/ön kol burulması): `ref` nesnesinin (ör. başparmak)
 * eksene dik yönü, karakter uzayındaki `want` yönüne döner. aim() yönü, roll() avucun bakışını belirler.
 */
const _c = new THREE.Vector3()
const _d = new THREE.Vector3()
export function roll(bone, ref, want, root, blend = 1) {
  const child = bone && childOf(bone)
  if (!child || !ref) return
  bone.getWorldPosition(_a)
  child.getWorldPosition(_b)
  const axis = _b.sub(_a).normalize()
  ref.getWorldPosition(_c).sub(_a)
  _c.addScaledVector(axis, -_c.dot(axis)).normalize()
  root.getWorldQuaternion(_w)
  _d.copy(want).applyQuaternion(_w)
  _d.addScaledVector(axis, -_d.dot(axis)).normalize()
  let ang = Math.acos(Math.min(1, Math.max(-1, _c.dot(_d))))
  if (_c.clone().cross(_d).dot(axis) < 0) ang = -ang
  _q.setFromAxisAngle(axis, ang * blend)
  bone.parent.getWorldQuaternion(_w)
  const p = _w.clone()
  bone.quaternion.premultiply(p.clone().invert().multiply(_q).multiply(p))
  bone.updateMatrixWorld(true)
}
