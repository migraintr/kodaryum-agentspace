# Ekrandaki metinlerin okunma süresine göre zaman çizelgesi üretir (seslendirme yok).
#   ../anlatim.json  → sahneler ve cümleler (cap: ekranda görünen metin)
#   ../kaynak/zaman.js   → animasyon için window.TIMING
#   ../kaynak/zaman.json → müzik üreticisi için aynı veri
# Süre/cümle = base + perWord × kelime (min–max arası). Kullanım: python zamanla.py
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
cfg = json.loads((ROOT / 'anlatim.json').read_text(encoding='utf-8'))
T = cfg['timing']
t = T['lead']
scenes = []
for i, sc in enumerate(cfg['scenes']):
    s = {'id': sc['id'], 'title': sc['title'], 'start': round(max(0, t - 0.6), 3), 'segs': []}
    for sg in sc['segs']:
        d = min(T['max'], max(T['min'], T['base'] + T['perWord'] * len(sg['cap'].split())))
        d += sg.get('extra', 0)
        s['segs'].append({'start': round(t, 3), 'end': round(t + d, 3), 'cap': sg['cap'], 'nocap': sg.get('nocap', False)})
        t += d
    t += T['sceneGap']
    scenes.append(s)
scenes[0]['start'] = 0
dur = round(t + T['tail'], 3)
for i, s in enumerate(scenes):
    s['end'] = scenes[i + 1]['start'] if i + 1 < len(scenes) else dur
data = {'duration': dur, 'scenes': scenes}
(ROOT / 'kaynak' / 'zaman.js').write_text('// zamanla.py tarafından üretildi — elle değiştirmeyin\nwindow.TIMING = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')
(ROOT / 'kaynak' / 'zaman.json').write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'film {dur:.1f} sn ({dur / 60:.2f} dk) · {sum(len(s["segs"]) for s in scenes)} cümle')
for s in scenes:
    print(f"  {s['start']:7.1f}  {s['title']}")
