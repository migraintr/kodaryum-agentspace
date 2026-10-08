# Yayına alma — Firebase Hosting (ücretsiz Spark planı)

Kodaryum AgentSpace tamamen statik bir uygulama (Vite + React + three.js). Sunucu kodu, veritabanı ya da
Cloud Functions **kullanmaz**; bu yüzden Firebase'in ücretsiz **Spark** planı yeterlidir, **Blaze gerekmez**.
Firebase projesi: **`kodaryumagentspace`** (`.firebaserc`).

## Blaze'e geçmeden kalmak için kurallar

- Yalnızca **Hosting** kullanılır. Projede Cloud Functions, Cloud Run, Firestore tetikleyicileri, Storage
  kuralları ya da uzantılar (Extensions) açmayın — bunların çoğu Blaze ister.
- Veri katmanı ileride **Supabase**'e taşınacak; Firebase SDK'sı projeye eklenmedi (paket boyutu da küçük kalır).
- Spark sınırları (2026 itibarıyla Firebase konsolundan doğrulayın): Hosting için **10 GB depolama** ve
  günde yaklaşık **360 MB aktarım**. Aşılırsa site o gün için durur, ücret çıkmaz.
- Aktarımı düşük tutmak için: derlenen her dosyanın (JS, CSS, yazı tipleri, 3B modeller) adında içerik özeti var
  ve `firebase.json` bunları **1 yıl, değişmez** olarak önbelleğe aldırır; tekrar gelen ziyaretçi neredeyse hiç
  indirme yapmaz. İlk ziyaret ≈ 3,5 MB (3B modeller ≈ 2,5 MB).

## 1) Firebase konsolunda bir kez

1. <https://console.firebase.google.com> → `kodaryumagentspace` projesi → **Hosting** → *Başlayın*
   (komut adımlarını atlayabilirsiniz, yapılandırma bu depoda hazır).
2. Plan **Spark** olarak kalsın (Kullanım ve faturalandırma → Planlar).

## 2) Bilgisayarınızdan yayına alma

```bash
npm install
npx firebase-tools login        # tarayıcıda Google hesabınızla giriş (bir kez)
npm run deploy                  # derler ve canlıya gönderir → https://kodaryumagentspace.web.app
npm run deploy:onizleme         # 7 gün geçerli önizleme bağlantısı (canlıyı etkilemez)
```

Firebase CLI'yi kurmanıza gerek yok; komutlar `npx` ile en güncel sürümü çalıştırır.

## 3) Otomatik yayın (GitHub Actions)

`.github/workflows/firebase-hosting.yml`:

- `main` dalına her gönderimde → **canlı** sürüm güncellenir.
- Her pull request'te → **önizleme kanalı** açılır, bağlantı PR'a yorum olarak düşer.
- Gizli anahtar tanımlı değilse iş akışı yalnızca derlemeyi doğrular (hata vermez).

Gizli anahtarı tanımlamak için:

1. Firebase konsolu → ⚙ Proje ayarları → **Hizmet hesapları** → *Yeni özel anahtar oluştur* (JSON iner).
   (Alternatif: `npx firebase-tools init hosting:github` bunu otomatik yapar.)
2. GitHub → depo → Settings → Secrets and variables → Actions → *New repository secret*
   - Ad: `FIREBASE_SERVICE_ACCOUNT_KODARYUMAGENTSPACE`
   - Değer: indirilen JSON dosyasının tüm içeriği
3. JSON dosyasını bilgisayarınızdan silin; depoya **asla** eklemeyin.

## Barındırma ayarları (`firebase.json`)

| Ne | Neden |
|---|---|
| Her yol → `index.html` | Tek sayfalık uygulama; yenilemede 404 olmaz |
| `/assets/**` 1 yıl `immutable` | Dosya adları içerik özetli; yeni sürümde ad değişir |
| `index.html` `no-cache` | Yeni sürüm hemen görünür |
| Görseller 7 gün | `public/` altındaki adı sabit dosyalar |
| `nosniff`, `SAMEORIGIN`, `Referrer-Policy`, HSTS, `Permissions-Policy` | Temel güvenlik başlıkları (mikrofon yalnızca site için: sohbetteki sesli giriş) |

## Supabase'e geçiş notu

Örnek veriler üç dosyada: `src/data.js` (ekip, projeler, görevler), `src/metrics.js` (finans, pazarlama,
müşteri…), `src/calendar.js` (takvim). Bileşenler yalnızca bu dosyaların dışa aktardığı şekle bağlı; Supabase'e
geçerken bu dosyalar sorgu katmanıyla değiştirilir, `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` ortam
değişkenleri Vite ile okunur. Barındırma Firebase'de (ücretsiz) kalabilir.
