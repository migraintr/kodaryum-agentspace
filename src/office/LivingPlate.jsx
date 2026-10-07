// "Yaşayan fotoğraf": ofis görseli WebGL2 ile çizilir; çalışanların baş/gövde/dirsek bölgelerine, bitkilere ve
// monitörlere her karede yumuşak, yerel bükme (liquify) uygulanır. Böylece fotoğraftaki kişiler klavyede yazar,
// başını çevirir, nefes alır, arkasına yaslanır; moladakiler sohbet eder; bitkiler esintiyle salınır; ekranlar titreşir.
// Görsel karolara bölünür, her karo yalnızca kendisine değen bükmeleri hesaplar (düşük GPU maliyeti).
// WebGL2 yoksa ya da kullanıcı "hareketi azalt" tercih ettiyse durağan görsel gösterilir.
import { useEffect, useRef, useState } from 'react'
import { PERSON_BY_ID } from '../data.js'
import { HEADS, EXTRA_SEATS, PLATE } from './photoLayout.js'
import { PLANTS } from './plants.js'

const { w: PW, h: PH } = PLATE
const MAXD = 32 // karo başına en fazla bükme
const TCOLS = 10
const TROWS = 5
const FPS = 30

const VS = `#version 300 es
in vec2 aPos;
uniform vec4 uTile;
uniform vec2 uSize;
out vec2 vP;
void main() {
  vec2 p = mix(uTile.xy, uTile.zw, aPos);
  vP = p;
  vec2 ndc = p / uSize * 2.0 - 1.0;
  gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);
}`

const FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uSize;
uniform int uN;
uniform vec4 uA[${MAXD}]; // bölge: merkez x, y, yarıçap x, y
uniform vec4 uB[${MAXD}]; // hareket: dx, dy, dönüş (rad), ölçek  · ekranda: parlaklık, tarama y, -, -
uniform vec4 uC[${MAXD}]; // pivot x, y, -, tür (0 bükme, 1 ekran ışıması)
in vec2 vP;
out vec4 o;
void main() {
  vec2 off = vec2(0.0);
  float glow = 0.0;
  for (int i = 0; i < ${MAXD}; i++) {
    if (i >= uN) break;
    vec4 A = uA[i];
    vec2 d = (vP - A.xy) / A.zw;
    float r2 = dot(d, d);
    if (r2 >= 1.0) continue;
    float w = 1.0 - r2;
    w *= w;
    vec4 B = uB[i];
    vec4 C = uC[i];
    if (C.w > 0.5) {
      float band = exp(-pow((vP.y - B.y) / 1.6, 2.0));
      glow += w * (B.x + band * 0.22);
      continue;
    }
    vec2 q = vP - C.xy;
    float c = cos(B.z);
    float s = sin(B.z);
    vec2 r = vec2(c * q.x - s * q.y, s * q.x + c * q.y) * B.w;
    off += (r - q + B.xy) * w;
  }
  vec4 col = texture(uTex, clamp((vP - off) / uSize, vec2(0.0), vec2(1.0)));
  if (glow != 0.0) {
    float hi = max(col.r, max(col.g, col.b));
    float lo = min(col.r, min(col.g, col.b));
    float sat = (hi - lo) / (hi + 0.001);
    float m = smoothstep(0.42, 0.78, hi) * smoothstep(0.18, 0.42, sat);
    col.rgb += col.rgb * m * glow;
  }
  o = vec4(col.rgb, 1.0);
}`

// ─── Hareket yardımcıları ────────────────────────────────────────────────────
const TAU = Math.PI * 2
const rnd = (seed) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
// Belirli aralıklarla gelen yumuşak olay zarfı (0..1): her "period" saniyede bir, "dur" saniye sürer
const event = (t, period, phase, dur) => {
  const u = (((t + phase) % period) + period) % period
  return u > dur ? 0 : Math.sin((Math.PI * u) / dur) ** 2
}
const eventSign = (t, period, phase) => (Math.floor((t + phase) / period) % 2 ? -1 : 1)

// ─── Bükme listesi (bölgeler sabit, parametreler her karede hesaplanır) ──────
function buildRig() {
  const D = [] // { a:[cx,cy,rx,ry], c:[px,py,0,kind], f:(t, st, out) }
  const add = (a, c, f) => D.push({ a, c, f })

  // Oturan çalışan (kameraya sırtı dönük): baş, gövde, iki dirsek, önündeki ekranların ışıması
  const seated = (id, hx, hy, seed) => {
    const r = rnd(seed)
    const P = { look: 8 + r() * 8, lookPh: r() * 20, lean: 26 + r() * 22, leanPh: r() * 40, ph: r() * 10, ph2: r() * 10, speed: 0.85 + r() * 0.3 }
    const typing = (t, st) => st.busy(id) * (0.55 + 0.45 * Math.sin(t * 0.8 + P.ph)) * (1 - event(t, P.look, P.lookPh, 2.8))
    add([hx, hy, 12.5, 13.5], [hx, hy + 10, 0, 0], (t, st, o) => {
      const look = event(t, P.look, P.lookPh, 2.8) * eventSign(t, P.look, P.lookPh)
      const lean = event(t, P.lean, P.leanPh, 3.4)
      const nod = st.nod(id)
      const ty = typing(t, st)
      o[0] = look * 1.8 + Math.sin(t * 0.55 + P.ph) * 0.35
      o[1] = ty * 0.8 * Math.sin(t * TAU * 2.2 * P.speed + P.ph) - lean * 2.2 + nod * 2
      o[2] = look * 0.3 + Math.sin(t * 0.47 + P.ph2) * 0.05
      o[3] = 1
    })
    add([hx, hy + 25, 25, 19], [hx, hy + 48, 0, 0], (t, st, o) => {
      const look = event(t, P.look, P.lookPh, 2.8) * eventSign(t, P.look, P.lookPh)
      const lean = event(t, P.lean, P.leanPh, 3.4)
      o[0] = 0
      o[1] = -lean * 1.6
      o[2] = Math.sin(t * 0.38 + P.ph) * 0.03 + look * 0.045
      o[3] = 1 + Math.sin(t * 1.55 + P.ph2) * 0.016 // nefes
    })
    for (const side of [-1, 1]) {
      add([hx + side * 17, hy + 19, 9.5, 9.5], [hx + side * 17, hy + 19, 0, 0], (t, st, o) => {
        const ty = typing(t, st)
        o[0] = ty * 0.35 * Math.sin(t * TAU * 3.1 + side)
        o[1] = ty * 1.05 * Math.sin(t * TAU * 6.4 * P.speed + P.ph + side * 1.7)
        o[2] = 0
        o[3] = 1
      })
    }
    add([hx, hy - 7, 60, 22], [0, 0, 0, 1], (t, st, o) => {
      const ty = typing(t, st)
      o[0] = 0.07 + 0.05 * Math.sin(t * TAU * 0.33 + P.ph) + ty * 0.035 * Math.sin(t * 13 + P.ph2)
      o[1] = hy - 26 + ((t * 11 + P.ph * 7) % 34)
    })
  }

  // ADA (kameraya dönük, dizüstünde çalışır)
  const ceo = (hx, hy) => {
    add([hx, hy, 12, 14], [hx, hy + 11, 0, 0], (t, st, o) => {
      const look = event(t, 7.5, 2, 3) * eventSign(t, 7.5, 2)
      const talk = st.talking() ? 1 : 0
      o[0] = look * 1.2
      o[1] = 0.5 * Math.sin(t * TAU * 1.9) * (1 - look * look) + talk * 0.9 * Math.sin(t * 9)
      o[2] = look * 0.2 + Math.sin(t * 0.6) * 0.04 + talk * 0.05 * Math.sin(t * 5)
      o[3] = 1
    })
    add([hx, hy + 26, 24, 17], [hx, hy + 46, 0, 0], (t, _st, o) => {
      o[0] = 0
      o[1] = 0
      o[2] = Math.sin(t * 0.42) * 0.02
      o[3] = 1 + Math.sin(t * 1.5) * 0.015
    })
    for (const side of [-1, 1]) {
      add([hx + side * 13, hy + 33, 9, 8], [hx, hy + 33, 0, 0], (t, _st, o) => {
        o[0] = 0.3 * Math.sin(t * TAU * 2.7 + side)
        o[1] = 0.8 * Math.max(0, Math.sin(t * TAU * 5.9 + side * 1.9))
        o[2] = 0
        o[3] = 1
      })
    }
  }

  // Ayakta sohbet eden ikili (Mola Odası): beden salınımı, baş sallama, el hareketleri
  const standing = (id, hx, hy, who) => {
    const speaking = (t) => (Math.sin(t * 0.42 + who * Math.PI) > 0 ? 1 : 0)
    add([hx, hy + 55, 17, 64], [hx, hy + 113, 0, 0], (t, _st, o) => {
      o[0] = 0
      o[1] = 0
      o[2] = Math.sin(t * 0.7 + who * 2) * 0.022 + Math.sin(t * 0.23 + who) * 0.012
      o[3] = 1
    })
    add([hx, hy, 11, 12], [hx, hy + 10, 0, 0], (t, _st, o) => {
      const sp = speaking(t)
      o[0] = 0
      o[1] = sp * 0.9 * Math.sin(t * 6.2) + (1 - sp) * 0.8 * Math.max(0, Math.sin(t * 2.4)) // konuşan konuşur, dinleyen başını sallar
      o[2] = (who ? -1 : 1) * 0.07 + sp * 0.06 * Math.sin(t * 3.3)
      o[3] = 1
    })
    for (const side of [-1, 1]) {
      add([hx + side * 11, hy + 38, 10, 12], [hx + side * 9, hy + 22, 0, 0], (t, _st, o) => {
        const sp = speaking(t)
        o[0] = sp * 1.1 * Math.sin(t * 3.1 + side)
        o[1] = sp * 0.9 * Math.sin(t * 2.3 + side * 2)
        o[2] = sp * 0.06 * Math.sin(t * 2.7 + side)
        o[3] = 1
      })
    }
  }

  // Bitkiler: saksıdan yukarı doğru artan, esinti gibi yavaş salınım + yaprak titreşimi
  const plant = ([x, y, w, h], i) => {
    const r = rnd(1000 + i)
    const f = 0.16 + r() * 0.2
    const ph = r() * 10
    const amp = 0.007 + 0.013 * Math.min(1, h / 110)
    add([x + w / 2, y + h / 2, w * 0.62 + 4, h * 0.62 + 4], [x + w / 2, y + h + 4, 0, 0], (t, _st, o) => {
      o[0] = Math.sin(t * TAU * 1.3 + ph) * 0.18
      o[1] = 0
      o[2] = (Math.sin(t * TAU * f + ph) * 0.65 + Math.sin(t * TAU * f * 2.37 + ph * 1.7) * 0.35) * amp
      o[3] = 1
    })
  }

  for (const [id, [hx, hy]] of Object.entries(HEADS)) {
    if (id === 'ada') ceo(hx, hy)
    else if (id === 'kaan') standing(id, hx, hy, 0)
    else if (id === 'canan') standing(id, hx, hy, 1)
    else seated(id, hx, hy, [...id].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7))
  }
  EXTRA_SEATS.forEach(([hx, hy], i) => seated(`x${i}`, hx, hy, 900 + i))
  PLANTS.forEach(plant)

  // Karolar: her karoya değen bükmelerin listesi
  const tiles = []
  const tw = PW / TCOLS
  const th = PH / TROWS
  for (let ty = 0; ty < TROWS; ty++)
    for (let tx = 0; tx < TCOLS; tx++) {
      const x0 = tx * tw
      const y0 = ty * th
      const x1 = x0 + tw
      const y1 = y0 + th
      const list = []
      D.forEach((d, i) => {
        const [cx, cy, rx, ry] = d.a
        if (cx + rx > x0 && cx - rx < x1 && cy + ry > y0 && cy - ry < y1) list.push(i)
      })
      if (list.length > MAXD) list.length = MAXD
      const A = new Float32Array(MAXD * 4)
      const C = new Float32Array(MAXD * 4)
      list.forEach((i, k) => {
        A.set(D[i].a, k * 4)
        C.set(D[i].c, k * 4)
      })
      tiles.push({ rect: [x0, y0, x1, y1], list, A, C, B: new Float32Array(MAXD * 4) })
    }
  return { D, tiles }
}

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
  return s
}

/**
 * busyRef.current: Set<personId> — aktif görevi olan ajanlar (yazma yoğunluğu)
 * nodRef.current: Map<personId, saniye> — görev paketi ulaştığında başıyla onaylama anı
 * talkRef.current: ADA şu an yanıt yazıyor mu
 * scaleRef.current: kameranın ekran ölçeği (çözünürlük seçimi için)
 */
export default function LivingPlate({ scaleRef, busyRef, nodRef, talkRef, onLoad }) {
  const canvasRef = useRef(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' })
    if (!gl) {
      setFallback(true)
      return
    }
    let prog
    try {
      prog = gl.createProgram()
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS))
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog))
    } catch (e) {
      console.warn('LivingPlate: WebGL programı kurulamadı, durağan görsel kullanılıyor.', e)
      setFallback(true)
      return
    }
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const U = Object.fromEntries(['uTex', 'uSize', 'uN', 'uA', 'uB', 'uC', 'uTile'].map((n) => [n, gl.getUniformLocation(prog, n)]))
    gl.uniform2f(U.uSize, PW, PH)
    gl.uniform1i(U.uTex, 0)

    const { D, tiles } = buildRig()
    const out = [0, 0, 0, 1]
    const st = {
      busy: (id) => (busyRef?.current?.has(id) ? 1 : id.startsWith('x') ? 0.7 : 0.3),
      abs: 0, // mutlak saniye (performance.now): paket varış anlarıyla karşılaştırılır
      nod: (id) => {
        const at = nodRef?.current?.get(id)
        if (at == null) return 0
        const u = st.abs - at
        return u < 0 || u > 1.2 ? 0 : Math.sin((u / 1.2) * Math.PI * 2) * Math.sin((u / 1.2) * Math.PI)
      },
      talking: () => !!talkRef?.current,
    }

    let tex = null
    let raf = 0
    let last = 0
    let k = 0
    let alive = true
    const t0 = performance.now()

    const resize = () => {
      const want = Math.min(2, Math.max(1, (window.devicePixelRatio || 1) * (scaleRef?.current || 1)))
      if (k && Math.abs(want - k) / k < 0.15) return
      k = want
      canvas.width = Math.round(PW * k)
      canvas.height = Math.round(PH * k)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const draw = (now) => {
      resize()
      st.abs = now / 1000
      const t = reduce ? 0 : (now - t0) / 1000
      const params = D.map((d) => {
        const o = [0, 0, 0, 1]
        if (!reduce) d.f(t, st, o)
        else if (d.c[3] > 0.5) o[0] = 0
        return o
      })
      for (const tile of tiles) {
        tile.list.forEach((i, j) => tile.B.set(params[i], j * 4))
        gl.uniform4f(U.uTile, ...tile.rect)
        gl.uniform1i(U.uN, tile.list.length)
        gl.uniform4fv(U.uA, tile.A)
        gl.uniform4fv(U.uB, tile.B)
        gl.uniform4fv(U.uC, tile.C)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
    }

    const loop = (now) => {
      if (!alive) return
      raf = requestAnimationFrame(loop)
      if (now - last < 1000 / FPS - 2) return
      last = now
      draw(now)
    }

    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (!alive) return
      tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      draw(performance.now())
      onLoad?.()
      if (!reduce) raf = requestAnimationFrame(loop)
    }
    img.onerror = () => setFallback(true)
    img.src = PLATE.src

    const lost = (e) => {
      e.preventDefault()
      setFallback(true)
    }
    canvas.addEventListener('webglcontextlost', lost)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      canvas.removeEventListener('webglcontextlost', lost)
      if (tex) gl.deleteTexture(tex)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (fallback) return <img className="po-plate" src={PLATE.src} alt="Kodaryum AgentSpace ofisi" draggable={false} onLoad={onLoad} />
  return <canvas ref={canvasRef} className="po-plate" aria-label="Kodaryum AgentSpace ofisi (canlı)" />
}

// Hata ayıklama / test için: rig özeti
export const rigStats = () => {
  const { D, tiles } = buildRig()
  return { deformers: D.length, maxPerTile: Math.max(...tiles.map((t) => t.list.length)), people: Object.keys(HEADS).length, known: Object.keys(HEADS).filter((id) => PERSON_BY_ID.has(id)).length }
}
