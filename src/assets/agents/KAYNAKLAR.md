# Çalışan modelleri

Sıkıştırılmış (meshopt + webp) karakter ve animasyon dosyaları.

| Dosya | Kaynak | Lisans notu |
|---|---|---|
| `man.glb` | three.js örnekleri — `readyplayer.me.glb` (Ready Player Me avatarı) | Ready Player Me koşullarına tabidir; ticari kullanımdan önce teyit edin |
| `woman.glb` | met4citizen/TalkingHead — `avaturn.glb` (Avaturn) | **Ticari olmayan kullanım.** Ticari kullanım için avaturn.me üzerinden kendi avatarınızı üretin |
| `anims.glb` | three.js örnekleri — `Xbot.glb` (Mixamo animasyonları: idle, walk, agree, headShake) | Mixamo koşulları |

Ürün yayına çıkmadan önce bu modeller kendi ürettiğiniz / lisansı net avatarlarla değiştirilmelidir.
Dosya adları aynı kalırsa kod değişmeden çalışır.

Optimizasyon (woman.glb, anims.glb): kullanılmayan yüz morph hedefleri kaldırıldı, dokular en çok 1024 px webp, geometri meshopt ile sıkıştırıldı; anims.glb'den doku çıkarıldı (yalnızca iskelet + animasyon gerekli). man.glb'ye dokunulmadı: kısa saç gölgelendiricisi baş geometrisinin metre cinsinden konumlarını kullanıyor.
