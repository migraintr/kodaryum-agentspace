# Pazarlama modülü tanıtım videosu

`Kodaryum-Pazarlama-Modulu-Tanitim.mp4` — PDF'teki strateji ve ürün planını 17 sahnede anlatan, seslendirmesiz,
ekran metinli ve müzikli animasyon (1920×1080, 30 fps, ~7,6 dk).

## Yapı
- `anlatim.json` — sahneler ve ekranda görünen cümleler (`cap`). Metni değiştirmek için yalnızca burayı düzenleyin.
  `timing`: cümle başına okuma süresi (`base + perWord × kelime`, `min`–`max` arası), sahne arası boşluk.
  Bir cümleye `"extra": 3` eklenirse 3 sn daha uzun kalır.
- `kaynak/index.html`, `style.css`, `app.js` — tek GSAP zaman çizelgesi; her sahnenin görselleri `app.js` içinde.
- `kaynak/zaman.js` / `zaman.json` — `araclar/zamanla.py` üretir (elle değiştirmeyin).
- `kaynak/ikonlar.js` — lucide ikonları (ISC lisansı), `araclar/ikonlar.mjs` üretir.
- `kaynak/img/ofis.jpg` — uygulamanın 3B ofis ekran görüntüsü.

## Önizleme
`kaynak/index.html` dosyasını Chrome'da açın: boşluk oynat/duraklat, ←/→ 5 sn, `?t=120` ile 120. saniyeden.

## Yeniden üretmek
Gerekenler: Node.js, Google Chrome, Python 3 (numpy, scipy), ffmpeg.

```
cd docs/video
python araclar/zamanla.py                         # anlatim.json → zaman.js/json
python araclar/muzik.py                           # → ses/muzik.wav (sahnelere senkron)
set FFMPEG=C:\yol\ffmpeg.exe
node araclar/render.cjs kaynak/index.html cikti 30 8   # kareler → cikti/part*.mp4 (playwright-core gerekir)
cd cikti
ffmpeg -f concat -safe 0 -i parts.txt -i ../ses/muzik.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart ../Kodaryum-Pazarlama-Modulu-Tanitim.mp4
```

`node araclar/snap.cjs kaynak/index.html kareler 12 41.5` belirli saniyelerden PNG kare alır.
