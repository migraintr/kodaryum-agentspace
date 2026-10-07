/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  KKM — OFİS KİTİ (GPU Instancing Altyapısı)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Sahnede ~99 agent, her birinin masası, sandalyesi, monitörü, avatarı; ayrıca
 *  cam bölmeler, bitkiler, kitaplıklar… toplam ~10.000 parça var. Her parçayı
 *  ayrı mesh olarak çizmek ~10.000 draw call demektir (akıcılık ölür).
 *
 *  Çözüm: Aynı geometri + malzemeyi paylaşan parçalar tek bir InstancedMesh ile
 *  çizilir (drei `createInstances`). Böylece tüm ofis ~25 draw call'a iner.
 *
 *  Kullanım: <OfficeKit> sahneyi sarar; içerideki herhangi bir bileşen
 *  <Box kind="wood" size={[1.6, 0.04, 0.8]} position={…} /> gibi parçaları
 *  normal bir mesh yazar gibi kullanır. Parçalar grup dönüşümlerini miras alır.
 *
 *  Malzeme rengi beyaz olan setlerde (fabric, ceramic, leaf, shell, glow…)
 *  gerçek renk instance başına `color` ile verilir.
 */

import { createInstances } from '@react-three/drei'
import * as THREE from 'three'
import { getScreenTexture } from './textures.js'

// ─────────────────────────────────────────────────────────────────────────────
//  Instance setleri
// ─────────────────────────────────────────────────────────────────────────────
const [WoodBoxes, WoodBox] = createInstances()
const [LaminateBoxes, LaminateBox] = createInstances()
const [MetalBoxes, MetalBox] = createInstances()
const [DarkBoxes, DarkBox] = createInstances()
const [FabricBoxes, FabricBox] = createInstances()
const [GlassBoxes, GlassBox] = createInstances()
const [GlowBoxes, GlowBox] = createInstances()
const [MetalCylinders, MetalCylinder] = createInstances()
const [CeramicCylinders, CeramicCylinder] = createInstances()
const [LeafSpheres, LeafSphere] = createInstances()
const [ShellSpheres, ShellSphere] = createInstances()
const [GlowSpheres, GlowSphere] = createInstances()
const [GlowTori, GlowTorus] = createInstances()
const [TorsoCapsules, TorsoCapsule] = createInstances()
const [ArmCapsules, ArmCapsule] = createInstances()
const [LegCapsules, LegCapsule] = createInstances()
const [CodeScreens, CodeScreen] = createInstances()
const [ChartScreens, ChartScreen] = createInstances()
const [DashboardScreens, DashboardScreen] = createInstances()
const [TerminalScreens, TerminalScreen] = createInstances()

/** Statik setler birkaç kare güncellenip durur; animasyonlu setler her kare güncellenir */
const STATIC = 4
const LIVE = Infinity

/** Ekran malzemesi: kendinden ışıklı, instance rengiyle boyanır (HDR → Bloom) */
const screenMaterial = (variant) => <meshBasicMaterial map={getScreenTexture(variant)} toneMapped={false} />

// ─────────────────────────────────────────────────────────────────────────────
//  Kit tanımı: [Provider, limit, frames, gölge, geometri, malzeme]
// ─────────────────────────────────────────────────────────────────────────────
const KIT = [
  // ── Mobilya ──────────────────────────────────────────────────────────────
  [WoodBoxes, 800, STATIC, true, <boxGeometry />,
    <meshStandardMaterial color="#7b5b41" roughness={0.48} metalness={0.02} />],
  [LaminateBoxes, 800, STATIC, true, <boxGeometry />,
    <meshStandardMaterial color="#a9afb8" roughness={0.38} metalness={0.02} />],
  [MetalBoxes, 3500, STATIC, true, <boxGeometry />,
    <meshStandardMaterial color="#2b313b" roughness={0.32} metalness={0.85} />],
  [DarkBoxes, 1200, STATIC, true, <boxGeometry />,
    <meshStandardMaterial color="#0d1016" roughness={0.42} metalness={0.25} />],
  [FabricBoxes, 2800, STATIC, true, <boxGeometry />,
    <meshStandardMaterial color="#ffffff" roughness={0.92} metalness={0} />],
  [MetalCylinders, 600, STATIC, true, <cylinderGeometry args={[0.5, 0.5, 1, 20]} />,
    <meshStandardMaterial color="#9aa3b0" roughness={0.25} metalness={0.9} />],
  [CeramicCylinders, 600, STATIC, true, <cylinderGeometry args={[0.5, 0.4, 1, 28]} />,
    <meshPhysicalMaterial color="#ffffff" roughness={0.35} clearcoat={0.6} clearcoatRoughness={0.3} />],
  [LeafSpheres, 2600, STATIC, true, <sphereGeometry args={[1, 10, 8]} />,
    <meshStandardMaterial color="#ffffff" roughness={0.55} metalness={0} side={THREE.DoubleSide} />],

  // ── Cam (şeffaf, gölge yok) ──────────────────────────────────────────────
  [GlassBoxes, 500, STATIC, false, <boxGeometry />,
    <meshPhysicalMaterial color="#9fbad6" roughness={0.06} metalness={0.1} transparent opacity={0.14}
      depthWrite={false} envMapIntensity={1.6} />],

  // ── Agent avatarları (animasyonlu) ───────────────────────────────────────
  [ShellSpheres, 900, LIVE, true, <sphereGeometry args={[1, 28, 20]} />,
    <meshPhysicalMaterial color="#ffffff" roughness={0.22} metalness={0.15} clearcoat={1} clearcoatRoughness={0.08} />],
  [TorsoCapsules, 200, LIVE, true, <capsuleGeometry args={[0.16, 0.3, 8, 18]} />,
    <meshPhysicalMaterial color="#1c222e" roughness={0.45} metalness={0.4} clearcoat={0.5} />],
  [ArmCapsules, 600, LIVE, true, <capsuleGeometry args={[0.048, 0.26, 6, 12]} />,
    <meshPhysicalMaterial color="#1c222e" roughness={0.45} metalness={0.4} clearcoat={0.5} />],
  [LegCapsules, 600, STATIC, true, <capsuleGeometry args={[0.068, 0.3, 6, 12]} />,
    <meshPhysicalMaterial color="#1c222e" roughness={0.5} metalness={0.35} clearcoat={0.4} />],

  // ── Işık yayan parçalar (Bloom) ──────────────────────────────────────────
  [GlowBoxes, 900, LIVE, false, <boxGeometry />, <meshBasicMaterial color="#ffffff" toneMapped={false} />],
  [GlowSpheres, 400, LIVE, false, <sphereGeometry args={[1, 16, 12]} />,
    <meshBasicMaterial color="#ffffff" toneMapped={false} />],
  [GlowTori, 200, LIVE, false, <torusGeometry args={[1, 0.07, 8, 48, Math.PI * 1.55]} />,
    <meshBasicMaterial color="#ffffff" toneMapped={false} />],

  // ── Monitör ekranları (4 içerik türü) ────────────────────────────────────
  [CodeScreens, 300, STATIC, false, <planeGeometry />, screenMaterial('code')],
  [ChartScreens, 300, STATIC, false, <planeGeometry />, screenMaterial('chart')],
  [DashboardScreens, 300, STATIC, false, <planeGeometry />, screenMaterial('dashboard')],
  [TerminalScreens, 300, STATIC, false, <planeGeometry />, screenMaterial('terminal')],
]

/** Tüm instance setlerini iç içe sağlayıcı olarak kurar */
export function OfficeKit({ children }) {
  return KIT.reduceRight(
    (inner, [Provider, limit, frames, shadow, geometry, material]) => (
      <Provider limit={limit} frames={frames} castShadow={shadow} receiveShadow={shadow} frustumCulled={false}>
        {geometry}
        {material}
        {inner}
      </Provider>
    ),
    children,
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  PARÇA BİLEŞENLERİ — sahne kodu bunları kullanır
// ═════════════════════════════════════════════════════════════════════════════
const BOX_KINDS = {
  wood: WoodBox,
  laminate: LaminateBox,
  metal: MetalBox,
  dark: DarkBox,
  fabric: FabricBox,
  glass: GlassBox,
  glow: GlowBox,
}

/** Kutu parça. `size` = [genişlik, yükseklik, derinlik] (metre) */
export function Box({ kind = 'metal', size = [1, 1, 1], ...props }) {
  const Part = BOX_KINDS[kind]
  return <Part scale={size} {...props} />
}

const CYLINDER_KINDS = { metal: MetalCylinder, ceramic: CeramicCylinder }

/** Silindir parça (seramik seti hafif konik: saksı/fincan) */
export function Cylinder({ kind = 'metal', radius = 0.5, height = 1, ...props }) {
  const Part = CYLINDER_KINDS[kind]
  return <Part scale={[radius * 2, height, radius * 2]} {...props} />
}

const SPHERE_KINDS = { shell: ShellSphere, glow: GlowSphere, leaf: LeafSphere }

/** Küre parça. `radius` tek sayı veya [x, y, z] elipsoid yarıçapları */
export function Sphere({ kind = 'shell', radius = 1, ...props }) {
  const Part = SPHERE_KINDS[kind]
  return <Part scale={Array.isArray(radius) ? radius : [radius, radius, radius]} {...props} />
}

/** Işıklı açık halka (agent statü halesi) */
export const Halo = GlowTorus

/** Avatar gövde parçaları */
export const Torso = TorsoCapsule
export const ArmSegment = ArmCapsule
export const LegSegment = LegCapsule

const SCREEN_KINDS = {
  code: CodeScreen,
  chart: ChartScreen,
  dashboard: DashboardScreen,
  terminal: TerminalScreen,
}

/** Monitör ekranı. `size` = [genişlik, yükseklik] */
export function Screen({ variant = 'dashboard', size = [1, 1], ...props }) {
  const Part = SCREEN_KINDS[variant] ?? DashboardScreen
  return <Part scale={[size[0], size[1], 1]} {...props} />
}
