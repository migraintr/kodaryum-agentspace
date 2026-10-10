# Pazarlama tanıtım videosu için özgün arka plan müziği + geçiş efektleri (seslendirme yok).
# Sahne ve cümle zamanları ../kaynak/zaman.json'dan okunur: sahne geçişlerinde yumuşak "whoosh", her cümlede çok hafif
# bir tık, bölümlere göre yoğunluk (giriş sakin → modüller en dolu → kapanışta son akor).
# Kullanım: python muzik.py [çıktı.wav]   (varsayılan ../ses/muzik.wav)
import json, sys, wave
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt, oaconvolve

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'ses' / 'muzik.wav'
OUT.parent.mkdir(parents=True, exist_ok=True)
TM = json.loads((ROOT / 'kaynak' / 'zaman.json').read_text(encoding='utf-8'))
SR = 44100
END = TM['duration']
L = END + 0.5
N = int(L * SR)
rng = np.random.default_rng(7)
SC = {s['id']: s for s in TM['scenes']}
F32 = np.float32

BEAT = 60 / 96
BAR = BEAT * 4
CL = BAR * 2                     # akor başına 2 ölçü
EIGHTH = BEAT / 2


def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def sos(kind, f, order=2): return butter(order, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(sos('low', f, o), x, axis=0).astype(F32)
def hp(x, f, o=2): return sosfilt(sos('high', f, o), x, axis=0).astype(F32)
def bp(x, lo, hi, o=2): return sosfilt(sos('band', [lo, hi], o), x, axis=0).astype(F32)
def z(): return np.zeros((N, 2), F32)
def tvec(d): return (np.arange(int(d * SR)) / SR).astype(F32)
def pan2(sig, p):
    a = (p + 1) * np.pi / 4
    return np.stack([sig * np.cos(a), sig * np.sin(a)], 1).astype(F32)
def add(b, t0, st):
    i = int(round(t0 * SR))
    if st.ndim == 1: st = pan2(st, 0)
    if i < 0: st, i = st[-i:], 0
    if i >= N: return
    j = min(N, i + len(st)); b[i:j] += st[:j - i]
def norm(x): return (x / (np.max(np.abs(x)) + 1e-9)).astype(F32)
def auto(points):
    xs, ys = zip(*sorted(points))
    return np.interp(np.arange(N) / SR, xs, ys).astype(F32)[:, None]


# ── bölüm yoğunlukları (sahne başında hedef değer; aralarda yumuşak geçiş) ────────────────────────
S = lambda k: SC[k]['start']
E = lambda k: SC[k]['end']
seg = lambda k, i: SC[k]['segs'][i]['start']
T_OUTRO = seg('next', 1)
LEVEL = {'intro': .35, 'problem': .5, 'segment': .55, 'alternatives': .6, 'vision': .8, 'today': .72, 'loop': .85, 'modules': 1, 'screen': .9,
         'pricing': .8, 'team': .85, 'sectors': .92, 'risk': .62, 'gtm': .85, 'roadmap': .9, 'metrics': .8, 'next': .62}
lvl_pts = [(0, LEVEL['intro'])]
for k, v in LEVEL.items():
    if k != 'intro': lvl_pts += [(S(k) - 1.5, lvl_pts[-1][1]), (S(k) + 1.5, v)]
lvl_pts += [(T_OUTRO, .55), (L, .5)]
LVL = auto(lvl_pts)

# ── akorlar: (bas kökü, pad sesleri, arpej sesleri) — D majör ailesi ────────────────────────────
CH = {'D': (38, [50, 57, 61, 64, 66], [62, 66, 69, 73, 76]), 'Bm': (35, [50, 54, 57, 61, 62], [59, 62, 66, 69, 73]),
      'G': (31, [50, 54, 57, 59, 62], [55, 59, 62, 66, 69]), 'A': (33, [52, 57, 59, 61, 64], [57, 61, 64, 66, 69]),
      'Em': (40, [52, 55, 59, 62, 66], [59, 62, 64, 67, 71])}
P1 = ['Bm', 'G', 'D', 'A']           # giriş ve problem: düşünceli
P2 = ['D', 'Bm', 'G', 'A']           # vizyondan itibaren: aydınlık
P3 = ['G', 'A', 'Bm', 'D']           # yol haritası / ölçüm: yükselen
T_P2 = np.ceil(S('vision') / CL) * CL
T_P3 = np.ceil(S('roadmap') / CL) * CL
T_FINAL = np.ceil((T_OUTRO - 0.3) / BAR) * BAR      # kapanış akoru ölçü başında
def chord_at(t):
    if t >= T_FINAL: return 'D'
    k = int(t // CL)
    p = P3 if t >= T_P3 else P2 if t >= T_P2 else P1
    return p[k % 4]

# ── pad (akor tamponları önceden üretilir) ───────────────────────────────────────────────────────
def chord_buf(name, dur):
    ts = tvec(dur)
    out = np.zeros((len(ts), 2), F32)
    for m in CH[name][1]:
        f = mtof(m)
        for dc, p in ((-7, -.7), (0, 0), (7, .7)):
            ff = f * 2 ** (dc / 1200); ph = rng.uniform(0, 2 * np.pi); w = np.zeros(len(ts), F32)
            for h in range(1, 7):
                if ff * h > 5000: break
                w += (np.sin(2 * np.pi * ff * h * ts + ph * h) / h ** 1.4).astype(F32)
            out += pan2(w, p)
    return out
REL = 2.4
PADB = {k: chord_buf(k, CL + REL) for k in CH}
pad = z()
ts = tvec(CL + REL)
env = (np.minimum(1, ts / 1.2) ** 1.5 * np.clip(1 - (ts - CL) / REL, 0, 1) ** 1.6).astype(F32)[:, None]
for k in range(int(np.ceil(T_FINAL / CL))):
    t0 = k * CL
    add(pad, t0, PADB[chord_at(t0 + .01)] * env)
fin = chord_buf('D', 12)
tf = tvec(12)
add(pad, T_FINAL, fin * (np.minimum(1, tf / .6) * np.exp(-np.maximum(0, tf - 2) / 4)).astype(F32)[:, None])
pad = norm(lp(pad, 2200)) * auto([(0, 0), (2.5, 1), (L, 1)])

# ── pluck arpej (nota tamponları) ───────────────────────────────────────────────────────────────
tp = tvec(1.1)
penv = (np.exp(-tp / .22) * np.minimum(1, tp / .003)).astype(F32)
PL = {}
def pluck(m):
    if m not in PL:
        f = mtof(m)
        PL[m] = ((np.sin(2 * np.pi * f * tp) + .35 * np.sin(4 * np.pi * f * tp) * np.exp(-tp / .08) + .12 * np.sin(6 * np.pi * f * tp) * np.exp(-tp / .05)) * penv).astype(F32)
    return PL[m]
PATS = {'calm': [0, None, 2, None, 4, None, 2, None, 1, None, 3, None, 4, None, 3, None],
        'flow': [0, 2, 4, 2, 1, 3, 4, 3, 0, 2, 4, 3, 1, 3, 2, 1],
        'lift': [0, 1, 2, 4, 2, 1, 3, 4, 0, 2, 3, 4, 4, 3, 2, 1]}
def pat_at(t):
    if t < S('vision'): return 'calm'
    if S('modules') <= t < S('pricing') or S('sectors') <= t < S('risk') or S('roadmap') <= t < S('next'): return 'lift'
    return 'flow'
pl = z()
for e in range(int(L / EIGHTH)):
    t = e * EIGHTH
    if t < S('problem') - CL or t > L - 1: continue
    if t >= T_FINAL and (e % 2 or t > T_FINAL + 5): continue
    pos = int(round((t % CL) / EIGHTH)) % 16
    idx = PATS[pat_at(t)][pos]
    if idx is None: continue
    m = CH[chord_at(t)][2][idx] + (12 if S('modules') <= t < S('pricing') and pos % 4 == 3 else 0)
    vel = (.8 if pos % 2 == 0 else .6) + rng.uniform(-.05, .05)
    add(pl, t, pan2(pluck(m) * vel, .35 if e % 2 else -.35))
def pingpong(x, d=EIGHTH * 1.5, gains=(.36, .2, .1)):
    y = np.zeros_like(x); D = int(d * SR)
    for k, g in enumerate(gains, 1):
        sh = k * D
        if k % 2: y[sh:, 0] += g * x[:-sh, 1]; y[sh:, 1] += g * x[:-sh, 0]
        else: y[sh:] += g * x[:-sh]
    return x + lp(y, 2800)
pl = norm(pingpong(lp(pl, 5200)))

# ── zil melodisi (modüller ve kapanış): akor tonlarından basit motif ─────────────────────────────
tb = tvec(2.2)
def bell(m):
    f = mtof(m)
    return ((np.sin(2 * np.pi * f * tb) + .28 * np.sin(2 * np.pi * f * 2.76 * tb) * np.exp(-tb / .25)) * np.exp(-tb / .7) * np.minimum(1, tb / .004)).astype(F32)
MOTIF = [(0, 4), (1.5, 3), (2, 2), (3, 4), (5, 1), (6, 2)]  # (vuruş, arpej indeksi)
bl = z()
for t0 in np.arange(0, L, CL):
    if not (S('modules') + 2 <= t0 < S('screen') or S('sectors') <= t0 < S('risk') or T_FINAL - CL <= t0 <= T_FINAL): continue
    for b, i in MOTIF:
        t = t0 + b * BEAT
        add(bl, t, pan2(bell(CH[chord_at(t)][2][i] + 12) * .7, rng.uniform(-.4, .4)))
bl = norm(pingpong(lp(bl, 7000)))

# ── bas ─────────────────────────────────────────────────────────────────────────────────────────
BASS = {}
def bassnote(m, dur, dec):
    key = (m, round(dur, 3), dec)
    if key not in BASS:
        tbb = tvec(dur); f = mtof(m)
        e = np.minimum(1, tbb / .006) * np.exp(-tbb / dec) * np.clip((dur - tbb) / .03, 0, 1)
        BASS[key] = ((np.sin(2 * np.pi * f * tbb) + .4 * np.sin(4 * np.pi * f * tbb) + .14 * np.sin(6 * np.pi * f * tbb)) * e).astype(F32)
    return BASS[key]
bs = z()
for e in range(int(L / EIGHTH)):
    t = e * EIGHTH
    if t < S('segment') or t >= T_FINAL + .01: continue
    root = CH[chord_at(t)][0]
    if t < S('vision') or S('risk') <= t < S('gtm'):
        if abs(t % BAR) < 1e-6: add(bs, t, bassnote(root, BAR, 1.4) * .8)       # sakin: ölçü başına uzun nota
    else:
        if e % 2 == 0 or e % 8 == 7: add(bs, t, bassnote(root + (12 if e % 8 == 7 else 0), EIGHTH * .95, .35) * (1 if e % 2 == 0 else .7))
add(bs, T_FINAL, bassnote(38, 6, 2.2))
bs = norm(lp(bs, 700))

# ── davul (yumuşak) ─────────────────────────────────────────────────────────────────────────────
def drums_on(t): return (S('vision') + CL <= t < S('risk') or S('gtm') <= t < S('next') - .1)
def hats_on(t): return (S('loop') <= t < S('risk') or S('roadmap') <= t < S('next') - .1)
kick, hat, clap = z(), z(), z()
tk = tvec(.4)
kf = 48 + 105 * np.exp(-tk / .03)
ksig = (np.sin(2 * np.pi * np.cumsum(kf) / SR) * np.exp(-tk / .18)).astype(F32)
th = tvec(.06)
hsig = (hp(rng.standard_normal(len(th)).astype(F32), 7000) * np.exp(-th / .02)).astype(F32)
tc = tvec(.3)
csig = (bp(rng.standard_normal(len(tc)).astype(F32), 900, 2600) * sum(np.exp(-np.maximum(0, tc - o) / (.012 if o < .02 else .12)) * (tc >= o) for o in (0, .011, .022))).astype(F32)
kicks = []
for b in range(int(L / BEAT)):
    t = b * BEAT
    if drums_on(t):
        add(kick, t, ksig); kicks.append(t)
        if b % 4 in (1, 3) and S('modules') <= t < S('pricing'): add(clap, t, pan2(csig, rng.uniform(-.1, .1)))
    if hats_on(t + EIGHTH): add(hat, t + EIGHTH, pan2(hsig * (1 if b % 2 else .75), .25))
kick, hat, clap = norm(kick), norm(hat), norm(clap)
duck = np.ones(N, F32)
dseg = (1 - .45 * np.exp(-tvec(.5) / .13)).astype(F32)
for t in kicks:
    i = int(t * SR); j = min(N, i + len(dseg)); duck[i:j] = np.minimum(duck[i:j], dseg[:j - i])
duck = duck[:, None]

# ── efektler: sahne geçişi whoosh, cümle tıkı, giriş darbesi, kapanış zili, yükselişler ────────────
fx = z()
def noise(d): return rng.standard_normal(int(d * SR)).astype(F32)
for s in TM['scenes'][1:]:
    tw = s['start'] + .35
    d = 1.1; tt = tvec(d); pk = .4
    envw = np.where(tt < pk, (tt / pk) ** 2, np.exp(-(tt - pk) / .22)).astype(F32)
    nz = noise(d); w = np.clip(tt / pk, 0, 1)
    sig = ((1 - w) * lp(nz, 900) + w * bp(nz, 1800, 7000)) * envw
    add(fx, tw - pk, np.stack([sig * np.cos((tt / d) * np.pi / 2), sig * np.sin((tt / d) * np.pi / 2)], 1).astype(F32) * .8)
ui = z()
tpp = tvec(.12)
tick = (np.sin(2 * np.pi * 1760 * tpp) * np.exp(-tpp / .03) * np.minimum(1, tpp / .002)).astype(F32)
for s in TM['scenes']:
    for g in s['segs']:
        add(ui, g['start'] + .12, pan2(tick * .5, rng.uniform(-.2, .2)))
hits = z()
def boom(t0, g=1.0):
    tt = tvec(3.0)
    b = np.sin(2 * np.pi * np.cumsum(34 + 30 * np.exp(-tt / .25)) / SR) * np.exp(-tt / .9)
    sh = sum(np.sin(2 * np.pi * mtof(m) * tt + rng.uniform(0, 6)) for m in (74, 78, 81, 85, 88)) * np.exp(-tt / 2.2) * np.minimum(1, tt / .01) * .16
    add(hits, t0, (pan2(b.astype(F32), 0) + np.stack([sh, np.roll(sh, 300)], 1).astype(F32)) * g)
boom(0.3, .9)                     # logo
boom(S('vision') + .3, .7)        # ürün tezi
boom(S('modules') + .3, .55)
boom(T_OUTRO + .3, 1.0)           # kapanış
riser = z()
for t1 in (S('vision') + .3, S('modules') + .3, T_OUTRO + .3):
    d = 3.0; tt = tvec(d); w = (tt / tt[-1]) ** 2; nz = noise(d)
    rs = ((1 - w) * lp(nz, 700) + w * bp(nz, 2500, 9000)) * w ** 1.3 + np.sin(2 * np.pi * np.cumsum(180 + 600 * w) / SR) * w * .2
    add(riser, t1 - d, pan2(rs.astype(F32), 0))

# ── yankı ve miks ───────────────────────────────────────────────────────────────────────────────
tr = tvec(2.6)
ir = (np.stack([rng.standard_normal(len(tr)), rng.standard_normal(len(tr))], 1) * np.exp(-tr / .6)[:, None]).astype(F32)
ir = lp(ir, 4500); ir[:int(.02 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
send = pad * .3 + pl * .45 + bl * .5 + clap * .2 + norm(hits) * .5
rev = np.stack([oaconvolve(send[:, c], ir[:, c])[:N] for c in range(2)], 1).astype(F32)
del send
lv = LVL
mix = (pad * .34 * (.6 + .4 * duck) + pl * .24 * lv * (.75 + .25 * duck) + bl * .13 + bs * .32 * lv * (.5 + .5 * duck)
       + kick * .34 * lv + hat * .07 * lv + clap * .09 + norm(fx) * .11 + norm(ui) * .045 + norm(hits) * .5 + norm(riser) * .16 + rev * .3)
mix *= auto([(0, 0), (.05, 1), (END - 3.0, 1), (END, 0), (L, 0)])
mix = mix / np.sqrt(np.mean(mix ** 2)) * 10 ** (-17.5 / 20)
lim = 10 ** (-1.5 / 20)
a = np.abs(mix)
mix = np.where(a > lim * .8, np.sign(mix) * (lim * .8 + lim * .2 * np.tanh((a - lim * .8) / (lim * .2))), mix)
print(f'süre {L:.1f} sn · RMS {20 * np.log10(np.sqrt(np.mean(mix ** 2)) + 1e-12):.1f} dBFS')
with wave.open(str(OUT), 'wb') as wf:
    wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR)
    wf.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print('→', OUT)
