// Statik gruplama (static batching): sahnedeki oda/mobilya ağaçları ~2800 ayrı mesh ve ~3000 çizim çağrısı
// üretiyordu (gölge ve AO geçişleriyle ×3). Hareket etmeyen mesh'ler burada, malzemesi (değerce aynı olanlar
// birleştirilerek) ve öznitelik yapısı aynı olanlar tek geometride birleştirilir: çizim çağrısı birkaç yüze iner.
// Dışarıda kalanlar: olay dinleyicisi olanlar (tıklanabilir), saydam malzemeler (sıralama), userData.noMerge
// işaretli ağaçlar (kesilebilen duvarlar — Cut), SkinnedMesh/InstancedMesh, görünmez olanlar.
import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const KEEP = ['position', 'normal', 'uv']

// Değerce aynı malzemeler aynı anahtarı üretir (yeni örnek yaratılan inline malzemeler tekilleşir)
function matKey(m) {
  if (m.onBeforeCompile && m.onBeforeCompile.toString().length > 40) return m.uuid // özel gölgelendirici: dokunma
  const f = (v) => (v == null ? '' : typeof v === 'object' ? v.getHexString?.() ?? v.uuid ?? '' : v)
  return [
    m.type, f(m.color), m.roughness, m.metalness, m.opacity, m.transparent, m.side, f(m.map?.uuid), f(m.emissive), m.emissiveIntensity, f(m.emissiveMap?.uuid),
    f(m.normalMap?.uuid), f(m.roughnessMap?.uuid), f(m.metalnessMap?.uuid), f(m.aoMap?.uuid), m.envMapIntensity, m.toneMapped, m.flatShading, m.vertexColors, m.alphaTest, m.depthWrite,
    m.clearcoat, m.transmission, m.ior, m.sheen, m.wireframe,
  ].join('|')
}

function prepare(mesh, root) {
  let g = mesh.geometry.clone()
  const keep = {}
  for (const n of KEEP) if (g.attributes[n]) keep[n] = g.attributes[n]
  g.attributes = keep
  for (const n of Object.keys(g.morphAttributes)) delete g.morphAttributes[n]
  g.clearGroups()
  const m = new THREE.Matrix4().copy(root.matrixWorld).invert().multiply(mesh.matrixWorld)
  g.applyMatrix4(m)
  if (m.determinant() < 0) {
    // ayna ölçek: üçgen sarımını ters çevir
    if (!g.index) g.setIndex([...Array(g.attributes.position.count).keys()])
    const ix = g.index.array
    for (let i = 0; i < ix.length; i += 3) [ix[i + 1], ix[i + 2]] = [ix[i + 2], ix[i + 1]]
    g.index.needsUpdate = true
  }
  return g
}

// Hareket etmeyen alt ağaçların dünya matrisi her karede yeniden hesaplanmasın (matrixWorldAutoUpdate=false).
// Hareketli (noMerge: kesilebilen duvar) ağaçlar ve onların atalarında güncelleme açık kalır.
function freeze(root) {
  const dynamic = new Set()
  root.traverse((o) => {
    if (o.userData?.noMerge) for (let p = o; p && p !== root.parent; p = p.parent) dynamic.add(p)
  })
  let n = 0
  const walk = (o) => {
    if (dynamic.has(o)) o.children.forEach(walk)
    else {
      o.matrixWorldAutoUpdate = false
      n++
    }
  }
  root.updateWorldMatrix(true, true)
  root.children.forEach(walk)
  return n
}

export function batchStatic(root) {
  root.updateWorldMatrix(true, true)
  const buckets = new Map()
  const removed = []
  const skip = (o) => {
    for (let p = o; p && p !== root.parent; p = p.parent) if (p.userData?.noMerge || p.visible === false) return true
    return false
  }
  root.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || o.isInstancedMesh || o.userData?.noMerge) return
    const mat = o.material
    if (Array.isArray(mat) || !mat || mat.transparent || (mat.opacity ?? 1) < 1 || mat.isShaderMaterial || mat.isMeshPhysicalMaterial && mat.transmission > 0) return
    if (o.__r3f?.eventCount > 0 || Object.keys(o.__r3f?.handlers ?? {}).length) return
    if (!o.geometry?.attributes?.position || o.geometry.morphAttributes?.position) return
    if (skip(o) || o.layers.mask !== 1) return
    const k = `${matKey(mat)}#${o.geometry.index ? 'i' : 'n'}#${KEEP.filter((n) => o.geometry.attributes[n]).join()}#${+o.castShadow}${+o.receiveShadow}#${o.renderOrder}`
    let b = buckets.get(k)
    if (!b) buckets.set(k, (b = { mat, list: [], cast: o.castShadow, recv: o.receiveShadow, order: o.renderOrder }))
    b.list.push(o)
  })
  let before = 0
  const merged = new THREE.Group()
  merged.name = 'static-batch'
  for (const b of buckets.values()) {
    before += b.list.length
    if (b.list.length < 2) continue // tek mesh: olduğu gibi kalsın
    const geos = b.list.map((o) => prepare(o, root))
    // karma indeksli / indekssiz gruplar anahtarda ayrıldı; yine de uyumsuzluk olursa bu grubu atla
    let g
    try {
      g = mergeGeometries(geos, false)
    } catch {
      g = null
    }
    geos.forEach((x) => x.dispose())
    if (!g) continue
    g.computeBoundingSphere()
    g.computeBoundingBox()
    const mesh = new THREE.Mesh(g, b.mat)
    mesh.castShadow = b.cast
    mesh.receiveShadow = b.recv
    mesh.renderOrder = b.order
    mesh.matrixAutoUpdate = false
    mesh.updateMatrix()
    merged.add(mesh)
    removed.push(...b.list)
  }
  removed.forEach((o) => o.removeFromParent())
  root.add(merged)
  return { before: before, after: merged.children.length, kept: before - removed.length, frozen: freeze(root) }
}

/** Alt ağacı yerleştikten sonra bir kez birleştirir (kalite düşükse ya da `off` ile atlanabilir) */
export function StaticBatch({ children, off = false, label = '' }) {
  const ref = useRef()
  useLayoutEffect(() => {
    if (off || (typeof location !== 'undefined' && location.search.includes('nobatch')) || !ref.current || ref.current.userData.batched) return
    ref.current.userData.batched = true
    const r = batchStatic(ref.current)
    if (import.meta.env.DEV) (window.__batch ??= {})[label || 'x'] = r
  }, [off, label])
  return <group ref={ref}>{children}</group>
}
