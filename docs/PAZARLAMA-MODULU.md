# Kodaryum Pazarlama — uygulama durumu (Aşama A)

Kaynak: `docs/` altındaki “Pazarlama Modülü Strateji Planı” (39 sayfa). Bu belge, planın neresinin yapıldığını,
neyin bilerek yapılmadığını ve Aşama B’ye (Supabase) nasıl geçileceğini anlatır.

**Nereden açılır:** sol menü → **Pazarlama Merkezi**, pazarlama odasına tıklayınca açılan panel, Departman panosu → Pazarlama
sekmesi, ya da Kağan’a “onay kutusu / pazarlama planı / pazarlama karnesi / haftalık rapor” yazın.

## Ne çalışıyor (Firebase Spark’ta, sunucusuz)

Tüm döngü (Anla → Planla → Üret → Onayla → Yayınla → Ölç → Öğren) tarayıcıda çalışır. Veri `localStorage`’da tutulur;
Gemini sunucusu varsa içerik/denetim/yanıt onunla, yoksa yerel şablon motoruyla üretilir (arayüz hiçbir zaman boş kalmaz).

| Modül | Durum | Nerede |
|---|---|---|
| M1 Marka hafızası | **Var.** Kurulum sihirbazı (12 soru, hazır şıklar), Marka Kartı, doğrulanmış gerçekler, ürün kataloğu, yasaklılar, 3 hafıza türü, sürüm geçmişi, “ajan neyi öğrendi?” (onay/ret/düzenleme farkından öğrenir) | `Wizard.jsx`, `Brand.jsx`, `mkt.js` |
| M2 Pazar ve rakip | **Kısmen.** Haftalık fırsat/tehdit notu (5 madde, “ne yapalım”), elle girilen rakip hareketleri, özel gün radarı, yorum teması analizi. Rakip/reklam kütüphanesi **otomatik taranmaz** | `Insights.jsx`, `generator.js` |
| M3 Strateji ve plan | **Var.** Hedef sihirbazı, 30–90 günlük plan, kanal karması, haftalık tema, özel gün hazırlığı, bütçe senaryoları (aralıklı **tahmin**), plan→görev (ajanlara atanır) | `Plan.jsx`, `generator.js` |
| M4 İçerik fabrikası | **Var.** 9 biçim (Instagram gönderi/hikâye/reels, Facebook, Google gönderisi, e-posta, WhatsApp şablonu, reklam metni, blog), 45 şablon ailesi, 11 sektör + çiçekçi, 3 varyant (Duyuru/Hikâye/Doğrudan çağrı), siz/sen hitap | `themes.js`, `generator.js` |
| M5 Kanal bağlayıcılar | **Yardımcı mod.** Hazırla–kopyala–“Yayınladım”, zamanı gelince hatırlatma, başvuru hattı kontrol listesi. **Canlı OAuth yayın yok** (platform onayı gerekir) | `Channels.jsx` |
| M6 Yerel SEO ve yorumlar | **Var** (elle veri girişiyle). Profil denetimi + eksik listesi, yorum toplama şablonu, yorum yanıt asistanı (olumsuzda sahibi onayı zorunlu), anahtar kelime konumu takibi | `Local.jsx` |
| M7 Reklam otopilotu | **Kısmen.** Kampanya şablonu, sert günlük/aylık tavan, kural motoru uyarıları (CPL > 1,5×, tavan aşımı), A/B yaratıcı + kazanan, harcama kaydı. **Reklam hesabına bağlı değil**; kademe 0 | `Campaigns.jsx` |
| M8 Müşteri ve WhatsApp | **Simülasyon + CRM.** Aşama panosu, izin kaydı (İYS/KVKK), 1-3-7 gün takip, kural tabanlı WhatsApp asistanı (marka hafızasından yanıt, bilmediğinde **insana devir**, “dijital asistan” şeffaflığı). Gerçek WhatsApp’a bağlı değil | `Customers.jsx` |
| M9 Analitik ve patron raporu | **Var** (girilen veriyle). Tek ekran KPI, huni, kaynak atfı (beyan + kod), içerik sıralaması, haftalık patron raporu (WhatsApp metni + tek sayfa PDF/yazdır) | `Results.jsx`, `metrics.js` |
| M10 Onay, güvenlik, uyum | **Var.** Onay kutusu (riskli üstte, toplu onay, ret sebebi), **Marka Koruyucu** (yasaklı kelime, doğrulanmamış fiyat/indirim/tarih/üstünlük iddiası, sağlık/karşılaştırma/kısıtlı sektör, abonelikten çıkma, ton/hitap, yazım, “yapay zekâ kokusu”), güven kademeleri (kısıtlı sektörde ≤ 1), denetim kaydı, çalıştırma kaydı, roller (simülasyon), **acil durdurma**, KVKK dışa aktar/sil | `guardian.js`, `Inbox.jsx`, `SettingsTab.jsx` |
| M11 Satış kanalı / e-ticaret | **Yok** (planda Faz 3+). Yalnızca manuel satış/ciro girişi var | `Results.jsx` |
| M12 Görsel ve video | **Kısmen.** Şablon motoru (gönderi, hikâye, kapak, afiş), fotoğraf ışık/renk düzeltmesi, fiyat rozeti (yalnızca marka hafızasından), PNG indirme. Üretken görsel ve kısa video **yok**; gerçek ürün/mekân yapay zekâyla değiştirilmez | `Studio.jsx` |
| Pazarlama karnesi | **Var.** 14 maddelik puan + 5 hızlı kazanım, marka hafızasından otomatik doldurma (URL taraması Aşama B) | `ScorecardTab.jsx` |

3B ofis bağlantısı: plan onaylanınca Hatice/Emine/Hüseyin, kampanya kurulumunda Merve, rapor üretiminde Esra ofiste gerçek görev alır
(ilerleme çubuğu, sohbete “tamamlandı” mesajı). Pazarlama odasından panel ve “Pazarlama Merkezi’ni aç” düğmesi.

## Bilerek yapılmayanlar (dürüstlük notu)

- Meta, Google, WhatsApp, TikTok, e-posta **canlı bağlantıları yoktur**. Başvurular (uygulama incelemesi, işletme doğrulaması, şablon
  onayı) haftalar sürer ve **sizin** yapmanız gerekir; `Kanallar` sekmesinde kontrol listesi vardır.
- Web sitesi / Instagram / Google profili **taranmaz** (tarayıcıdan çapraz-kaynak engeli, sunucu yok). Adresler kaydedilir; marka kartı
  sihirbazdaki sohbetten ve (Gemini varsa) “Anlat” metninden çıkarılır.
- Ödeme, abonelik, fatura, e-fatura, kullanım ölçümü kodlanmadı.
- Belgedeki fiyat/hacim/süre rakamları **hipotezdir**; uygulamada örnek veri “örnek veri” etiketiyle gösterilir.
- Hukuki konular (KVKK, İYS, reklam yönetmeliği, platform politikaları) genel çerçevedir; yayına almadan hukukçuya danışın.
  Dini bayram tarihleri Diyanet takvimiyle doğrulanmalıdır (arayüz “doğrulayın” der).

## Marka Koruyucu: ne denetler

`src/marketing/guardian.js` (çevrimdışı çalışır; Gemini “ikinci okuma” yalnızca **sıkılaştırabilir**, hafifletemez).
Çıktı şeması planın Ek D’siyle uyumludur: `verdict (passed|needs_fix|blocked)`, `checks`, `suggested_fix`, `explain`.
`blocked` içerik onaylanamaz. Kendi kendine sınama: `node src/marketing/selftest.mjs`
(11 sektör × 45 tema × 10 biçim × siz/sen ≈ 33.000 varyant üretip denetler; üretilen metinde yer tutucu kalmaması ve kural ihlali
olmaması beklenir; kısıtlı sektör — klinik — bilinçle sıkı: fiyat/kampanya temaları engellenir).

## Gemini (isteğe bağlı)

`POST /api/ai/mkt` (`server/mkt.js`): `content` (3 varyant), `review` (ikinci okuma), `plan` (haftalık notlar), `brand` (serbest metinden
Marka Kartı), `reply` (yorum yanıtı). Tümü şemalı JSON; dış içerik “VERİ” bloğunda, talimat sayılmaz (prompt injection koruması);
yalnızca verilen gerçekler iddia edilir. İstem sürümü `PROMPT_VERSION` (`mkt-v1`) sunucu günlüğüne ve arayüzdeki “Çalıştırma kaydı”na yazılır.
Anahtar yoksa ya da hata olursa arayüz yerel motora düşer. Firebase Spark’ta sunucu çalışmaz: canlı sitede yerel motor kullanılır.

## Aşama B: Supabase’e geçiş

1. `supabase/schema.sql` dosyasını Supabase SQL düzenleyicide çalıştırın (çok kiracılı, RLS’li; belge Bölüm 8 veri modeli + pgvector).
2. `src/marketing/repo.js` içindeki `load / save / clear / subscribe` arayüzünü Supabase istemcisiyle uygulayın (tek belge yerine tablolar;
   ilk adım: `brand`, `content_item`, `content_variant`, `contact`, `review`, `metric_daily`, `audit_log`). Arayüz bileşenleri başka depolamaya dokunmaz.
3. Yayın kuyruğu ve zamanlayıcı: Supabase Edge Functions + `pg_cron`; token’lar Vault/KMS’te (tabloda yalnızca `token_ref`).
4. Gemini çağrılarını Edge Function’a taşıyın (`server/mkt.js` mantığı aynen), anahtar yalnızca sunucuda.
5. Kanal bağlayıcıları sırayla: Meta (Instagram + Facebook) → Google İşletme → WhatsApp → e-posta.
6. Rol ve çok aşamalı onay (içerik → marka → hukuk) `membership.role` ve `approval` tablosuyla.

## Dosya haritası

```
src/marketing/   domain.js (kanal, biçim, sektör, özel günler, karne) · themes.js (şablonlar) · guardian.js (Marka Koruyucu)
                 generator.js (içerik, plan, yorum, WhatsApp, karne, rapor) · metrics.js · mkt.js (store) · repo.js · demo.js · selftest.mjs
src/ui/marketing/ MarketingCenter.jsx + Today, Inbox, CalendarTab, Plan, Campaigns, Channels, Customers, Results, Local, Insights,
                 Studio, Brand, ScorecardTab, SettingsTab, Wizard, parts
server/mkt.js    Pazarlama model görevleri (Gemini)
supabase/schema.sql
```
