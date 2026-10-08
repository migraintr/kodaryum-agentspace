// CEO ofisindeki ışıklı logo tabelası (arkadan aydınlatmalı "halo" tabela):
//  · Amblem + KODARYUM / AgentSpace yazısı duvardan 4 cm önde durur; kendi ışığıyla parlar (bloom'a taşar).
//  · Arkasındaki lacivert duvara logo biçiminde mavi-mor hale düşer; hale yavaşça "nefes alır".
//  · Birkaç saniyede bir amblemin ve yazının üzerinden çapraz bir ışık parıltısı geçer.
// (Önündeki mavi nokta ışık HQ.jsx'te, duvar kesitinin dışında durur: ışık sayısı hiç değişmez.)
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COMPANY } from '../data.js'

const W = 1000 // tuval: 1 px = 1 mm (kenarlarda halenin taşabileceği boşluk bırakılır)
const H = 1350
const LOGO = { y: 140, h: 620 } // amblem (120 × 140 oranlı)

// Tabelanın tuvali: amblem üstte, marka adı altta. glow > 0: aynı yerleşimin bu kadar bulanık, renkli hali (hale)
function paint(g, img, glow = 0) {
  g.clearRect(0, 0, W, H)
  const lw = (LOGO.h * 120) / 140
  if (glow) g.filter = `blur(${glow}px)`
  if (img) g.drawImage(img, (W - lw) / 2, LOGO.y, lw, LOGO.h)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = '800 128px "Inter Variable", "Segoe UI", sans-serif'
  g.letterSpacing = '18px'
  g.fillStyle = '#ffffff'
  g.fillText(COMPANY.brand, W / 2 + 9, 930)
  g.font = '600 84px "Inter Variable", "Segoe UI", sans-serif'
  g.letterSpacing = '4px'
  const grd = g.createLinearGradient(W * 0.2, 0, W * 0.8, 0)
  grd.addColorStop(0, '#b38cff')
  grd.addColorStop(0.5, '#7f95ff')
  grd.addColorStop(1, '#5cc4ff')
  g.fillStyle = grd
  g.fillText(COMPANY.product, W / 2 + 2, 1085)
  g.filter = 'none'
  if (glow) {
    // haleyi marka renklerine boya (şekil korunur)
    g.globalCompositeOperation = 'source-in'
    const hg = g.createLinearGradient(0, 0, 0, H)
    hg.addColorStop(0, '#4f8bff')
    hg.addColorStop(0.55, '#7b5cff')
    hg.addColorStop(1, '#5cc4ff')
    g.fillStyle = hg
    g.fillRect(0, 0, W, H)
    g.globalCompositeOperation = 'source-over'
  }
}

// Amblem/yazı malzemesi: kendi ışığı + üzerinden kayan çapraz parıltı
const signShader = {
  uniforms: { map: { value: null }, uTime: { value: 0 }, uGain: { value: 1.35 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D map;
    uniform float uTime;
    uniform float uGain;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(map, vUv);
      if (c.a < 0.03) discard;
      float sweep = fract(uTime / 7.0) * 2.6 - 0.8;               // 7 sn'de bir geçer
      float d = (vUv.x * 0.75 - vUv.y * 0.45) - sweep;
      float band = smoothstep(0.09, 0.0, abs(d));
      gl_FragColor = vec4(c.rgb * uGain + vec3(0.85, 0.9, 1.0) * band * 1.1, c.a);
      #include <colorspace_fragment>
    }`,
}

export function LogoSign({ position, width = 1 }) {
  const height = (width * H) / W
  const { signTex, haloTex, wideTex } = useMemo(() => {
    const mk = () => {
      const c = document.createElement('canvas')
      c.width = W
      c.height = H
      const t = new THREE.CanvasTexture(c)
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      return [c, t]
    }
    const [sc, signTex] = mk()
    const [hc, haloTex] = mk()
    const [wc, wideTex] = mk()
    // logo görseli + yazı tipi hazır olunca çiz
    Promise.all([
      new Promise((res) => {
        const img = new Image()
        img.onload = () => res(img)
        img.onerror = () => res(null)
        img.src = '/logo.svg'
      }),
      document.fonts?.ready ?? Promise.resolve(),
    ]).then(([img]) => {
      paint(sc.getContext('2d'), img)
      paint(hc.getContext('2d'), img, 22)
      paint(wc.getContext('2d'), img, 70)
      for (const t of [signTex, haloTex, wideTex]) t.needsUpdate = true
    })
    return { signTex, haloTex, wideTex }
  }, [])
  const mat = useMemo(() => {
    const m = new THREE.ShaderMaterial({ ...signShader, uniforms: THREE.UniformsUtils.clone(signShader.uniforms), transparent: true, toneMapped: false })
    m.uniforms.map.value = signTex
    return m
  }, [signTex])
  const halo = useRef()
  const halo2 = useRef()
  useEffect(() => () => [signTex, haloTex, wideTex, mat].forEach((o) => o.dispose()), [signTex, haloTex, wideTex, mat])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const breath = 0.5 + 0.5 * Math.sin(t * 1.25)
    mat.uniforms.uTime.value = t
    if (halo.current) halo.current.material.opacity = 0.62 + breath * 0.25
    if (halo2.current) halo2.current.material.opacity = 0.5 + breath * 0.3
  })
  return (
    <group position={position}>
      {/* duvara düşen hale: logo biçimli (yakın) + geniş yumuşak ışıma */}
      <mesh ref={halo} position={[0, 0, 0.004]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={haloTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={halo2} position={[0, 0, 0.003]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={wideTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* duvardan 4 cm önde amblem ve yazı */}
      <mesh position={[0, 0, 0.04]} material={mat}>
        <planeGeometry args={[width, height]} />
      </mesh>
      {/* tabela ayakları (duvara bağlantı pimleri) */}
      {[
        [-0.18, 0.36],
        [0.18, 0.36],
        [-0.18, -0.05],
        [0.18, -0.05],
      ].map(([x, y]) => (
        <mesh key={`${x}${y}`} position={[x * width, y * height, 0.02]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.006, 0.006, 0.04, 8]} />
          <meshStandardMaterial color="#9aa3b5" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}
