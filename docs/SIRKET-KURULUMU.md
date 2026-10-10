# Şirket Kurulumu — şirketin çalışma mantığı formu

Sol menü → **Şirket Kurulumu** (ya da Kağan’a “şirket kurulumu / çalışma prensipleri” yazın; ilk açılışta davet kartı çıkar).
13 bölüm, ~150 soru; hepsi isteğe bağlı, hazır şıklarla. Cevaplar **ofisin gerçekten uyguladığı kurallara** dönüşür ve her zaman
yeniden düzenlenebilir.

## Bölümler
1. Şirket kimliği · 2. Hedefler ve strateji (risk iştahı, öncelikli departmanlar, OKR, bütçe) · 3. Ofis çalışma prensipleri (mesai, tempo,
karar verme, onay biçimi, yükseltme, raporlama, kalite kapısı, çakışma, devir) · 4. CEO Kağan (kişilik, yetki, brifing sıklığı, üslup,
proaktiflik, dağıtım, kırmızı çizgiler) · 5–11. Departmanlar (CEO Ofisi, Yazılım, Tasarım, Pazarlama, Araştırma, Muhasebe, Operasyon: odak,
çalışma biçimi, **otonomi**, öncelik ağırlığı, kalite, KPI, araçlar, işbirliği, inceleme, ritim, kırmızı çizgiler, not) ·
12. Risk, güvenlik, uyum (hassas veri, mevzuat, **her zaman insan onayı gerektiren işler**, olay yönetimi, yapay zekâ politikası) ·
13. Özet ve öneriler.

## Öneri sistemi
- Her soruda **“✦ Önerilen”** vardır; öneri önceki cevaplara bağlıdır (ör. temkinli risk iştahı → her plan onaylı, düşük otonomi; cesur → hız).
- Bölüm başında **“Önerilenleri uygula”**: yalnızca boş soruları doldurur, cevaplarınıza dokunmaz.
- **Yapay zekâ önerisi** (Gemini varsa, `POST /api/ai/company`): bölümdeki boş sorular için gerekçeli öneri; her değer sorunun seçenekleriyle
  doğrulanır, geçersiz değer atılır. Yoksa sistem önerileri kullanılır.
- **Özet** sayfası: türetilen kurallar, çapraz tutarlılık uyarıları (ör. “onay gerekmesin + insan onayı listesi boş”, “CEO’ya tam yetki ama
  ofis her planı onaya bağlıyor”), kaydedilmemiş değişikliklerin farkı.

## Kurallar ofiste nasıl uygulanır (`src/company/rules.js → rulesOf`)
| Cevap | Etki |
|---|---|
| Onay biçimi (her / riskli / hiç) + departman otonomisi (öner / hazırla / uygula) | Plan görevleri onay beklemeden başlar mı: `hiç` → “Öner” dışındakiler hemen; `riskli` → yalnızca “Uygula” departmanlar ve acil olmayan işler; `her` → hep onay |
| Öncelik ağırlığı (1–3) × ofis temposu | Departmanın görev ilerleme hızı (0,8× / 1× / 1,3×) |
| CEO brifing sıklığı | Kağan’ın kendiliğinden proje güncelleme aralığı (sık / normal / seyrek / kapalı) |
| Mesai + “mesai dışında dursun” | Canlı simülasyon mesai dışında ilerlemez |
| Departman kapalı / odak alanları | Kağan kapalı departmana görev vermez; odak kelimeleri yönlendirmede ek anahtar kelimedir |
| Varsayılan öncelik | Yeni planların öncelik seviyesi |
| Tüm cevaplar (kişisel veri hariç) | Gemini bağlamına “ŞİRKET ÇALIŞMA PRENSİPLERİ” olarak gider: Kağan onay, yetki, üslup, kırmızı çizgi ve “her zaman sor” listelerine uyar |
| Departman prensipleri | Oda paneli ve tam ekran panoda “Çalışma prensipleri” kartı |

Boş bırakılan her konu mevcut varsayılan davranışla çalışır; hiçbir soru zorunlu değildir.

## Düzenleme ve sürümler
- Cevaplar yazıldıkça taslak olarak saklanır; **Kaydet** sürüm oluşturur (not ister), kurallar anında devreye girer.
- **Sürümler**: önceki bir kurulumu geri yükleme (yeni sürüm olarak kaydedilir). Son 25 sürüm tutulur.
- **Dışa/içe aktar (JSON)** ve **sıfırla** (özet sayfası).
- Veri tarayıcıda (`localStorage: kkm:company:v1`) tutulur; Supabase geçişinde `repo` desenindeki gibi tek belge → `company_profile` tablosu olur.

## Dosyalar
`src/company/rules.js` (profil, depo, kural türetme; ana pakette küçük) · `src/ui/company/questions.js` (soru kataloğu, öneri ve tutarlılık
motoru) · `src/ui/company/CompanySetup.jsx` (form) · `server/company.js` (Gemini önerisi) · bağlantılar: `src/store.js`, `src/ai.js`,
`server/ai.js`, `src/ui/dept/sections.jsx (DeptPrinciples)`.
