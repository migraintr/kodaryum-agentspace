// Kodaryum Pazarlama Modülü tanıtım videosu — tek GSAP zaman çizelgesi.
// Zamanlar zaman.js'ten gelir (zamanla.py: her cümle okuma süresine göre). Seslendirme yok; anlatım ekrandaki
// metin + görsel animasyonla yapılır. ?render: kare kare yakalama modu (window.__seek). Önizleme: boşluk oynat/duraklat,
// ←/→ 5 sn, ?t=120 belirli saniyeden başlat.
(() => {
  const TM = window.TIMING
  const SC = Object.fromEntries(TM.scenes.map((s) => [s.id, s]))
  const DUR = TM.duration
  const RENDER = location.search.includes('render')
  const NOCAP = new Set(['intro:0', 'next:1'])
  const tl = gsap.timeline({ paused: true })
  const $ = (s, r = document) => r.querySelector(s)
  const $$ = (s, r = document) => [...r.querySelectorAll(s)]
  const at = (id, i = 0) => SC[id].segs[i].start
  const end = (id, i) => SC[id].segs[i ?? SC[id].segs.length - 1].end
  const S0 = (id) => SC[id].start
  const S1 = (id) => SC[id].end
  const C = { blue: '#3b8bff', violet: '#8b5cf6', orange: '#f6a21e', green: '#22c08a', red: '#f0545a', pink: '#ec4899', cyan: '#22d3ee', slate: '#64748b' }
  const tint = (hex, a) => hex + Math.round(a * 255).toString(16).padStart(2, '0')

  // ── yardımcılar ─────────────────────────────────────────────────────────────────────────────────
  function svg(n, fill) {
    const node = window.ICONS[n]
    if (!node) return ''
    return `<svg viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${node
      .map(([t, a]) => `<${t} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`)
      .join('')}</svg>`
  }
  const ic = (n, style = '', fill) => `<span class="ico" style="${style}">${svg(n, fill)}</span>`
  const box = (n, col, size = 58, isz = 32) => `<div class="ic" style="width:${size}px;height:${size}px;background:${tint(col, 0.18)};color:${col}">${ic(n, `width:${isz}px;height:${isz}px`)}</div>`
  function scene(id, kicker, title, html) {
    const el = document.createElement('section')
    el.className = 'scene'
    el.id = 'sc-' + id
    el.innerHTML = (kicker ? `<div class="kicker">${kicker}</div><div class="title">${title}</div>` : '') + html
    $('#scenes').append(el)
    const s0 = S0(id)
    const s1 = S1(id)
    tl.set(el, { visibility: 'visible' }, s0)
    tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out', immediateRender: false }, s0)
    tl.fromTo(el, { opacity: 1 }, { opacity: 0, duration: 0.55, ease: 'power2.in', immediateRender: false }, s1 - 0.55)
    tl.set(el, { visibility: 'hidden' }, s1)
    const t = $$('.kicker, .title', el)
    if (t.length) tl.fromTo(t, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, s0 + 0.1)
    return el
  }
  const q = (el, s) => $$(s, el)
  // ilk görünüş (başlangıç durumu hemen uygulanır)
  const pop = (els, t, o = {}) => tl.fromTo(els, { opacity: 0, y: o.y ?? 34, scale: o.s ?? 0.95 }, { opacity: 1, y: 0, scale: 1, duration: o.d ?? 0.65, stagger: o.st ?? 0.09, ease: o.ease ?? 'back.out(1.5)' }, t)
  const fadeIn = (els, t, d = 0.6, st = 0) => tl.fromTo(els, { opacity: 0 }, { opacity: 1, duration: d, stagger: st }, t)
  const out = (els, t, d = 0.5, o = {}) => tl.fromTo(els, { opacity: 1, y: 0, scale: 1 }, { opacity: 0, y: o.y ?? -20, scale: o.s ?? 1, duration: d, stagger: o.st ?? 0, ease: 'power2.in', immediateRender: false }, t)
  const to = (els, from, toV, t) => tl.fromTo(els, from, { ...toV, immediateRender: false }, t)
  // sayaçlar ve yazı efektleri (her karede update içinde, zamana göre hesaplanır)
  const DYN = []
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)
  const count = (el, t0, t1, a, b, fmt = (v) => Math.round(v).toLocaleString('tr-TR')) => DYN.push((t) => (el.textContent = fmt(a + (b - a) * ease((t - t0) / (t1 - t0)))))
  const typeText = (el, text, t0, t1) => DYN.push((t) => (el.textContent = text.slice(0, Math.round(text.length * Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))))))
  const segDur = (id, i) => SC[id].segs[i].end - SC[id].segs[i].start

  // ── arka plan altıgenleri ───────────────────────────────────────────────────────────────────────
  const HEX = []
  ;[[180, 820, 260, C.blue, 0.055], [1700, 220, 300, C.violet, 0.06], [1550, 880, 180, C.orange, 0.045], [420, 160, 140, C.cyan, 0.04], [1000, 1000, 220, C.violet, 0.04], [80, 380, 120, C.orange, 0.035]].forEach(([x, y, r, col, a], i) => {
    const d = document.createElement('div')
    d.innerHTML = `<svg width="${r * 2}" height="${r * 2}" viewBox="-1 -1 2 2"><polygon points="${[0, 1, 2, 3, 4, 5].map((k) => { const g = Math.PI / 6 + (k * Math.PI) / 3; return `${Math.cos(g).toFixed(3)},${Math.sin(g).toFixed(3)}` }).join(' ')}" fill="${col}" fill-opacity="${a}" stroke="${col}" stroke-opacity="${a * 2.2}" stroke-width="0.012"/></svg>`
    const s = d.firstChild
    $('#bg-hex').append(s)
    HEX.push({ el: s, x, y, r, i })
  })

  // ── alt yazılar ve ilerleme ─────────────────────────────────────────────────────────────────────
  TM.scenes.forEach((s, si) => {
    s.segs.forEach((g, gi) => {
      if (NOCAP.has(`${s.id}:${gi}`) || g.nocap) return
      const el = document.createElement('div')
      el.className = 'cap'
      el.innerHTML = g.cap.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ')
      $('#caps').append(el)
      const ws = q(el, '.w')
      tl.set(el, { opacity: 1 }, g.start)
      tl.fromTo(ws, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.42, stagger: Math.min(0.045, 1.4 / ws.length), ease: 'power2.out' }, g.start + 0.12)
      tl.fromTo(el, { opacity: 1 }, { opacity: 0, duration: 0.32, immediateRender: false }, g.end - 0.34)
      tl.set(el, { opacity: 0 }, g.end)
    })
    if (si > 0) {
      const tk = document.createElement('i')
      tk.style.left = `${(s.start / DUR) * 100}%`
      $('#progress-ticks').append(tk)
    }
  })
  gsap.set(['#brand', '#chapter', '#progress'], { opacity: 0 })
  tl.fromTo(['#brand', '#chapter', '#progress'], { opacity: 0 }, { opacity: 1, duration: 0.8, immediateRender: false }, S1('intro') - 0.4)
  tl.fromTo(['#brand', '#chapter', '#progress'], { opacity: 1 }, { opacity: 0, duration: 0.8, immediateRender: false }, at('next', 1) - 0.2)

  // ════════════════════════════════════════════════════════════════════════════════════════════════
  // 0 · Giriş
  {
    const el = scene('intro', '', '', `
      <div class="ring" style="width:260px;height:260px"></div><div class="ring" style="width:260px;height:260px"></div><div class="ring" style="width:260px;height:260px"></div>
      <img class="logo" src="img/logo.svg" alt="">
      <div class="h">KODARYUM · AGENTSPACE</div>
      <div class="t">Pazarlama <span>Modülü</span></div>
      <div class="s">Strateji ve ürün planı · İşletmenin cebindeki pazarlama departmanı</div>
      <div class="steps">${['Problem', 'Müşteri', 'Ürün', '12 modül', 'Pazara çıkış', 'Yol haritası'].map((x, i) => `<span class="chip">${i ? ic('chevrons-right', 'width:18px;height:18px;color:#f6a21e') : ''}${x}</span>`).join('')}</div>`)
    const t0 = 0.3
    pop(q(el, '.logo'), t0, { y: 0, s: 0.6, d: 1.1, ease: 'back.out(1.8)' })
    q(el, '.ring').forEach((r, i) => tl.fromTo(r, { scale: 0.6, opacity: 0.0 }, { keyframes: [{ opacity: 0.9, duration: 0.3 }, { scale: 2.6, opacity: 0, duration: 2.7, ease: 'power1.out' }], repeat: Math.ceil(S1('intro') / 3), immediateRender: true }, t0 + 0.4 + i))
    pop(q(el, '.h'), t0 + 0.9, { y: 18 })
    pop(q(el, '.t'), t0 + 1.2, { y: 40, d: 0.9, ease: 'power3.out' })
    pop(q(el, '.s'), t0 + 1.8, { y: 18 })
    pop(q(el, '.steps .chip'), at('intro', 1) + 0.6, { st: 0.18, y: 20 })
    to(q(el, '.logo, .ring, .h, .t, .s'), { y: 0 }, { y: -60, duration: 1.2, ease: 'power2.inOut' }, at('intro', 1))
  }

  // 1 · Problem
  {
    const P = [
      ['moon', 'Zaman yok', 'Sahibi gönderiyi gece hazırlıyor', C.blue],
      ['clock', 'Süreklilik yok', 'Haftalarca sessizlik; algoritma ve müşteri unutuyor', C.blue],
      ['users', 'Ekip yetişemiyor', 'Bir iki kişi, onlarca kanal ve format', C.violet],
      ['git-branch', 'Onay zinciri yavaş', 'Büyük şirkette ajans ve onaylar hızı kesiyor', C.violet],
      ['banknote', 'Ajans pahalı', 'Küçük bütçe ajansa değmiyor; dönüş günler sürüyor', C.orange],
      ['circle-alert', 'Ölçüm karanlık', '“Reklama para veriyorum ama ne getirdiğini bilmiyorum”', C.orange],
      ['message-circle', 'Geç yanıt', 'Mesaj saatlerce bekliyor, müşteri rakibe gidiyor', C.red],
      ['repeat', 'Tekrar satış yok', 'Eski müşteri hatırlanmıyor, segment yok', C.red],
    ]
    const el = scene('problem', '01 · Problem', 'Pazarlama: her işletmenin en büyük derdi', `
      <div class="trio"><div style="color:#8fbaff">İş çok</div><div style="color:#c4a8ff">Uzmanı pahalı</div><div style="color:#ffc46b">Sonuç belirsiz</div></div>
      ${P.map(([n, h, p, col], k) => `<div class="card pain" style="left:${121 + (k % 4) * 426}px;top:${k < 4 ? 400 : 620}px">${box(n, col, 58, 32)}<h4>${h}</h4><p>${p}</p></div>`).join('')}`)
    pop(q(el, '.trio div'), at('problem', 0) + 0.3, { st: 0.35, s: 0.8, ease: 'back.out(2)' })
    const cards = q(el, '.pain')
    for (let s = 1; s <= 4; s++) pop(cards.slice((s - 1) * 2, s * 2), at('problem', s) + 0.25, { st: 0.35 })
    to(cards.slice(6), { boxShadow: '0 0 0 0 rgba(240,84,90,0)' }, { boxShadow: '0 0 0 3px rgba(240,84,90,.7), 0 0 50px rgba(240,84,90,.35)', duration: 0.6, yoyo: true, repeat: 3 }, at('problem', 4) + 1.2)
  }

  // 2 · Kime satıyoruz
  {
    const D = [
      ['store', 'Küçük işletme', '1–9 kişi', C.blue, ['Karar', 'Sahibi; hızlı ve tek kişi'], ['Acı', 'Zaman ve bilgi'], ['İster', '“Benim yerime yapın”'], ['Satın alma', 'Gün–hafta, deneme ile']],
      ['briefcase', 'Orta ölçek', '10–249 kişi', C.violet, ['Karar', 'Sahip + pazarlama sorumlusu'], ['Acı', 'Çok kanal, az insan'], ['İster', '“Ekibimi güçlendirin, rapor verin”'], ['Satın alma', 'Hafta–ay, demo + pilot']],
      ['building', 'Büyük işletme', '250+ kişi', C.orange, ['Karar', 'Direktör, satın alma, hukuk'], ['Acı', 'Hız, tutarlılık, uyum'], ['İster', 'Güvenlik, onay zinciri, entegrasyon'], ['Satın alma', 'Ay–çeyrek, güvenlik incelemesi']],
    ]
    const el = scene('segment', '02 · Müşteri', 'Kime satıyoruz?', `
      ${D.map(([n, h, sm, col, ...rows], k) => `<div class="card seg" style="left:${121 + k * 580}px;top:262px;height:478px">
        <div class="hd">${box(n, col, 64, 34)}<h3>${h}<small>${sm}</small></h3></div>
        ${rows.map(([a, b]) => `<div class="row"><span class="k">${a}</span><span>${b}</span></div>`).join('')}
        <span class="badge" style="background:${k < 2 ? C.green : C.violet};color:#fff">${k < 2 ? 'İLK SATIŞ' : '2. DALGA'}</span></div>`).join('')}
      <div class="found">${ic('layers')} Mimari baştan kurumsala hazır: çok kiracılı veri · roller · denetim kaydı</div>`)
    const cards = q(el, '.seg')
    pop(cards, at('segment', 0) + 0.3, { st: 0.2 })
    pop(q(cards[0], '.row'), at('segment', 1) + 0.2, { st: 0.25, y: 14 })
    to(cards[0], { boxShadow: '0 0 0 0 rgba(59,139,255,0)' }, { boxShadow: '0 0 0 3px rgba(59,139,255,.75), 0 30px 70px -20px rgba(59,139,255,.5)', duration: 0.6 }, at('segment', 1))
    to(cards[0], { boxShadow: '0 0 0 3px rgba(59,139,255,.75), 0 30px 70px -20px rgba(59,139,255,.5)' }, { boxShadow: '0 0 0 0 rgba(59,139,255,0)', duration: 0.5 }, at('segment', 2))
    pop(q(cards[1], '.row'), at('segment', 2) + 0.2, { st: 0.2, y: 14 })
    pop(q(cards[2], '.row'), at('segment', 2) + 1.4, { st: 0.2, y: 14 })
    pop(q(el, '.badge'), at('segment', 3) + 0.3, { st: 0.25, y: -20, s: 0.6, ease: 'back.out(2.4)' })
    pop(q(el, '.found'), at('segment', 3) + 2.2, { y: 20 })
  }

  // 3 · Neden biz
  {
    const A = [
      ['handshake', 'Ajans', 'İnsan yaratıcılığı', 'Pahalı ve yavaş'],
      ['palette', 'Tasarım ve zamanlama araçları', 'Ucuz ve kolay', 'Düşünme işi sizde'],
      ['layers', 'Platform panelleri', 'Doğrudan ve ücretsiz', 'Kanal başına ayrı'],
      ['bot', 'Genel sohbet yapay zekâsı', 'Esnek', 'Hafıza, yayın, ölçüm yok'],
    ]
    const V = [['target', 'Planlar'], ['sparkles', 'Üretir'], ['send', 'Yayınlar'], ['chart-line', 'Ölçer'], ['brain', 'Hatırlar']]
    const el = scene('alternatives', '03 · Rekabet', 'Neden biz?', `
      ${A.map(([n, h, p, no], k) => `<div class="card alt" style="left:${122 + k * 432}px;top:290px"><div class="ic">${ic(n)}</div><h4>${h}</h4><p>${p}</p><div class="no">${ic('x')}${no}</div></div>`).join('')}
      <svg class="links" style="opacity:0" id="orbit-ring"><ellipse cx="960" cy="560" rx="420" ry="230" fill="none" stroke="rgba(150,180,255,.35)" stroke-width="2" stroke-dasharray="6 10"/></svg>
      <div class="hub" style="top:560px;opacity:0"><div><img src="img/logo.svg" alt=""><b>KODARYUM</b></div></div>
      ${V.map(([n, w], k) => { const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5; return `<div class="orb" style="left:${960 + 420 * Math.cos(a)}px;top:${560 + 230 * Math.sin(a)}px">${ic(n, 'color:#f6a21e')}${w}</div>` }).join('')}
      <div class="chip" style="position:absolute;left:50%;top:830px;transform:translateX(-50%);opacity:0" id="alt-tr">${ic('map-pin', 'width:20px;height:20px;color:#22c08a')} Türkçe · WhatsApp · Google Haritalar · yerel mevzuat</div>`)
    pop(q(el, '.alt'), at('alternatives', 0) + 0.3, { st: 0.28 })
    pop(q(el, '.alt .no'), at('alternatives', 1) + 0.3, { st: 0.35, y: -16, s: 0.7, ease: 'back.out(2.2)' })
    const t2 = at('alternatives', 2)
    out(q(el, '.alt'), t2, 0.6, { y: -40, s: 0.9, st: 0.06 })
    fadeIn(q(el, '#orbit-ring'), t2 + 0.5, 0.8)
    pop(q(el, '.hub'), t2 + 0.5, { y: 0, s: 0.4, d: 0.9, ease: 'back.out(1.7)' })
    pop(q(el, '.orb'), t2 + 1.1, { st: 0.22, y: 0, s: 0.5 })
    tl.fromTo(q(el, '#alt-tr'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, t2 + 2.6)
  }

  // 4 · Vizyon
  {
    const DF = [['target', 'Sonuç odaklı', 'Lead, randevu ve satışla ölçülür', C.orange], ['brain', 'Marka hafızası', 'İşletmeyi tanır, her hafta öğrenir', C.violet], ['shield-check', 'Onay-önce otopilot', 'Sahibi bilmeden hiçbir şey yayınlanmaz', C.green], ['map-pin', 'Yerel ve Türkçe', 'WhatsApp, Google Haritalar, özel günler', C.blue], ['users', 'Ekip hissi', '3B ofiste isimli ajanlar çalışır', C.pink], ['layers', 'Ölçeğe hazır', 'Tek şubeden çok markalı gruba', C.cyan]]
    const RL = [['star', 'Sahte yorum'], ['users', 'Sahte takipçi'], ['mail', 'İzinsiz mesaj'], ['megaphone', 'Yanıltıcı iddia']]
    const el = scene('vision', '04 · Vizyon', 'Ürün tezi', `
      <div class="big"><span class="strike">Araç</span> değil, <span class="res">iş sonucu.</span></div>
      <div class="phone" style="left:300px;top:240px;height:600px"><div class="scr">
        <div style="position:absolute;left:24px;top:46px;font-size:15px;color:#93a3c8;font-weight:700;letter-spacing:.06em">BUGÜN · 3 ONAY</div>
        <div style="position:absolute;left:24px;top:68px;font-size:26px;font-weight:800">Merhaba Ayşe Hanım</div>
        <div class="appcard" id="ph-c1" style="top:120px"><h5>INSTAGRAM · CUMA 12:30</h5><p>Hafta sonu kampanyası: aynı gün teslimat, WhatsApp’tan tek mesajla sipariş.</p><div class="btn" id="ph-btn" style="margin-top:14px">${ic('check', 'width:20px;height:20px')} Onayla</div></div>
        <div class="appcard" style="top:330px"><h5>GOOGLE · YORUM YANITI</h5><p>“Teşekkür ederiz, tekrar bekleriz!”</p></div>
        <div class="appcard" style="top:450px"><h5>E-POSTA · 18:00</h5><p>Kasım bülteni hazır</p></div>
        <div class="tap" id="ph-tap" style="left:160px;top:288px"></div>
      </div><div class="notch"></div></div>
      <div id="vis-txt" style="position:absolute;left:760px;top:300px;width:1000px">
        <div style="font-size:24px;font-weight:800;color:#f6a21e;letter-spacing:.14em">KODARYUM PAZARLAMA</div>
        <div style="font-size:66px;font-weight:800;line-height:1.08;margin-top:12px">İşletmenizin cebindeki<br>pazarlama departmanı</div>
        <div style="display:flex;gap:12px;margin-top:30px">${['Planlar', 'Üretir', 'Yayınlar', 'Ölçer', 'Öğrenir'].map((w) => `<span class="chip">${w}</span>`).join('')}</div>
        <div style="font-size:28px;color:#c4d0f0;margin-top:28px;display:flex;gap:12px;align-items:center">${ic('hand', 'width:30px;height:30px;color:#22c08a')} Siz yalnızca onaylarsınız.</div>
      </div>
      ${DF.map(([n, h, p, col], k) => `<div class="card diff" style="left:${121 + k * 281}px;top:330px">${box(n, col, 70, 36)}<h4>${h}</h4><p>${p}</p></div>`).join('')}
      <div id="rl-h" style="position:absolute;left:0;right:0;top:290px;text-align:center;font-size:22px;font-weight:800;letter-spacing:.2em;color:#f0545a;opacity:0">KIRMIZI ÇİZGİLER</div>
      ${RL.map(([n, w], k) => `<div class="redline" style="left:${560 + (k % 2) * 420}px;top:${350 + Math.floor(k / 2) * 150}px"><div class="ic">${ic(n)}<span class="ban">${ic('ban')}</span></div>${w}</div>`).join('')}`)
    const v0 = at('vision', 0)
    pop(q(el, '.big'), v0 + 0.2, { y: 40, d: 0.9, ease: 'power3.out' })
    const st = q(el, '.strike')[0]
    to(st, { '--s': 0 }, { '--s': 1, duration: 0.6, ease: 'power2.inOut' }, v0 + 1.6)
    to(q(el, '.res'), { scale: 1 }, { scale: 1.06, duration: 0.4, yoyo: true, repeat: 1, transformOrigin: 'left center' }, v0 + 2.3)
    const v1 = at('vision', 1)
    out(q(el, '.big'), v1, 0.5, { y: -60 })
    pop(q(el, '.phone'), v1 + 0.3, { y: 80, d: 0.9, ease: 'power3.out' })
    pop(q(el, '#vis-txt > *'), v1 + 0.7, { st: 0.25, y: 30 })
    tl.fromTo(q(el, '#ph-tap'), { opacity: 0, scale: 0.4 }, { keyframes: [{ opacity: 1, scale: 1, duration: 0.25 }, { opacity: 0, scale: 1.6, duration: 0.5 }] }, v1 + 3.2)
    to(q(el, '#ph-btn'), { background: 'linear-gradient(180deg,#3b8bff,#2563eb)' }, { background: 'linear-gradient(180deg,#22c08a,#16a06f)', duration: 0.3 }, v1 + 3.35)
    const btn = q(el, '#ph-btn')[0]
    DYN.push((t) => { const on = t >= v1 + 3.35; if (btn.dataset.on !== String(on)) { btn.dataset.on = on; btn.innerHTML = on ? `${ic('check-check', 'width:20px;height:20px')} Yayına alındı` : `${ic('check', 'width:20px;height:20px')} Onayla` } })
    const v2 = at('vision', 2)
    out(q(el, '.phone, #vis-txt'), v2, 0.5, { y: -40 })
    pop(q(el, '.diff'), v2 + 0.4, { st: 0.32 })
    const v3 = at('vision', 3)
    out(q(el, '.diff'), v3, 0.5, { y: -40, st: 0.04 })
    fadeIn(q(el, '#rl-h'), v3 + 0.4)
    pop(q(el, '.redline'), v3 + 0.5, { st: 0.3, s: 0.85 })
    q(el, '.redline .ban').forEach((b, k) => tl.fromTo(b, { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, v3 + 1.0 + k * 0.3))
  }

  // 5 · Bugün
  {
    const MS = [['brain', 'Marka hafızası'], ['pencil', 'İçerik üretimi'], ['inbox', 'Onay kuyruğu'], ['link', 'Kanal bağlantıları'], ['chart-line', 'Gerçek ölçüm']]
    const el = scene('today', '05 · Bugün', 'Bugün neredeyiz?', `
      <div class="shot" style="left:310px;top:258px;width:1300px;height:569px"><img src="img/ofis.jpg" alt=""></div>
      ${[['map-pin', 'Pazarlama odası', 250, 640], ['users', '4 yapay zekâ çalışanı', 250, 760], ['list-checks', 'Görev akışı', 1480, 300], ['chart-pie', 'Örnek verili pano', 1440, 690]].map(([n, w, x, y]) => `<div class="tag" style="left:${x}px;top:${y}px">${ic(n)}${w}</div>`).join('')}
      ${MS.map(([n, w], k) => `<div class="miss" style="left:1160px;top:${262 + k * 96}px">${ic(n)}${w}<span class="pill">YOK</span></div>`).join('')}
      <div class="card" id="br-l" style="left:180px;top:340px;width:400px;height:300px;padding:34px;text-align:center">${box('eye', C.slate, 90, 48).replace('class="ic"', 'class="ic" style="margin:0 auto"')}<h3 style="font-size:42px;font-weight:800;margin-top:14px">Demo</h3><p style="font-size:21px;color:#93a3c8;margin-top:6px">Örnek veri · tarayıcıda simülasyon</p></div>
      <div class="card" id="br-r" style="left:1340px;top:340px;width:400px;height:300px;padding:34px;text-align:center">${box('rocket', C.orange, 90, 48).replace('class="ic"', 'class="ic" style="margin:0 auto"')}<h3 style="font-size:42px;font-weight:800;margin-top:14px">Ürün</h3><p style="font-size:21px;color:#93a3c8;margin-top:6px">Gerçek işletme · gerçek kanal</p></div>
      ${[['database', 'Kalıcı veritabanı'], ['workflow', 'İş kuyruğu ve zamanlayıcı'], ['key-round', 'Şifreli anahtar yönetimi']].map(([n, w], k) => `<div class="blk" style="top:${330 + k * 100}px">${ic(n)}${w}</div>`).join('')}
      <div class="arrow" id="br-a" style="left:600px;top:660px;width:720px"></div>
      <div id="br-t" style="position:absolute;left:0;right:0;top:690px;text-align:center;font-size:24px;font-weight:800;color:#f6a21e;letter-spacing:.12em">GERÇEK ARKA UÇ</div>`)
    const s0 = at('today', 0)
    const shot = q(el, '.shot')
    pop(shot, s0 + 0.2, { y: 50, d: 1, ease: 'power3.out' })
    to(q(el, '.shot img'), { scale: 1 }, { scale: 1.07, duration: segDur('today', 0) + 1, ease: 'none' }, s0)
    pop(q(el, '.tag'), s0 + 1.0, { st: 0.45, s: 0.7, ease: 'back.out(2)' })
    const s1 = at('today', 1)
    out(q(el, '.tag'), s1, 0.4)
    to(shot, { left: 310, top: 258, width: 1300, height: 569, opacity: 1 }, { left: 120, top: 330, width: 960, height: 420, opacity: 0.55, duration: 0.9, ease: 'power3.inOut' }, s1)
    pop(q(el, '.miss'), s1 + 0.7, { st: 0.32, y: 0, s: 1 })
    tl.fromTo(q(el, '.miss'), { x: 60 }, { x: 0, duration: 0.6, stagger: 0.32, ease: 'power3.out' }, s1 + 0.7)
    pop(q(el, '.miss .pill'), s1 + 1.1, { st: 0.32, s: 0.4, y: 0, ease: 'back.out(3)' })
    const s2 = at('today', 2)
    out(q(el, '.miss'), s2, 0.4, { st: 0.04 })
    out(shot, s2, 0.4)
    pop(q(el, '#br-l, #br-r'), s2 + 0.4, { st: 0.25 })
    tl.fromTo(q(el, '#br-a'), { scaleX: 0 }, { scaleX: 1, duration: 1.0, ease: 'power2.inOut' }, s2 + 0.9)
    pop(q(el, '.blk'), s2 + 1.4, { st: 0.35, y: -30 })
    fadeIn(q(el, '#br-t'), s2 + 2.4)
  }

  // 6 · Döngü
  {
    const N = [['Anla', 'İşletme profili, hedef, bütçe', C.blue], ['Planla', '30 günlük plan ve takvim', C.violet], ['Üret', 'İçerik, reklam, e-posta, görsel', C.orange], ['Onayla', 'Sahibine tek dokunuş', C.red], ['Yayınla', 'Doğru kanal, doğru saat', C.green], ['Ölç', 'Atıf, ROI, haftalık rapor', C.cyan], ['Öğren', 'Sonuç marka hafızasına', C.pink]]
    const R = 262
    const LD = [['0', 'Öner', 'Sistem fikir ve taslak gösterir', C.slate], ['1', 'Hazırla', 'Yayına hazır içerik onay kuyruğuna düşer', C.blue], ['2', 'Onayla ve yayınla', 'Sahibi onaylar, sistem zamanlar ve yayınlar', C.violet], ['3', 'Sınırlar içinde otonom', 'Düşük riskli işleri kendisi yapar; bütçe tavanı serttir', C.green]]
    const el = scene('loop', '06 · Döngü', 'Pazarlama operasyon döngüsü', `
      <div class="loopwrap" id="lw">
        <svg style="position:absolute;left:-300px;top:-300px;width:600px;height:600px;overflow:visible"><circle id="lring" cx="300" cy="300" r="${R}" fill="none" stroke="rgba(150,180,255,.35)" stroke-width="3" stroke-dasharray="${(2 * Math.PI * R).toFixed(1)}" stroke-dashoffset="${(2 * Math.PI * R).toFixed(1)}" transform="rotate(-90 300 300)"/></svg>
        <div id="lpulse" style="position:absolute;left:0;top:0;width:0;height:0"><i style="position:absolute;left:-11px;top:${-R - 11}px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 0 24px 8px rgba(120,170,255,.8)"></i></div>
        <div class="loopcore"><div><b>PAZARLAMA</b><span>her hafta kendini geliştirir</span></div></div>
        ${N.map(([h, p, col], k) => { const a = -Math.PI / 2 + (k * 2 * Math.PI) / 7; const x = R * Math.cos(a); const y = R * Math.sin(a); const right = Math.cos(a) > -0.05; const center = false; return `<div class="loopnode" style="left:${x}px;top:${y}px" data-c="${col}"><div class="dot">${k + 1}</div><div class="lab" style="${center ? 'left:-150px;width:300px;text-align:center;top:-118px' : right ? 'left:58px' : 'right:58px;text-align:right'}"><b>${h}</b><span>${p}</span></div></div>` }).join('')}
      </div>
      <div class="ladder">${LD.map(([n, h, p, col], k) => `<div class="step" style="top:${(3 - k) * 116}px;left:${k * 18}px;width:${640 - k * 18}px"><div class="n" style="background:${tint(col, 0.22)};color:${col}">${n}</div><div><h4>${h}</h4><p>${p}</p></div></div>`).join('')}
        <div style="position:absolute;left:-58px;top:20px;bottom:-440px;width:6px;border-radius:6px;background:linear-gradient(0deg,#64748b,#22c08a)" id="lad-ar"></div>
        <div style="position:absolute;left:-150px;top:-36px;font-size:18px;font-weight:800;color:#22c08a;letter-spacing:.08em" id="lad-t">GÜVEN ARTTIKÇA ↑</div></div>`)
    const lw = q(el, '#lw')[0]
    const l0 = at('loop', 0)
    tl.fromTo(q(el, '#lring'), { strokeDashoffset: 2 * Math.PI * R }, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' }, l0 + 0.2)
    pop(q(el, '.loopcore'), l0 + 0.4, { y: 0, s: 0.6 })
    const nodes = q(el, '.loopnode')
    pop(nodes, l0 + 0.6, { st: 0.12, y: 0, s: 0.4, d: 0.5 })
    const light = (ks, t) =>
      ks.forEach((k, i) => {
        const d = q(nodes[k], '.dot')[0]
        const col = nodes[k].dataset.c
        to(d, { backgroundColor: '#1b2a5a', scale: 1, color: '#93a3c8' }, { backgroundColor: col, scale: 1.18, color: '#ffffff', duration: 0.45, ease: 'back.out(2)' }, t + i * 0.75)
        to(d, { boxShadow: `0 0 0 0 ${tint(col, 0)}` }, { boxShadow: `0 0 0 10px ${tint(col, 0.2)}, 0 0 40px ${tint(col, 0.6)}`, duration: 0.45 }, t + i * 0.75)
      })
    light([0, 1, 2], at('loop', 1) + 0.3)
    light([3, 4], at('loop', 2) + 0.3)
    light([5, 6], at('loop', 3) + 0.3)
    const p0 = at('loop', 3) + 1.6
    fadeIn(q(el, '#lpulse'), p0, 0.4)
    tl.fromTo(q(el, '#lpulse'), { rotation: 0 }, { rotation: 360, duration: 4, ease: 'none', repeat: Math.ceil((S1('loop') - p0) / 4) }, p0)
    const l4 = at('loop', 4)
    to(lw, { x: 0, scale: 1 }, { x: -440, scale: 0.78, duration: 1, ease: 'power3.inOut' }, l4)
    pop(q(el, '.step'), l4 + 0.7, { st: 0.4, y: 30 })
    fadeIn(q(el, '#lad-ar, #lad-t'), l4 + 0.7, 0.6)
  }

  // 7 · 12 modül
  {
    const L = [
      ['TEMEL', C.blue, [['M1', 'Marka hafızası'], ['M2', 'Rakip istihbaratı'], ['M10', 'Onay ve güvenlik']]],
      ['ÜRETİM', C.violet, [['M3', 'Strateji motoru'], ['M4', 'İçerik fabrikası'], ['M12', 'Görsel stüdyo']]],
      ['YAYIN VE\nBÜYÜME', C.orange, [['M5', 'Kanal bağlantıları'], ['M6', 'Yerel SEO, yorum'], ['M7', 'Reklam otopilotu'], ['M8', 'WhatsApp asistanı']]],
      ['ÖLÇÜM', C.green, [['M9', 'Analitik, rapor'], ['M11', 'E-ticaret verisi']]],
    ]
    const mods = L.map(([name, col, ms], i) => {
      const w = (820 - 132 - 18 - 10 * (ms.length - 1) - 12) / ms.length
      return `<div class="layer" style="top:${i * 140}px;height:128px"><div class="ln" style="background:${col}">${name.replace('\n', '<br>')}</div>${ms.map(([c, n], k) => `<div class="mod" data-m="${c}" style="left:${144 + k * (w + 10)}px;width:${w}px"><b style="color:${col}">${c}</b><span>${n}</span></div>`).join('')}</div>`
    }).join('')
    const chips = (arr, col = '#c4d0f0', bg = 'rgba(255,255,255,.07)') => arr.map((x) => `<span class="mini" style="color:${col};background:${bg}">${x}</span>`).join('')
    const DET = {
      M1: ['Marka hafızası', '15 dakikada işletmeyi tanır', C.blue, `
        <div class="kvr" style="top:0"><small>SES TONU</small><div class="sld"><span>Resmî</span><div class="tr"><i id="m1k"></i></div><span>Samimi</span></div></div>
        <div class="kvr" style="top:92px"><small>ÜRÜN VE FİYAT</small><div>${chips(['Gül buketi · ₺750', 'Orkide · ₺1.200', 'Aynı gün teslimat'])}</div></div>
        <div class="kvr" style="top:184px"><small>HEDEF KİTLE</small><div>${chips(['25–45 yaş', 'Şehir içi', 'Hediye alanlar'])}</div></div>
        <div class="kvr" style="top:276px"><small>YASAKLAR</small><div>${chips(['“En ucuz” iddiası', 'Rakip adı', 'Uydurma indirim'], '#ffb2b5', 'rgba(240,84,90,.16)')}</div></div>
        <div class="tmr"><b id="m1t">0</b><span>dk kurulum</span></div>`],
      M4: ['İçerik fabrikası', 'Her kanal için marka sesiyle, Türkçe', C.violet, `
        <div class="flow">${[['file-text', 'Brief'], ['sparkles', '3 varyant'], ['shield-check', 'Marka Koruyucu'], ['inbox', 'Onay kuyruğu']].map(([n, w], k) => `<div class="fn" style="left:${k * 215}px">${box(n, [C.blue, C.violet, C.green, C.orange][k], 78, 40)}<b>${w}</b></div>`).join('')}
          ${[0, 1, 2].map((k) => `<i class="fd" id="fd${k}"></i>`).join('')}</div>
        <div class="sample"><small>INSTAGRAM · VARYANT B</small><p>Anneler Günü için ön siparişler açıldı. Aynı gün teslimat; WhatsApp’tan tek mesajla sipariş verin.</p>
          <div>${chips(['Ton ✓', 'Fiyat doğrulandı ✓', 'Yasaklı kelime yok ✓'], '#9ff0cf', 'rgba(34,192,138,.16)')}</div></div>`],
      M6: ['Yerel SEO ve yorumlar', 'Küçük işletme için en hızlı kazanım', C.orange, `
        <div class="gprof"><b>Çiçek Dünyası Butik</b><small>Çiçekçi · Kadıköy · örnek</small>
          <div class="rate"><span id="m6r">4,1</span><span class="stars">${[0, 1, 2, 3, 4].map(() => ic('star', 'width:26px;height:26px;color:#fbbf24', true)).join('')}</span></div>
          <div class="rv"><span id="m6c">38</span> yorum</div>
          <small style="display:block;margin-top:18px">PROFİL TAMLIĞI</small><div class="gbar"><i id="m6b" style="background:#22c08a"></i></div></div>
        <div class="rvw"><div class="q">“Çok hızlı teslim ettiler, çiçekler harikaydı!” <small>★★★★★</small></div>
          <div class="ans"><small>YANIT TASLAĞI</small>Teşekkür ederiz! Sizi yeniden görmekten mutluluk duyarız.<span class="pill" style="background:rgba(246,162,30,.2);color:#ffc46b;margin-top:10px">Onay bekliyor</span></div></div>`],
      M7: ['Reklam otopilotu', 'Küçük bütçe, sert güvenlik sınırları', C.orange, `
        <small class="lbl">GÜNLÜK HARCAMA</small><div class="spend"><i id="m7f"></i><em style="left:80%"></em><span style="left:80%">Tavan ₺500</span></div><div class="spv"><b id="m7v">₺0</b> harcandı · tavanın altında</div>
        <div class="rule">${ic('zap', 'width:28px;height:28px;color:#f6a21e')}<div>Müşteri başı maliyet hedefin <b>1,5 katını 3 gün</b> aşarsa → duraklatma önerisi</div></div>
        <div class="kp2"><div><small>MÜŞTERİ BAŞI MALİYET · ÖRNEK</small><b id="m7c">₺62</b></div><div><small>BÜTÇE NEREDE?</small><p>${ic('lock', 'width:22px;height:22px;color:#22c08a')} İşletmenin kendi reklam hesabında</p></div></div>`],
      M8: ['WhatsApp asistanı', 'Gelen talebi kaçırmamak', C.green, `
        <div class="wa"><div class="wah">${ic('message-circle', 'width:22px;height:22px')} Çiçek Dünyası · dijital asistan</div>
          <div class="b in" style="top:62px">Merhaba, yarın 14:00 için randevu var mı?</div>
          <div class="b ty" style="top:134px"><i></i><i></i><i></i></div>
          <div class="b me" style="top:134px">Merhaba! Yarın 14:00 ve 16:30 müsait. Hangisini ayırayım?</div>
          <div class="b in" style="top:230px">14:00 olsun.</div>
          <div class="b me" style="top:290px">Ayırdım ✓ Görüşmek üzere!</div></div>
        <div class="wab">${[['timer', 'İlk yanıt', '38 sn'], ['calendar', 'Randevu', 'Oluşturuldu'], ['shield-check', 'İzin kaydı', 'Tutuldu']].map(([n, a, b]) => `<div class="card">${box(n, C.green, 52, 28)}<div><small>${a}</small><b>${b}</b></div></div>`).join('')}</div>`],
      M9: ['Patron raporu', 'Her hafta tek sayfa · örnek', C.green, `
        <div class="rep">${[['check-check', 'Ne yaptık', '18 gönderi · 4 yorum yanıtı · 2 e-posta', C.blue], ['trending-up', 'Ne kazandırdı', '<span id="m9l">0</span> müşteri adayı · <b style="color:#22c08a">+%38</b>', C.green], ['lightbulb', 'Ne öğrendik', 'Hikâyeler gönderilerden 2 kat etkileşim aldı', C.orange], ['calendar', 'Gelecek hafta', 'Anneler Günü kampanyası · onayınız bekleniyor', C.violet]].map(([n, h, p, col]) => `<div class="rt">${box(n, col, 50, 26)}<h5>${h}</h5><p>${p}</p></div>`).join('')}</div>`],
    }
    const el = scene('modules', '07 · Ürün', '12 modül, dört katman', `
      <div class="mmap" style="top:262px">${mods}</div>
      ${Object.entries(DET).map(([k, [h, sm, col, body]]) => `<div class="card detail" id="d-${k}" style="top:262px;height:568px"><div class="hd"><div class="code" style="background:${tint(col, 0.2)};color:${col}">${k}</div><h3>${h}<small>${sm}</small></h3></div><div class="body">${body}</div></div>`).join('')}`)
    const map = q(el, '.mmap')[0]
    const m0 = at('modules', 0)
    gsap.set(map, { x: 430 })
    pop(q(el, '.layer'), m0 + 0.3, { st: 0.25, y: 20 })
    pop(q(el, '.mod'), m0 + 0.6, { st: 0.1, y: 10, s: 0.9, d: 0.45 })
    to(map, { x: 430 }, { x: 0, duration: 1, ease: 'power3.inOut' }, at('modules', 1) - 0.2)
    const order = ['M1', 'M4', 'M6', 'M7', 'M8', 'M9']
    order.forEach((k, i) => {
      const s = at('modules', i + 1)
      const e = end('modules', i + 1)
      const d = q(el, `#d-${k}`)[0]
      const chip = q(el, `.mod[data-m="${k}"]`)[0]
      tl.fromTo(d, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }, s + 0.2)
      if (i < order.length - 1) tl.fromTo(d, { opacity: 1, x: 0 }, { opacity: 0, x: -40, duration: 0.4, immediateRender: false }, e - 0.4)
      to(chip, { borderColor: 'rgba(150,180,255,.25)', boxShadow: '0 0 0 0 rgba(246,162,30,0)', scale: 1 }, { borderColor: '#f6a21e', boxShadow: '0 0 0 3px rgba(246,162,30,.35), 0 0 40px rgba(246,162,30,.35)', scale: 1.04, duration: 0.4 }, s)
      if (i < order.length - 1) to(chip, { borderColor: '#f6a21e', boxShadow: '0 0 0 3px rgba(246,162,30,.35), 0 0 40px rgba(246,162,30,.35)', scale: 1.04 }, { borderColor: 'rgba(150,180,255,.25)', boxShadow: '0 0 0 0 rgba(246,162,30,0)', scale: 1, duration: 0.4 }, e - 0.3)
      pop(q(d, '.body > *, .body .kvr'), s + 0.6, { st: 0.22, y: 16 })
    })
    // M1
    {
      const s = at('modules', 1)
      tl.fromTo(q(el, '#m1k'), { left: '12%' }, { left: '70%', duration: 1.4, ease: 'power2.inOut' }, s + 1.2)
      count(q(el, '#m1t')[0], s + 0.8, s + 4, 0, 15)
    }
    // M4: akış noktaları
    {
      const s = at('modules', 2)
      q(el, '.fd').forEach((d, k) => {
        tl.fromTo(d, { x: 36, y: 0, opacity: 0 }, { keyframes: [{ opacity: 1, duration: 0.2 }, { x: 251, y: (k - 1) * 26, duration: 0.9, ease: 'power2.inOut' }, { x: 466, y: 0, duration: 0.9, ease: 'power2.inOut', delay: 0.3 }, { x: 682, y: 0, duration: 0.9, ease: 'power2.inOut', delay: 0.2 * k }, { opacity: 0, duration: 0.3 }], repeat: 1, repeatDelay: 0.6 }, s + 1.0 + k * 0.25)
      })
    }
    // M6
    {
      const s = at('modules', 3)
      count(q(el, '#m6r')[0], s + 1, s + 5, 4.1, 4.7, (v) => v.toFixed(1).replace('.', ','))
      count(q(el, '#m6c')[0], s + 1, s + 5, 38, 126)
      tl.fromTo(q(el, '#m6b'), { width: '54%' }, { width: '96%', duration: 3.5, ease: 'power2.out' }, s + 1.2)
    }
    // M7
    {
      const s = at('modules', 4)
      tl.fromTo(q(el, '#m7f'), { width: '0%' }, { width: '68%', duration: 3, ease: 'power2.out' }, s + 1)
      count(q(el, '#m7v')[0], s + 1, s + 4, 0, 340, (v) => '₺' + Math.round(v))
      count(q(el, '#m7c')[0], s + 2.5, s + 6, 62, 46, (v) => '₺' + Math.round(v))
    }
    // M8: sohbet
    {
      const s = at('modules', 5)
      const B = q(el, '#d-M8 .b')
      pop(B[0], s + 0.9, { y: 14 })
      tl.fromTo(B[1], { opacity: 0 }, { keyframes: [{ opacity: 1, duration: 0.2 }, { opacity: 1, duration: 1.2 }, { opacity: 0, duration: 0.2 }] }, s + 1.6)
      pop(B[2], s + 3.1, { y: 14 })
      pop(B[3], s + 4.6, { y: 14 })
      pop(B[4], s + 5.6, { y: 14 })
      pop(q(el, '#d-M8 .wab .card'), s + 3.3, { st: 0.6, y: 0, s: 0.8 })
    }
    // M9
    {
      const s = at('modules', 6)
      count(q(el, '#m9l')[0], s + 1.4, s + 4, 0, 212)
    }
  }

  // 8 · Pazarlama Merkezi
  {
    const items = [['Onay bekliyor', 'Hafta sonu kampanya gönderisi', C.red], ['Onay bekliyor', 'Sevgililer Günü reklam seti', C.red], ['Hazır', 'Instagram hikâyesi · 3 kare', C.green], ['Yayında', 'Google yorum yanıtı ×4', C.blue], ['Planlı', 'E-posta bülteni 18:00', C.slate]]
    const cols = [C.blue, C.violet, C.orange, C.green, C.red]
    let cal = ''
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) { const n = r * 7 + c; cal += `<div>${n + 1}${n % 3 !== 2 ? `<span style="top:${26}px;background:${cols[(r * 3 + c) % 5]}"></span>` : ''}${(r + c) % 2 && n % 3 !== 2 ? `<span style="top:${38}px;background:${cols[(r * 3 + c + 2) % 5]}"></span>` : ''}</div>` }
    const el = scene('screen', '08 · Deneyim', 'Pazarlama Merkezi', `
      <div class="ui"><div class="bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i>&nbsp; Pazarlama Merkezi · Çiçek Dünyası Butik <small>Örnek ekran · bu ay 18 gönderi · 6 reklam · 2 e-posta</small></div>
        <div class="col" style="left:20px;width:400px"><h5>BUGÜN İÇİN 5 İŞ</h5>${items.map(([a, b, c]) => `<div class="it"><i style="background:${c}"></i><div><b style="color:${c}">${a}</b>${b}</div></div>`).join('')}<div class="btn" style="margin-top:6px">${ic('check-check', 'width:20px;height:20px')} Tümünü onayla (2)</div></div>
        <div class="col" style="left:440px;width:640px"><h5>İÇERİK TAKVİMİ · KASIM</h5><div class="cal">${cal}</div></div>
        <div class="col" style="left:1100px;width:480px"><h5>SONUÇLAR · 30 GÜN</h5>
          <div class="kpi"><small>Yeni müşteri adayı</small><b id="k1">0</b><em>+%38</em></div>
          <div class="kpi"><small>WhatsApp randevu</small><b id="k2">0</b><em>+%21</em></div>
          <div class="kpi"><small>Reklam harcaması</small><b id="k3">₺0</b></div>
          <div class="kpi" style="border:0"><small>Müşteri başı maliyet</small><b id="k4">₺0</b><em>−%17</em></div></div>
      </div>
      ${[[180, 324, 400, 496], [600, 324, 640, 496], [1260, 324, 480, 496]].map(([x, y, w, h]) => `<div class="hl" style="left:${x - 4}px;top:${y - 4}px;width:${w + 8}px;height:${h + 8}px"></div>`).join('')}
      <div class="onb"><div class="track"><div class="fill" id="onbf"></div></div>
        ${[['link', '0–2 dk', 'URL girin'], ['message-circle', '2–6 dk', 'Marka röportajı'], ['gauge', '6–9 dk', 'Pazarlama karnesi'], ['sparkles', '9–13 dk', 'İlk 5 gönderi'], ['calendar', '13–15 dk', 'Takvim + kanal']].map(([n, a, b], k) => `<div class="st" style="left:${k * 25}%">${'<div class="ic">' + ic(n) + '</div>'}<div class="dk">${a}</div><h4>${b}</h4></div>`).join('')}
        <div id="onbh" style="position:absolute;left:0;right:0;top:-110px;text-align:center"><span style="font-size:76px;font-weight:800" id="onbn">0</span><span style="font-size:30px;color:#93a3c8;font-weight:700"> / 15 dakika · ilk değer anı</span></div></div>`)
    const s0 = at('screen', 0)
    pop(q(el, '.ui'), s0 + 0.2, { y: 60, d: 1, ease: 'power3.out' })
    pop(q(el, '.ui .col'), s0 + 0.7, { st: 0.25, y: 20 })
    pop(q(el, '.ui .it'), s0 + 1.0, { st: 0.12, y: 10, s: 1 })
    pop(q(el, '.cal span'), s0 + 1.3, { st: 0.012, y: 0, s: 0.3, d: 0.3 })
    count(q(el, '#k1')[0], s0 + 1.4, s0 + 4, 0, 212)
    count(q(el, '#k2')[0], s0 + 1.6, s0 + 4.2, 0, 64)
    count(q(el, '#k3')[0], s0 + 1.8, s0 + 4.4, 0, 9800, (v) => '₺' + Math.round(v).toLocaleString('tr-TR'))
    count(q(el, '#k4')[0], s0 + 2.0, s0 + 4.6, 0, 46, (v) => '₺' + Math.round(v))
    const s1 = at('screen', 1)
    const d1 = segDur('screen', 1)
    q(el, '.hl').forEach((h, k) => {
      const a = s1 + 0.3 + (k * (d1 - 0.6)) / 3
      tl.fromTo(h, { opacity: 0 }, { opacity: 1, duration: 0.35 }, a)
      tl.fromTo(h, { opacity: 1 }, { opacity: 0, duration: 0.3, immediateRender: false }, a + (d1 - 0.6) / 3 - 0.3)
    })
    const s2 = at('screen', 2)
    const d2 = segDur('screen', 2)
    out(q(el, '.ui'), s2, 0.5, { y: -40, s: 0.96 })
    pop(q(el, '.onb .st'), s2 + 0.4, { st: 0.15, y: 20 })
    fadeIn(q(el, '.onb .track, #onbh'), s2 + 0.3)
    tl.fromTo(q(el, '#onbf'), { width: '0%' }, { width: '100%', duration: d2 - 1.6, ease: 'none' }, s2 + 0.9)
    count(q(el, '#onbn')[0], s2 + 0.9, s2 + d2 - 0.7, 0, 15)
    q(el, '.onb .st .ic').forEach((c, k) => to(c, { backgroundColor: 'rgba(26,44,96,.7)', borderColor: 'rgba(160,185,255,.16)' }, { backgroundColor: 'rgba(59,139,255,.35)', borderColor: '#f6a21e', duration: 0.3 }, s2 + 0.9 + ((d2 - 1.6) * k) / 4))
  }

  // 9 · Paketler
  {
    const PK = [
      ['Başlangıç', 'Küçük işletme · 1–9 kişi', '₺2.500–3.500', '/ ay', ['2 kanal: Instagram + Google', '~30 içerik / ay', 'Haftalık patron raporu', 'Mobil ve WhatsApp’tan onay'], C.blue],
      ['Büyüme', 'Küçük–orta · 10–99 kişi', '₺7.000–10.000', '/ ay', ['5–6 kanal', '~120 içerik / ay', 'WhatsApp asistanı + CRM', 'Panolar + aylık danışma'], C.violet],
      ['Kurumsal', 'Orta–büyük · çok şube', 'Teklif', 'yıllık', ['Sınırsız kanal', 'Çok aşamalı onay', 'API + özel pano', 'Hesap yöneticisi + SLA'], C.orange],
    ]
    const el = scene('pricing', '09 · Paketler', 'Üç paket, sabit ve öngörülebilir fiyat', `
      ${PK.map(([h, w, a, p, li, col], k) => `<div class="card price" style="left:${121 + k * 590}px;top:262px;height:540px;${k === 1 ? 'box-shadow:0 0 0 2px rgba(139,92,246,.7),0 30px 80px -20px rgba(139,92,246,.5)' : ''}"><div style="height:6px;border-radius:6px;background:${col};margin-bottom:22px;width:80px"></div><h3>${h}</h3><div class="who">${w}</div><div class="amt">${a} <small>${p}</small></div><ul>${li.map((x) => `<li>${ic('check')}${x}</li>`).join('')}</ul></div>`).join('')}
      <div class="stamp">HİPOTEZ<small>10 pilot işletmeyle test edilecek</small></div>
      <div id="pr-ch" style="position:absolute;left:0;right:0;top:600px;display:flex;justify-content:center;gap:16px">${[['coins', 'Sabit aylık bedel'], ['wallet', 'Reklam bütçesi ayrı · sizin hesabınızda'], ['gift', '14 gün deneme']].map(([n, w]) => `<span class="chip" style="font-size:22px;padding:14px 22px;background:rgba(11,22,56,.92)">${ic(n, 'width:24px;height:24px;color:#f6a21e')}${w}</span>`).join('')}</div>`)
    const s0 = at('pricing', 0)
    pop(q(el, '.price'), s0 + 0.3, { st: 0.25 })
    pop(q(el, '.price li'), s0 + 1.0, { st: 0.06, y: 10, s: 1 })
    const s1 = at('pricing', 1)
    to(q(el, '.price'), { opacity: 1 }, { opacity: 0.28, duration: 0.5 }, s1 + 0.2)
    tl.fromTo(q(el, '.stamp'), { opacity: 0, scale: 2.4 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, s1 + 0.4)
    pop(q(el, '#pr-ch .chip'), s1 + 1.6, { st: 0.3, y: 20 })
  }

  // 10 · Ekip ve mimari
  {
    const RO = [['H', 'Hatice', 'Strateji ve marka', C.violet], ['E', 'Emine', 'İçerik', C.blue], ['Hü', 'Hüseyin', 'Sosyal medya', C.pink], ['M', 'Merve', 'Performans ve reklam', C.orange], ['map-pin', 'Yerel SEO', 'Google profili, yorum', C.green, 1], ['message-circle', 'WhatsApp ve CRM', 'Lead, randevu, takip', C.green, 1], ['chart-line', 'Analist', 'Ölçüm, atıf, rapor', C.cyan], ['shield-check', 'Marka Koruyucu', 'Her çıktıyı denetler', C.red, 1]]
    const cx = 960
    const cy = 500
    const XS = [330, 690, 1230, 1590]
    const pos = RO.map((_, k) => [XS[k % 4], k < 4 ? 318 : 668])
    const ST = [['smartphone', 'İstemci', 'React · 3B ofis · mobil onay'], ['server', 'API', 'Node.js · Cloud Run'], ['sparkles', 'Model', 'Gemini · Vertex AI'], ['database', 'Veritabanı', 'PostgreSQL + vektör arama'], ['workflow', 'İş kuyruğu', 'Cloud Tasks · zamanlayıcı'], ['key-round', 'Güvenlik', 'Secret Manager · KMS']]
    const el = scene('team', '10 · Ekip ve mimari', 'Sekiz rol, bir orkestratör', `
      <svg class="links">${pos.map(([x, y]) => `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(150,180,255,.4)" stroke-width="2.5" stroke-dasharray="900" stroke-dashoffset="900"/>`).join('')}</svg>
      <div class="node" id="kagan" style="left:${cx}px;top:${cy - 70}px"><div class="av" style="width:140px;height:140px;background:linear-gradient(135deg,#7c3aed,#3b8bff);box-shadow:0 0 70px rgba(124,58,237,.6)">${ic('crown', 'width:60px;height:60px')}</div><b style="font-size:30px">Kağan</b><span>CEO · orkestratör</span></div>
      ${RO.map(([a, n, r, col, nw], k) => `<div class="node rn" style="left:${pos[k][0]}px;top:${pos[k][1] - 52}px"><div class="av" style="background:${col}">${a.length > 2 ? ic(a) : a}</div><b>${n}</b><span>${r}</span>${nw ? '<span class="pill new" style="background:rgba(246,162,30,.22);color:#ffc46b">YENİ ROL</span>' : ''}</div>`).join('')}
      <div class="stack">${ST.map(([n, h, s], k) => `<div class="lay" style="top:${k * 96}px;background:linear-gradient(90deg,${tint([C.blue, C.blue, C.violet, C.violet, C.orange, C.green][k], 0.32)},rgba(18,32,72,.6))">${ic(n)}${h}<small>${s}</small></div>`).join('')}</div>
      <div id="gc" style="position:absolute;right:150px;top:400px;text-align:center;opacity:0">${ic('cloud', 'width:120px;height:120px;color:#8fbaff')}<div style="font-size:24px;font-weight:800;margin-top:6px">Google Cloud</div></div>`)
    const s0 = at('team', 0)
    pop(q(el, '#kagan'), s0 + 0.3, { y: 0, s: 0.5, d: 0.9 })
    const s1 = at('team', 1)
    tl.fromTo(q(el, '.links line'), { strokeDashoffset: 900 }, { strokeDashoffset: 0, duration: 0.8, stagger: 0.35, ease: 'power2.out' }, s1 + 0.2)
    pop(q(el, '.rn'), s1 + 0.4, { st: 0.35, y: 0, s: 0.5 })
    const s2 = at('team', 2)
    out(q(el, '.rn, #kagan'), s2, 0.5, { st: 0.03, s: 0.8 })
    to(q(el, '.links'), { opacity: 1 }, { opacity: 0, duration: 0.4 }, s2)
    pop(q(el, '.lay'), s2 + 0.5, { st: 0.3, y: -40 })
    fadeIn(q(el, '#gc'), s2 + 2.2, 0.8)
  }

  // 11 · Sektörler
  {
    const SE = [['utensils', 'Restoran / kafe'], ['scissors', 'Kuaför / güzellik'], ['stethoscope', 'Klinik'], ['shopping-bag', 'Butik'], ['shopping-cart', 'E-ticaret'], ['hotel', 'Otel / turizm'], ['house', 'Emlak'], ['graduation-cap', 'Eğitim / kurs'], ['code', 'B2B yazılım'], ['factory', 'Üretici'], ['dumbbell', 'Spor salonu'], ['car', 'Oto servis']]
    const cl = [C.orange, C.pink, C.cyan, C.violet, C.blue, C.green]
    const el = scene('sectors', '11 · Sektörler', 'Boş sayfa yok: hazır kampanya kitapları', `
      ${SE.map(([n, w], k) => `<div class="card sec" style="left:${131 + (k % 6) * 280}px;top:${k < 6 ? 262 : 434}px">${box(n, cl[k % 6], 62, 32).replace('class="ic"', 'class="ic" style="margin:0 auto 10px"')}<b>${w}</b></div>`).join('')}
      <div style="position:absolute;left:0;right:0;top:618px;text-align:center;font-size:20px;font-weight:800;letter-spacing:.16em;color:#f6a21e" id="dsh">TÜRKİYE ÖZEL GÜN TAKVİMİ</div>
      <div class="daystrip" style="top:660px">${['14 Şubat', '8 Mart', 'Ramazan Bayramı', 'Anneler Günü', 'Yaz sezonu', 'Okula dönüş', 'Efsane Cuma', 'Yılbaşı'].map((d) => `<span class="chip">${ic('calendar-days', 'width:20px;height:20px;color:#8fbaff')}${d}</span>`).join('')}</div>`)
    const s0 = at('sectors', 0)
    q(el, '.sec').forEach((c, k) => tl.fromTo(c, { opacity: 0, rotationY: -90, transformPerspective: 800 }, { opacity: 1, rotationY: 0, duration: 0.6, ease: 'back.out(1.4)' }, s0 + 0.3 + k * 0.22))
    fadeIn(q(el, '#dsh'), s0 + 3.3)
    pop(q(el, '.daystrip .chip'), s0 + 3.5, { st: 0.18, y: 20 })
  }

  // 12 · Uyum ve riskler
  {
    const CP = [['lock', 'KVKK', 'Aydınlatma, saklama süresi, silme', 230, 330], ['mail', 'İYS ve ileti izinleri', 'İzin kaydı, abonelikten çıkma', 230, 520], ['megaphone', 'Reklam kuralları', 'Yanıltıcı ve abartılı iddia yok', 1270, 330], ['badge-check', 'Platform politikaları', 'Meta, Google, WhatsApp kuralları', 1270, 520]]
    const el = scene('risk', '12 · Güven', 'Uyum ürünün içinde', `
      <div class="shield">${ic('shield-check', 'width:240px;height:280px')}</div>
      ${CP.map(([n, h, p, x, y]) => `<div class="card comp" style="left:${x}px;top:${y}px">${'<div class="ic">' + ic(n) + '</div>'}<div><h4>${h}</h4><p>${p}</p></div></div>`).join('')}
      <div class="card meter"><h3>${ic('triangle-alert')} En büyük risk</h3><div style="font-size:40px;font-weight:800;margin-top:14px;line-height:1.15">Platform erişim onaylarının gecikmesi</div>
        <div class="gauge-row"><small>OLASILIK · YÜKSEK</small><div class="gbar"><i id="rg1" style="background:linear-gradient(90deg,#f6a21e,#f0545a)"></i></div></div>
        <div class="gauge-row"><small>ETKİ · YÜKSEK</small><div class="gbar"><i id="rg2" style="background:linear-gradient(90deg,#f6a21e,#f0545a)"></i></div></div></div>
      <div class="card mitig"><h3 style="font-size:30px;font-weight:800;margin-bottom:10px">Önlemler</h3>
        <div class="m">${'<div class="ic">' + ic('calendar') + '</div>'}<div>Başvurular ilk 2 haftada<small>Meta, Google ve WhatsApp erişimi</small></div></div>
        <div class="m">${'<div class="ic">' + ic('package') + '</div>'}<div>Yardımcı mod<small>Bağlantı olmadan da hazırla, kopyala, hatırlat</small></div><div class="toggle" id="tg"><i></i></div></div>
        <div class="m">${'<div class="ic">' + ic('layers') + '</div>'}<div>Birden çok kanal<small>Tek platforma bağımlı kalmama</small></div></div></div>`)
    const s0 = at('risk', 0)
    pop(q(el, '.shield'), s0 + 0.2, { y: 0, s: 0.5, d: 0.9 })
    pop(q(el, '.comp'), s0 + 0.9, { st: 0.4, y: 0, s: 0.85 })
    tl.fromTo(q(el, '.comp'), { x: (i) => (i < 2 ? 80 : -80) }, { x: 0, duration: 0.7, stagger: 0.4, ease: 'power3.out' }, s0 + 0.9)
    const s1 = at('risk', 1)
    out(q(el, '.shield, .comp'), s1, 0.5, { st: 0.04 })
    pop(q(el, '.meter'), s1 + 0.4, { y: 40 })
    tl.fromTo(q(el, '#rg1'), { width: '0%' }, { width: '82%', duration: 1.4, ease: 'power2.out' }, s1 + 1.2)
    tl.fromTo(q(el, '#rg2'), { width: '0%' }, { width: '88%', duration: 1.4, ease: 'power2.out' }, s1 + 1.6)
    pop(q(el, '.mitig'), s1 + 2.4, { y: 40 })
    pop(q(el, '.mitig .m'), s1 + 2.9, { st: 0.5, y: 14, s: 1 })
    to(q(el, '#tg'), { backgroundColor: 'rgba(255,255,255,.15)' }, { backgroundColor: '#22c08a', duration: 0.3 }, s1 + 4.6)
    to(q(el, '#tg i'), { x: 0 }, { x: 36, duration: 0.3, ease: 'back.out(2)' }, s1 + 4.6)
  }

  // 13 · Pazara çıkış
  {
    const WK = [['HAFTA 0–1', '10 pilot işletme seç', '3 sektör, kurulum randevusu, başlangıç ölçümü'], ['HAFTA 1–2', 'Kurulum ve ilk içerik', 'Her işletmede ≥ 10 onaylı içerik, profil düzeltmeleri'], ['HAFTA 2–4', 'Kanallar ve WhatsApp', 'Bağlantılar, asistan, haftalık patron raporu'], ['HAFTA 4–6', 'Sonuç ve fiyat testi', 'Ödemeye hazır işletme, referans ve yorum']]
    const SH = ['store', 'scissors', 'utensils', 'shopping-bag', 'stethoscope', 'dumbbell', 'car', 'house', 'graduation-cap', 'hotel']
    const el = scene('gtm', '13 · Pazara çıkış', 'İlk hedef ve satış makinesi', `
      <div class="target">${[250, 180, 110].map((r) => `<div class="r" style="width:${r * 2}px;height:${r * 2}px"></div>`).join('')}<div class="core">3–50<br><small style="font-size:18px">çalışan</small></div></div>
      <div class="icp"><div class="ch">${[['camera', 'Instagram', C.pink], ['map-pin', 'Google Haritalar', C.blue], ['message-circle', 'WhatsApp', C.green]].map(([n, w, col]) => `<div class="card">${box(n, col, 64, 34)}<b>${w}</b></div>`).join('')}</div>
        <div class="big">Yerel hizmet ve perakende<small>Karar verici: işletme sahibi · kuaför, restoran, butik ile başla</small></div></div>
      <div class="card report"><h3>Pazarlama karnesi<small>Ücretsiz · örnek sonuç</small></h3>
        <div class="dial"><svg viewBox="0 0 300 300"><circle cx="150" cy="150" r="120" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="22"/><circle id="dl" cx="150" cy="150" r="120" fill="none" stroke="url(#dg)" stroke-width="22" stroke-linecap="round" stroke-dasharray="754" stroke-dashoffset="754" transform="rotate(-90 150 150)"/><defs><linearGradient id="dg"><stop offset="0" stop-color="#f0545a"/><stop offset="1" stop-color="#f6a21e"/></linearGradient></defs></svg><div class="v"><div><span id="dv">0</span><small>/ 100 puan</small></div></div></div>
        <div class="wins">${['Google profilinde saatler eksik', 'Son 30 günde yalnızca 2 gönderi', 'Yorumlar yanıtsız', 'Sitede WhatsApp butonu yok', 'Rakipler haftada 4 gönderi paylaşıyor'].map((w) => `<div>${ic('lightbulb', 'color:#f6a21e')}${w}</div>`).join('')}</div></div>
      <div class="urlbar">${ic('globe')}<span id="url"></span><span class="go">Puanla</span></div>
      <div class="leadcount"><div class="card"><small>PUANLAMA SÜRESİ</small><b>2 dk</b></div><div class="card"><small>HIZLI KAZANIM ÖNERİSİ</small><b>5</b></div><div class="card"><small>SONRAKİ ADIM</small><b style="font-size:34px;margin-top:18px">Deneme daveti</b></div></div>
      <div class="pilot">${WK.map(([w, h, p], k) => `<div class="card pweek" style="left:${k * 428}px;height:280px"><div class="wk">${w}</div><h4>${h}</h4><p>${p}</p></div>`).join('')}
        <div class="shops">${SH.map((n) => `<div class="s">${ic(n, 'color:#8fbaff')}</div>`).join('')}</div></div>`)
    const s0 = at('gtm', 0)
    q(el, '.target .r').forEach((r, k) => tl.fromTo(r, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.6)' }, s0 + 0.3 + (2 - k) * 0.2))
    pop(q(el, '.target .core'), s0 + 0.2, { y: 0, s: 0.3 })
    pop(q(el, '.icp .ch .card'), s0 + 1.0, { st: 0.3 })
    pop(q(el, '.icp .big'), s0 + 2.2, { y: 20 })
    const s1 = at('gtm', 1)
    out(q(el, '.target, .icp'), s1, 0.5)
    pop(q(el, '.urlbar'), s1 + 0.3, { y: 20 })
    typeText(q(el, '#url')[0], 'cicekdunyasi.com.tr', s1 + 0.8, s1 + 2.2)
    pop(q(el, '.report'), s1 + 2.4, { y: 40 })
    tl.fromTo(q(el, '#dl'), { strokeDashoffset: 754 }, { strokeDashoffset: 754 * (1 - 0.62), duration: 2, ease: 'power2.out' }, s1 + 2.9)
    count(q(el, '#dv')[0], s1 + 2.9, s1 + 4.9, 0, 62)
    pop(q(el, '.wins div'), s1 + 3.4, { st: 0.3, y: 10, s: 1 })
    pop(q(el, '.leadcount .card'), s1 + 3.0, { st: 0.35 })
    const s2 = at('gtm', 2)
    out(q(el, '.report, .urlbar, .leadcount'), s2, 0.5)
    pop(q(el, '.pweek'), s2 + 0.4, { st: 0.3 })
    pop(q(el, '.shops .s'), s2 + 1.6, { st: 0.12, y: 0, s: 0.3, ease: 'back.out(2.5)' })
  }

  // 14 · Yol haritası
  {
    const G = [['Faz 0 · Keşif', '2 hf', 0, 2, C.slate], ['Faz 1 · MVP', '8 hf', 2, 10, C.blue], ['Faz 2 · Yerel + WhatsApp', '8 hf', 10, 18, C.violet], ['Faz 3 · Reklam + atıf', '10 hf', 16, 26, C.orange], ['Faz 4 · Kurumsal', '12 hf', 24, 36, C.green], ['Sürekli · güvenlik, uyum', '', 2, 36, '#475569']]
    const X0 = 480
    const WW = 1200
    const wx = (w) => X0 + (WW * w) / 36
    const el = scene('roadmap', '14 · Yol haritası', 'Beş faz · yaklaşık 36 hafta', `
      <div class="gantt">${[0, 4, 8, 12, 16, 20, 24, 28, 32, 36].map((w) => `<div class="vl" style="left:${wx(w)}px"></div><div class="wk" style="left:${wx(w)}px">H${w}</div>`).join('')}
        ${G.map(([n, d, a, b, col], k) => `<div class="gl" style="top:${20 + k * 82}px">${n}${d ? `<small>${d}</small>` : ''}</div><div class="gb" style="top:${25 + k * 82}px;left:${wx(a)}px;width:${wx(b) - wx(a)}px;background:${col}">${k === 1 ? 'İçerik + onay + 2 kanal' : k === 2 ? 'Yerel SEO + WhatsApp' : k === 3 ? 'Reklam otopilotu' : k === 4 ? 'Roller, onay zinciri, API' : ''}</div>`).join('')}</div>
      <div style="position:absolute;left:0;right:0;top:806px;text-align:center;font-size:20px;color:#93a3c8">Süreler tahmindir · kritik yol: platform erişim başvuruları</div>`)
    const s0 = at('roadmap', 0)
    fadeIn(q(el, '.vl, .wk'), s0 + 0.2, 0.6, 0.03)
    pop(q(el, '.gl'), s0 + 0.4, { st: 0.15, y: 0, s: 1 })
    tl.fromTo(q(el, '.gl'), { x: -30 }, { x: 0, duration: 0.5, stagger: 0.15 }, s0 + 0.4)
    const s1 = at('roadmap', 0) + 1.6
    tl.fromTo(q(el, '.gb'), { clipPath: 'inset(0% 100% 0% 0% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 0.9, stagger: 0.85, ease: 'power3.out' }, s1)
  }

  // 15 · Ölçüm
  {
    const el = scene('metrics', '15 · Ölçüm', 'Neyi ölçeceğiz?', `
      <div class="star">${ic('star', 'width:380px;height:380px', true)}</div>
      <div style="position:absolute;left:250px;top:660px;width:380px;text-align:center;font-size:26px;font-weight:800;color:#ffcc4d" id="ny">KUZEY YILDIZI</div>
      <div class="formula"><div class="card"><b style="color:#8fbaff">${ic('send', 'width:56px;height:56px')}</b><span>Onaylanıp yayınlanan içerik</span></div><span class="op">+</span><div class="card"><b style="color:#9ff0cf">${ic('message-circle', 'width:56px;height:56px')}</b><span>Yanıtlanan müşteri adayı</span></div>
        <div style="margin-top:34px;font-size:30px;font-weight:700;color:#c4d0f0">= hesap başına <b style="color:#fff">haftalık değerli eylem</b></div></div>
      <div class="donut"><svg viewBox="0 0 480 480" style="width:480px;height:480px"><circle cx="240" cy="240" r="190" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="44"/><circle id="dn" cx="240" cy="240" r="190" fill="none" stroke="#22c08a" stroke-width="44" stroke-dasharray="1194" stroke-dashoffset="1194" transform="rotate(-90 240 240)"/></svg><div class="v"><div>%<span id="dnv">0</span><small>brüt marj hedefi (≥)</small></div></div></div>
      <div class="costs"><div style="font-size:28px;font-weight:800;margin-bottom:12px">Maliyet kalemleri</div>${[['Model (metin)', C.blue], ['Görsel ve video', C.violet], ['Mesaj: WhatsApp, SMS', C.orange], ['Altyapı ve destek', C.slate]].map(([n, col]) => `<div class="c"><i style="background:${col}"></i>${n}<small>pilotta ölçülecek</small></div>`).join('')}</div>`)
    const s0 = at('metrics', 0)
    tl.fromTo(q(el, '.star'), { opacity: 0, scale: 0.3, rotation: -40 }, { opacity: 1, scale: 1, rotation: 0, duration: 1, ease: 'back.out(1.6)' }, s0 + 0.2)
    fadeIn(q(el, '#ny'), s0 + 0.9)
    pop(q(el, '.formula > *'), s0 + 1.0, { st: 0.45 })
    const s1 = at('metrics', 1)
    out(q(el, '.star, #ny, .formula'), s1, 0.5)
    pop(q(el, '.donut'), s1 + 0.3, { y: 0, s: 0.7 })
    tl.fromTo(q(el, '#dn'), { strokeDashoffset: 1194 }, { strokeDashoffset: 1194 * 0.3, duration: 2, ease: 'power2.out' }, s1 + 0.6)
    count(q(el, '#dnv')[0], s1 + 0.6, s1 + 2.6, 0, 70)
    pop(q(el, '.costs > *'), s1 + 1.4, { st: 0.3, y: 14 })
  }

  // 16 · İlk adım + kapanış
  {
    const TD = [['10 işletmeyle görüşme', '20’şer dakika: bugün pazarlamayı nasıl yapıyorlar, neye para ödüyorlar?'], ['Platform başvuruları', 'Meta, Google ve WhatsApp erişimi · haftalar sürebilir'], ['Pazarlama karnesi prototipi', 'Bir haftada çıkar: hem lead toplar hem ürünü sınar'], ['Kararları netleştir', 'Hedef kitle, kanallar, fiyat modeli, ekip']]
    const el = scene('next', '16 · İlk adım', 'Bu hafta ne yapıyoruz?', `
      <div class="todo">${TD.map(([h, p], k) => `<div class="card t" style="top:${50 + k * 132}px"><div class="bx">${ic('check')}</div><div><h4>${h}</h4><p>${p}</p></div><div class="n">0${k + 1}</div></div>`).join('')}</div>
      <div class="outro"><div><img src="img/logo.svg" alt=""><h2>KODARYUM</h2><h1>Kodaryum Pazarlama</h1><p>İşletmenizin cebindeki pazarlama departmanı.</p></div></div>`)
    const s0 = at('next', 0)
    const d0 = segDur('next', 0)
    pop(q(el, '.todo .t'), s0 + 0.3, { st: 0.25, y: 20 })
    q(el, '.todo .t').forEach((t, k) => {
      const a = s0 + 1.6 + (k * (d0 - 2.2)) / 4
      to(q(t, '.bx'), { backgroundColor: 'rgba(0,0,0,0)', borderColor: 'rgba(150,180,255,.5)' }, { backgroundColor: '#22c08a', borderColor: '#22c08a', duration: 0.3 }, a)
      tl.fromTo(q(t, '.bx .ico'), { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(3)' }, a)
    })
    const s1 = at('next', 1)
    out(q(el, '.todo, .kicker, .title'), s1, 0.5)
    tl.fromTo(q(el, '.outro'), { opacity: 0 }, { opacity: 1, duration: 0.9 }, s1 + 0.3)
    pop(q(el, '.outro img'), s1 + 0.3, { y: 0, s: 0.5, d: 1 })
    pop(q(el, '.outro h2, .outro h1, .outro p'), s1 + 0.8, { st: 0.3, y: 30 })
    tl.fromTo(q(el, '.outro'), { opacity: 1 }, { opacity: 0, duration: 1.5, immediateRender: false }, DUR - 1.6)
  }

  // ── kare güncellemesi ───────────────────────────────────────────────────────────────────────────
  let lastScene = null
  function update(t) {
    $('#progress-fill').style.width = `${Math.min(100, (t / DUR) * 100)}%`
    const sc = TM.scenes.find((s) => t >= s.start && t < s.end) ?? TM.scenes[TM.scenes.length - 1]
    if (sc !== lastScene) {
      lastScene = sc
      const i = TM.scenes.indexOf(sc)
      $('#chapter-no').textContent = i ? String(i).padStart(2, '0') + ' / ' + String(TM.scenes.length - 1).padStart(2, '0') : ''
      $('#chapter-name').textContent = i ? sc.title : ''
    }
    for (const f of DYN) f(t)
    for (const h of HEX) {
      const dx = Math.sin(t * 0.05 + h.i * 1.7) * 40
      const dy = Math.cos(t * 0.04 + h.i * 2.3) * 30
      h.el.style.transform = `translate(${h.x - h.r + dx}px, ${h.y - h.r + dy}px) rotate(${t * 2 + h.i * 20}deg)`
    }
    const g = $('#bg-glow')
    g.style.setProperty('--gx', `${50 + Math.sin(t * 0.07) * 25}%`)
    g.style.setProperty('--gy', `${45 + Math.cos(t * 0.05) * 18}%`)
  }

  window.__duration = DUR
  window.__seek = (t) => {
    tl.time(t, false)
    update(t)
  }
  if (RENDER) {
    window.__seek(0)
    document.fonts.ready.then(() => (window.__ready = true))
  } else {
    const p = new URLSearchParams(location.search)
    let t = +(p.get('t') || 0)
    let playing = true
    let last = performance.now()
    const loop = (now) => {
      if (playing) t = Math.min(DUR, t + (now - last) / 1000)
      last = now
      window.__seek(t)
      requestAnimationFrame(loop)
    }
    addEventListener('keydown', (e) => {
      if (e.code === 'Space') playing = !playing
      if (e.code === 'ArrowRight') t = Math.min(DUR, t + 5)
      if (e.code === 'ArrowLeft') t = Math.max(0, t - 5)
    })
    requestAnimationFrame(loop)
  }
})()
