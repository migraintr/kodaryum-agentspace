# Bölüm 10–15 + ekler: sektör kataloğu, uyum ve riskler, pazara çıkış, yol haritası, metrikler, kararlar, ekler
from lib import *


def part3():
    s = []
    # ── 10. Sektör kataloğu ───────────────────────────────────────────────────────────────────────
    s += chapter('10', 'Sektöre özel kampanya kataloğu')
    s.append(P('Ürünün "sıfır boş sayfa" vaadi, sektöre hazır kampanya kütüphanesiyle gerçek olur. Kurulumda işletme sektörünü seçer; sistem aşağıdaki gibi <b>hazır oyun kitapları</b> yükler. Her satır bir şablon ailesidir (metin, görsel, takvim, ölçüt dahil). İlk sürümde 5–6 sektör, sonra genişletin.', LEAD))
    s.append(table([
        ['Sektör', 'Ana kanallar', 'En iyi 3 oyun', 'Ana ölçüt'],
        ['Restoran / kafe', 'Instagram, Google Haritalar, WhatsApp', '1) Haftanın menüsü + hikâye anketi  2) Yorum ve fotoğraf kampanyası  3) Hafta içi boş saat teklifi', 'Rezervasyon, yol tarifi, yorum puanı'],
        ['Kuaför / güzellik', 'Instagram, WhatsApp, Google', '1) Önce-sonra serisi  2) Randevu hatırlatma + boş slot kampanyası  3) Doğum günü indirimi', 'Randevu, doluluk oranı, tekrar gelme'],
        ['Klinik / diş / estetik', 'Google, Instagram (bilgilendirici), web', '1) Bilgi içeriği serisi (reklam yönetmeliğine uygun)  2) Randevu sonrası memnuniyet + yorum  3) Kontrol hatırlatması', 'Randevu talebi, kontrol geri dönüşü'],
        ['Butik / perakende', 'Instagram, Facebook, WhatsApp kataloğu', '1) Yeni sezon lansmanı  2) Stok eritme + son günler (doğruysa)  3) Sadık müşteriye erken erişim', 'Mağaza ziyareti, sipariş, sepet ortalaması'],
        ['E-ticaret', 'Meta/Google reklam, e-posta, WhatsApp', '1) Katalog reklamı  2) Terk edilmiş sepet akışı  3) Alışveriş sonrası çapraz satış', 'ROAS, sepet kurtarma, tekrar satın alma'],
        ['Otel / turizm', 'Google, Instagram, Booking benzeri kanallar, e-posta', '1) Sezon öncesi erken rezervasyon  2) Yerel deneyim içerikleri  3) Konuk sonrası yorum + sadakat', 'Doğrudan rezervasyon payı, doluluk'],
        ['Emlak', 'Instagram, Facebook, Google, WhatsApp', '1) İlan videosu/sunumu  2) Mahalle rehberi içerikleri  3) Lead nitelendirme asistanı', 'Nitelikli lead, gösterim sayısı'],
        ['Eğitim / kurs', 'Instagram, Google, WhatsApp, e-posta', '1) Ücretsiz deneme dersi  2) Başarı hikâyeleri  3) Kayıt dönemi geri sayım', 'Deneme kaydı, kayıt dönüşümü'],
        ['B2B hizmet / yazılım', 'LinkedIn, e-posta, web, içerik', '1) Vaka çalışması + LinkedIn serisi  2) Bilgi içeriği + e-posta nurturing  3) Demo davet akışı', 'Demo talebi, nitelikli lead, satış döngüsü'],
        ['Üretici / toptan', 'Web, LinkedIn, fuar, e-posta', '1) Ürün kataloğu ve teknik içerik  2) Bayi/toptancı kampanyası  3) Referans ve sertifika öne çıkarma', 'Teklif talebi, bayi başvurusu'],
        ['Spor salonu / stüdyo', 'Instagram, WhatsApp, Google', '1) Dönüşüm hikâyeleri  2) Ücretsiz deneme haftası  3) Üye geri kazanım (uyuyan üyeler)', 'Deneme, yeni üye, üye elde tutma'],
        ['Oto servis / bakım', 'Google, WhatsApp, Instagram', '1) Mevsimlik bakım hatırlatma  2) Önce-sonra / şeffaf fiyat  3) Yorum ve sadakat', 'Randevu, tekrar ziyaret'],
    ], [1.3, 1.6, 3.5, 1.5]))
    s.append(Spacer(1, 8))
    s.append(sec('Takvim kütüphanesi'))
    s.append(P('Türkiye özel günleri ve ticari dönemleri tüm şablonlara bağlı bir <b>takvim katmanı</b> olarak verilir (yılbaşı, 14 Şubat, Kadınlar Günü, Ramazan ve bayramlar, 23 Nisan, Anneler/Babalar Günü, yaz sezonu, okula dönüş, Efsane Cuma ve Kasım indirimleri, yılbaşı alışverişi). Dinî bayram tarihleri her yıl güncellenir; sistem tarihleri bir kaynaktan doğrulayarak çeker. Sektöre göre ilgili günler seçilir (örneğin çiçekçi için Anneler Günü ve 14 Şubat kritik).'))
    s.append(PageBreak())

    # ── 11. Uyum ve riskler ───────────────────────────────────────────────────────────────────────
    s += chapter('11', 'Uyum, güvenlik ve riskler')
    s.append(callout('Hukuki not', 'Aşağıdakiler ürün tasarımı için genel çerçevedir, hukuki görüş değildir. Mevzuat ve platform politikaları değişir; her madde için güncel metni doğrulayın ve lansman öncesi bir hukukçudan görüş alın.', 'red'))
    s.append(Spacer(1, 6))
    s.append(sec('Uyum alanları ve ürün karşılıkları'))
    s.append(table([
        ['Alan', 'Neden önemli', 'Ürün karşılığı'],
        ['KVKK (6698)', 'Müşteri kişisel verisi işlenir (kişi, konuşma, telefon)', 'Aydınlatma metni şablonu, saklama süresi, silme/erişim talebi, veri işleme sözleşmesi (biz: veri işleyen), veri minimizasyonu'],
        ['Ticari elektronik ileti ve İYS', 'SMS/e-posta/arama için izin ve İYS kaydı gerekir (B2B ve esnaf istisnalarının koşulları ayrıca doğrulanmalı)', 'İzin kaydı, İYS entegrasyonu/aktarımı, abonelikten çıkma, sessiz saat, izinsiz gönderimi engelleme'],
        ['Reklam ve haksız ticari uygulamalar', 'Yanıltıcı, karşılaştırmalı, abartılı iddia ve gizli reklam yaptırım doğurabilir', 'Marka Koruyucu yasal kontrol listeleri; "en iyi/tek" gibi ifadelerde kanıt zorunluluğu; influencer iş birliğinde reklam etiketi'],
        ['Sektörel kısıtlar', 'Sağlık, finans, gıda, alkol/tütün, ilaç gibi alanlarda ek kurallar', 'Sektör modu: yasaklı ifadeler, zorunlu uyarılar, tüm içerik için kademe 1 (sahip yayınlar)'],
        ['Platform politikaları', 'Meta, Google, TikTok, WhatsApp kuralları; ihlalde hesap kısıtlaması', 'Politika kontrolleri, hız sınırları, şablon mesaj onayı, açık rıza; sahte etkileşim yok'],
        ['Telif ve lisans', 'Görsel, müzik, font, metin alıntısı', 'Yalnız lisanslı/kullanıcıya ait varlık; lisans kaydı; yapay zekâ üretimi etiketleme'],
        ['Veri aktarımı', 'Model çağrıları yurt dışında işlenebilir', 'Sözleşme ve aydınlatmada açıklama; kurumsal için bölgesel seçenek; hassas veriyi modele göndermeme (maskeleme)'],
    ], [1.4, 2.4, 3.6]))
    s.append(Spacer(1, 8))
    s.append(sec('Risk kaydı'))
    s.append(table([
        ['Risk', 'Olasılık', 'Etki', 'Önlem'],
        ['Meta/Google/WhatsApp API erişimi gecikir ya da reddedilir', 'Yüksek', 'Yüksek', 'Başvuruları Faz 0\'da yapın; Yardımcı mod; birden çok kanal; resmî iş ortağı programlarını araştırın'],
        ['Platform kuralı değişir, bağlayıcı bozulur', 'Orta', 'Orta', 'Bağlayıcı testleri, sürüm izleme, hızlı yama süreci, kullanıcıya şeffaf durum sayfası'],
        ['Yanlış/zararlı içerik yayınlanır (halüsinasyon, yanlış fiyat)', 'Orta', 'Yüksek', 'Gerçekler tablosu, Marka Koruyucu, onay-önce, geri çekme, sorumluluk sınırları sözleşmede'],
        ['İzinsiz mesaj nedeniyle yaptırım/şikâyet', 'Orta', 'Yüksek', 'İzin kaydı zorunlu; izinsiz gönderim teknik olarak engellenir'],
        ['Müşteri verisi sızıntısı', 'Düşük', 'Çok yüksek', 'Kiracı izolasyonu, şifreleme, en az yetki, sızma testi, olay müdahale planı'],
        ['Model maliyeti ve kalitesi değişir', 'Orta', 'Orta', 'Çoklu model, önbellek, değerlendirme seti, maliyet tavanı, fiyat marjı tamponu'],
        ['Kullanıcı sonuç görmez ve ayrılır', 'Yüksek', 'Yüksek', 'İlk 15 dk değeri, 30 günlük sonuç özeti, pazarlama karnesi öncesi/sonrası, proaktif danışma'],
        ['Sahte ya da düşük kaliteli içerik algısı ("yapay zekâ kokusu")', 'Orta', 'Orta', 'Marka hafızası, altın örnekler, gerçek fotoğraf, ton ayarı, düzenleme öğrenmesi'],
        ['Destek yükü ürünü boğar', 'Orta', 'Orta', 'Sihirbaz ve hazır şablonlar, uygulama içi yardım, "ne oldu?" açıklamaları; ilk müşterilerde elle yakın takip'],
        ['Büyük oyuncular özellik ekler', 'Yüksek', 'Orta', 'Yerel kanal, Türkçe kalite, hafıza ve hizmet derinliği; hızlı iterasyon; ajans/ortak ağı'],
        ['Atıf güvenilir olmaz, rakamlar tartışılır', 'Yüksek', 'Orta', 'Dürüst "tahmin" etiketi, beyan + kod + UTM birleşimi, satış bildirimini kolaylaştırma'],
    ], [2.6, 0.7, 0.7, 3.4]))
    s.append(PageBreak())

    # ── 12. GTM ───────────────────────────────────────────────────────────────────────────────────
    s += chapter('12', 'Pazara çıkış stratejisi')
    s.append(sec('İdeal müşteri profili (ICP)'))
    s.append(callout('İlk hedef', '<b>3–50 çalışanlı, Instagram + Google Haritalar + WhatsApp ile müşteri bulan yerel hizmet ve perakende işletmeleri; karar verici sahibi.</b> Nedenler: karar hızlı, acı net, kanallar standart, rakip ajans pahalı, deneme kolay, referans yayılımı güçlü (esnaf ağı).', 'orange'))
    s.append(Spacer(1, 6))
    s.append(sec('Kanallar'))
    s.append(table([
        ['Kanal', 'Nasıl', 'Beklenti'],
        ['Pazarlama karnesi (ürün-öncü büyüme)', 'URL gir → 2 dakikada Google/Instagram/web puanı + 5 hızlı kazanım; sonuç e-posta/WhatsApp ile; deneme daveti', 'Ücretli reklam ve sosyal medyada en ucuz lead; ürünü gösterir'],
        ['Doğrudan satış (WhatsApp/Instagram)', 'Yerel işletmelere kısa video demo + canlı karne', 'İlk 10–30 müşteri için en hızlı yol'],
        ['Ortaklar', 'Muhasebeciler, yazılım bayileri (POS, rezervasyon), ticaret odaları, esnaf birlikleri, franchise merkezleri', 'Düşük satın alma maliyeti; güven aktarımı'],
        ['İçerik ve topluluk', 'Sektörel rehberler, "bu ay ne yapmalı" bültenleri, YouTube/Instagram vaka çalışmaları', 'Uzun vadeli, markaya güven'],
        ['Tavsiye programı', 'Müşteri getirene bir ay hediye; sektör kümesi kampanyaları', 'Esnaf ağında hızlı yayılım'],
        ['Büyük işletme (ikinci dalga)', 'Pilot + referanslar + güvenlik/uyum dokümanı; ajanslarla ortaklık', 'Uzun satış döngüsü; yüksek değer'],
    ], [1.6, 3.4, 2.2]))
    s.append(Spacer(1, 6))
    s.append(sec('Pilot planı (ilk 6 hafta)'))
    s.append(table([
        ['Hafta', 'Hedef', 'Başarı ölçütü'],
        ['0–1', '10 pilot işletme seç (3 sektör); kurulum randevusu; beklenti sözleşmesi', '10 imzalı pilot, başlangıç ölçümü alındı'],
        ['1–2', 'Onboarding + ilk içerik + Google profil düzeltmeleri', 'Her işletmede ≥ 10 onaylı içerik; profil puanı artışı'],
        ['2–4', 'Kanal bağlantıları, WhatsApp asistanı, haftalık rapor', '≥ %60 işletme kanal bağladı; ilk lead kaynağı atfedildi'],
        ['4–6', 'Sonuç görüşmesi, fiyat testi, referans/yorum', 'Ödemeye hazır işletme ≥ %50; NPS ≥ 40; ≥ 3 referans'],
    ], [0.6, 3.8, 2.8]))
    s.append(Spacer(1, 6))
    s.append(sec('Müşteri başarısı ve destek'))
    s += bullets([
        '<b>İlk 30 gün sözü:</b> 30. günde "bu ay şunu yaptık, şu sonucu getirdi" raporu; sonuç yoksa hizmet ücretsiz uzatılır (ya da ilk ay iade; ekonomisini hesaplayın).',
        '<b>Yazılım + hizmet melezi (kurumsal için):</b> büyük müşterilerde insan hesap yöneticisi ajanları yönlendirir; ürünün ölçeklenmeyen kısmını bilinçli olarak içeri alın.',
        '<b>Geri bildirim döngüsü:</b> ilk 50 müşteriyle haftalık görüşme; ret nedenleri ürün backlog\'unun ana kaynağı.',
    ])
    s.append(PageBreak())

    # ── 13. Yol haritası ──────────────────────────────────────────────────────────────────────────
    s += chapter('13', 'Yol haritası')
    s.append(P('Süreler, 3–5 kişilik bir ürün ekibi ve mevcut kod tabanı varsayımına dayalı <b>tahmindir</b>. Kritik yol, kanal erişim başvurularıdır; başvurular kod yazımından bağımsız ilerler.', LEAD))
    s.append(Gantt())
    s.append(Spacer(1, 8))
    s.append(table([
        ['Faz', 'Kapsam', 'Çıktı', 'Kabul kriteri'],
        ['Faz 0 · Keşif ve temel (2 hf)', '10 işletme görüşmesi; Meta/Google/WhatsApp başvuruları; arka uç iskeleti (Cloud Run, PostgreSQL, kimlik); şema v1; değerlendirme seti başlangıcı', 'Doğrulanmış problem; başvurular yapıldı; çalışan "merhaba dünya" hattı', '10 görüşme tamam; en az 3 işletme pilota söz verdi'],
        ['Faz 1 · MVP (8 hf)', 'M1 (profil + Marka Kartı), M3 (30 günlük plan), M4 (gönderi/hikâye/Google gönderisi/e-posta), M12 (şablon motoru), M10 (onay kutusu + Marka Koruyucu v1), M5 (Meta yayın + Yardımcı mod), M9 (basit pano + patron raporu), pazarlama karnesi', 'Gerçek bir işletme için uçtan uca döngü; 10 pilot', '15 dk kurulum; ≥ %60 taslak düzenlemesiz onay; yayın başarısı ≥ %99; 0 ciddi olay'],
        ['Faz 2 · Yerel ve müşteri (8 hf)', 'M6 (Google profil, yorum asistanı), M8 (WhatsApp asistanı + CRM + izin), M2 (rakip izleme), M5 genişlemesi (Google, e-posta)', 'Kaçan müşteri azalır; yerel görünürlük artar', 'İlk yanıt ≤ 5 dk; pilotlarda lead → randevu ölçülür; Google görüntüleme artışı'],
        ['Faz 3 · Reklam ve atıf (10 hf)', 'M7 (Meta + Google Ads otopilot, kural motoru, bütçe tavanları), M9 tam (atıf), M11 (Shopify/Woo/ikas)', 'Ölçülebilir ROI', 'Müşteri başı maliyet düşüşü; harcama aşımı 0; atıf anketi'],
        ['Faz 4 · Kurumsal (12 hf)', 'Roller, çok aşamalı onay, çok şube/marka, SSO, API/webhook, özel pano, güvenlik dokümanı, SOC benzeri kontroller', 'Büyük işletme pilotu', '1–2 kurumsal pilot; güvenlik incelemesi geçti'],
        ['Sürekli', 'Güvenlik testleri, KVKK, maliyet izleme, model değerlendirme, deneyler, sektör kütüphanesi', '', ''],
    ], [1.3, 3.4, 1.8, 2]))
    s.append(Spacer(1, 6))
    s.append(sec('Mevcut koda eşleme (nereden başlanır)'))
    s.append(table([
        ['Dosya / alan', 'Değişiklik'],
        ['server/ (ai.js, http.js)', 'Marka bağlamlı içerik üretim ve denetim görevleri (şemalı); iş kuyruğu uç noktaları; kimlik doğrulama ara katmanı'],
        ['server/marketing/* (yeni)', 'Marka, plan, içerik, onay, yayın, ölçüm servisleri; bağlayıcılar (connectors/meta.js, google.js, whatsapp.js, email.js)'],
        ['src/store.js', 'Sahte görev simülasyonu yerine sunucu verisi; pazarlama görevlerinin çıktısı artefakt olarak tutulur'],
        ['src/ui/dept/sections.jsx (MarketingSection)', 'Örnek veri yerine M9 metrikleri; mevcut grafik bileşenleri korunur'],
        ['src/ui/CalendarModal.jsx, calendar.js', 'İçerik takvimi görünümü ve özel gün katmanı'],
        ['src/hq/Agents.jsx, kadro/work.js', 'Pazarlama ajanlarının davranışı gerçek işe bağlanır (içerik üretirken yazar, reklam optimize ederken fareyle çalışır)'],
        ['src/data.js', 'Yeni roller (SEO/yerel, CRM/WhatsApp, Marka Koruyucu) çalışan olarak eklenir'],
        ['Yeni: src/ui/marketing/* ', 'Pazarlama Merkezi ekranları (Bugün, Onay kutusu, Takvim, Kampanyalar, Kanallar, Müşteriler, Sonuçlar, Marka hafızası)'],
    ], [2.6, 4.6]))
    s.append(Spacer(1, 6))
    s.append(sec('İlk iki haftanın backlog\'u (Faz 0 → Faz 1 başı)'))
    s += bullets([
        'Cloud Run + Cloud SQL (PostgreSQL) + Secret Manager kurulumu; kimlik ve rol; kiracı modeli (workspace).',
        'Şema v1: workspace, brand, brand_fact, content_item, approval, run_log; geçiş (migration) altyapısı.',
        'Marka tarama prototipi: URL → Marka Kartı JSON (Gemini şemalı çıktı) → düzenleme ekranı.',
        'İçerik üretim hattı v0: brief → 3 varyant → Marka Koruyucu → onay kuyruğu (yalnız Instagram gönderisi).',
        'Meta uygulaması ve işletme doğrulaması başvurusu; Google Business Profile ve Ads erişim başvuruları; WhatsApp işletme hesabı.',
        'Değerlendirme seti: 30 brief + 10 altın örnek; otomatik testler (yasaklı kelime, gerçek eşleşme).',
        'Pazarlama karnesi prototipi: URL → Google/Instagram/web puanı (halka açık verilerle).',
        '10 pilot adayıyla görüşme takvimi; kayıt ve beklenti sözleşmesi şablonu.',
    ])
    s.append(PageBreak())

    # ── 14. Metrikler ve birim ekonomisi ──────────────────────────────────────────────────────────
    s += chapter('14', 'Metrikler ve birim ekonomisi')
    s.append(sec('Metrik hiyerarşisi'))
    s.append(table([
        ['Düzey', 'Metrik', 'Tanım / hedef'],
        ['Kuzey yıldızı', 'Haftalık "değerli eylem" sayısı', 'Hesap başına haftada onaylanıp yayınlanan içerik + yanıtlanan lead sayısı'],
        ['Müşteri sonucu', 'Lead, randevu, satış, müşteri başı maliyet', 'İşletmenin gördüğü sonuç; 30 günlük değişim (öncesi/sonrası)'],
        ['Aktivasyon', '7 günde ilk yayın', 'Kayıt olanların ≥ %60\'ı ilk 7 günde yayınlar'],
        ['Kalite', 'Düzenlemesiz onay oranı; ret nedenleri; olay sayısı', '≥ %60 ve artan; olay ≈ 0'],
        ['Bağlılık', '4. hafta aktif hesap oranı; haftalık rapor okunma', '≥ %70; ≥ %60'],
        ['Ticari', 'MRR, churn, CAC, LTV, brüt marj', 'Aylık churn ≤ %5 (hedef); brüt marj ≥ %70; CAC geri dönüş ≤ 6 ay'],
        ['Teknik', 'Yayın başarı oranı, p95 gecikme, iş başına maliyet', '≥ %99; ≤ 2 dk; izlenen ve azalan'],
    ], [1.2, 2.5, 3.5]))
    s.append(Spacer(1, 8))
    s.append(sec('Yapay zekâ maliyeti: çalışma sayfası'))
    s.append(P('Aşağıdaki tablo, "Başlangıç" paketindeki bir müşterinin aylık model kullanımını <b>varsayımlarla</b> hesaplar. Toplam token sayısını, güncel Vertex AI fiyat listesindeki giriş ve çıkış token fiyatlarıyla çarparak maliyeti bulun; görsel ve video üretimini ayrı kalemde izleyin (genellikle metinden çok daha pahalıdır).'))
    s.append(table([
        ['İş türü', 'Aylık adet (varsayım)', 'Token / adet (giriş + çıkış)', 'Aylık toplam token'],
        ['Sosyal gönderi (3 varyant + denetim)', '24', '~8.000', '~190.000'],
        ['Hikâye / kısa içerik', '8', '~4.000', '~32.000'],
        ['E-posta bülteni', '4', '~12.000', '~48.000'],
        ['Yorum yanıtı taslağı', '20', '~2.000', '~40.000'],
        ['WhatsApp asistan konuşması', '60', '~3.000', '~180.000'],
        ['Haftalık rapor + analiz', '4', '~10.000', '~40.000'],
        ['Plan ve strateji güncellemesi', '1', '~30.000', '~30.000'],
        ['Sohbet ve çeşitli', '-', '-', '~100.000'],
        ['<b>Toplam (metin)</b>', '', '', '<b>~660.000 token / ay</b>'],
    ], [2.6, 1.4, 1.8, 1.6]))
    s.append(Spacer(1, 6))
    s.append(callout('Maliyet formülü ve marj kuralı', ['<b>Maliyet = (giriş token × giriş fiyatı) + (çıkış token × çıkış fiyatı).</b> Marka bağlamını önbelleğe almak, üç varyantı tek çağrıda üretmek ve denetimi kısa tutmak rakamı belirgin düşürür. Görsel/video, WhatsApp mesaj ücretleri, SMS ve altyapıyı ayrıca ekleyin.', '<b>Brüt marj hedefi ≥ %70:</b> paket fiyatı, tahmini toplam maliyetin en az 3,3 katı olmalı. İlk pilotlarda gerçek maliyeti ölçün; varsayım yerine veriyle fiyatlayın.'], 'orange'))
    s.append(PageBreak())

    # ── 15. Kararlar ──────────────────────────────────────────────────────────────────────────────
    s += chapter('15', 'Sizden beklenen kararlar')
    s.append(P('Aşağıdaki sorular yanıtlanmadan ürün kapsamı kesinleşmez. Her soru için bir öneri verilmiştir.', LEAD))
    s.append(table([
        ['#', 'Karar', 'Öneri', 'Etki'],
        ['1', 'İlk hedef kitle ve sektör', 'Yerel hizmet ve perakende (3–50 kişi); 3 sektörle başla (kuaför/güzellik, restoran/kafe, butik)', 'Şablon kütüphanesi, pilot seçimi'],
        ['2', 'Saf yazılım mı, yazılım + hizmet mi?', 'Küçük/orta: saf yazılım; kurumsal: hesap yöneticili melez', 'Operasyon, fiyat, ekip'],
        ['3', 'MVP kanalları', 'Instagram/Facebook yayın + Google İşletme + e-posta; WhatsApp Faz 2; diğerleri Yardımcı mod', 'API başvuruları, süre'],
        ['4', 'Arka uç teknolojisi ve bulut', 'Cloud Run + PostgreSQL + Vertex AI (mevcut Cloud kredisiyle tutarlı)', 'Maliyet, hız'],
        ['5', 'Fiyat modeli', 'Sabit paketler + reklam yönetimi eklentisi; 14 gün deneme', 'Gelir, satış kolaylığı'],
        ['6', 'Veri konumu ve KVKK duruşu', 'Hukuki danışmanlık; sözleşme ve aydınlatma şablonları; kurumsal için bölgesel seçenek', 'Kurumsal satış, itibar'],
        ['7', 'Modülün ürün adı', 'Örnek: "Kodaryum Pazarlama" (çatı marka AgentSpace içinde)', 'Marka, site, satış dili'],
        ['8', 'Ekip kapasitesi', 'Backend, ön yüz, yapay zekâ/istem, ürün tasarımı, müşteri başarısı rolleri; kimler var?', 'Yol haritası süreleri'],
        ['9', 'Pilot işletmeler', 'Mevcut çevreden 10 aday; kimleri tanıyorsunuz?', 'Faz 0 hızı'],
        ['10', '3B ofis önceliği', 'Çekirdek 2B önce, 3B bağlantılar sonra; pazarlama demoları 3B\'yi vitrin yapar', 'Geliştirme sırası'],
    ], [0.35, 2, 3.9, 1.6]))
    s.append(Spacer(1, 10))
    s.append(callout('Önerilen ilk adım (bu hafta)', ['1) 10 işletmeyle 20\'şer dakikalık görüşme: bugün pazarlamayı nasıl yapıyorlar, neye para ödüyorlar, neden vazgeçiyorlar?', '2) Meta, Google ve WhatsApp erişim başvurularını başlatın (haftalar sürer).', '3) Pazarlama karnesi prototipini 1 haftada çıkarın: hem lead toplar hem ürünü sınar.', '4) Bu belgedeki kararları (Bölüm 15) birlikte netleştirin; ardından Faz 1 backlog\'unu sprintlere bölelim.'], 'green'))
    return s


def appendices():
    s = []
    s.append(PageBreak())
    s += chapter('A', 'Ek A · Onboarding soru listesi')
    s.append(P('Röportaj, sohbet biçiminde, mümkün olduğunca hazır şıklarla yürür. Web sitesi ve sosyal hesaplardan çıkarılabilen cevaplar önceden doldurulur ve yalnızca doğrulatılır.'))
    s.append(table([
        ['#', 'Soru', 'Amaç'],
        ['1', 'İşletmeniz ne yapıyor, en çok neyle tanınıyorsunuz?', 'Konumlandırma'],
        ['2', 'En çok kazandıran 3 ürün/hizmet hangisi? Fiyat aralıkları?', 'Ürün kataloğu, gerçekler'],
        ['3', 'Hedef müşteriniz kim? (yaş, ilgi, bölge, ihtiyaç)', 'Personalar'],
        ['4', 'Müşteriler sizi nereden buluyor? (en çok 3 kaynak)', 'Kanal karması, atıf başlangıcı'],
        ['5', 'Bu ay için en çok istediğiniz sonuç? (arama, randevu, sipariş, ziyaret)', 'Hedef'],
        ['6', 'Aylık pazarlama bütçeniz (reklam hariç / dahil)?', 'Plan ve bütçe'],
        ['7', 'Rakipleriniz kimler? Hangisini örnek alırsınız, hangisini beğenmezsiniz?', 'Rakip izleme'],
        ['8', 'Markanızı üç kelimeyle anlatın. Hangi dil: resmî mi, samimi mi?', 'Ses tonu'],
        ['9', 'Asla söylemek/yapmak istemediğiniz şeyler? (kelimeler, konular, indirim tarzı)', 'Yasaklılar'],
        ['10', 'Çalışma saatleri, şubeler, rezervasyon/randevu yöntemi?', 'Gerçekler, M8'],
        ['11', 'Geçmişte işe yarayan ve yaramayan kampanyalar?', 'Öğrenimler'],
        ['12', 'Yıl içinde kritik dönemleriniz? (sezon, özel günler, kampanya takvimi)', 'Takvim'],
        ['13', 'Elinizde hangi görsel/video varlıkları var? (logo, ürün fotoğrafı, mekân)', 'M12'],
        ['14', 'Hangi hesaplarınız var, kim yönetiyor? (Instagram, Google, Facebook, TikTok, web)', 'Bağlantılar'],
        ['15', 'Müşteri iletişim iznini nasıl topluyorsunuz? Telefon/WhatsApp listeniz var mı?', 'Uyum, M8'],
        ['16', 'Yoğun saatleriniz? Gelen mesajlara kim bakıyor, ne kadar sürede?', 'M8 hızı'],
        ['17', 'Hangi içeriği onaylamadan yayınlanmasını asla istemezsiniz?', 'Güven kademeleri'],
        ['18', 'Satışı nasıl takip ediyorsunuz? Kaynak soruyor musunuz?', 'Atıf'],
        ['19', 'Başarıyı nasıl tanımlarsınız? 3 ay sonra neyi görmek istersiniz?', 'KPI hedefi'],
        ['20', 'Haftalık raporu hangi kanaldan, hangi saatte almak istersiniz?', 'Rapor teslimi'],
    ], [0.35, 5, 1.8]))
    s.append(PageBreak())

    s += chapter('B', 'Ek B · Örnek haftalık ritim')
    s.append(P('Bir kuaför işletmesinin "Büyüme" planında tipik hafta (örnek). Sahibinin toplam emeği: haftada ~20 dakika (onay + rapor).'))
    s.append(table([
        ['Gün', 'Otomatik (sistem)', 'Sahibin dokunuşu'],
        ['Pazartesi', 'Haftanın planı hazır; 3 gönderi + 4 hikâye üretildi, denetlendi', 'Onay kutusunda toplu onay (3 dk)'],
        ['Salı', 'Instagram gönderisi 12:30; Google İşletme gönderisi; yorum yanıtları', 'Olumsuz yorum varsa yanıt onayı (1 dk)'],
        ['Çarşamba', 'WhatsApp\'tan randevu talepleri yanıtlandı, boş slot kampanyası gönderildi (izinli kişilere)', 'Yok'],
        ['Perşembe', 'Reklam bütçesi performansa göre kaydırma önerisi; yeni yaratıcı testi', 'Bütçe önerisini onayla (1 dk)'],
        ['Cuma', 'Hafta sonu kampanya gönderisi + hikâye; rakip fırsat notu', 'Yok'],
        ['Cumartesi', 'Hikâye + canlı anket; randevu hatırlatmaları', 'Yok'],
        ['Pazar', 'Haftalık patron raporu WhatsApp\'a gelir; sonraki haftanın planı hazırlanır', 'Raporu oku, plan notlarını onayla (5 dk)'],
    ], [1, 4, 2.3]))
    s.append(Spacer(1, 10))

    s += chapter('C', 'Ek C · Üç örnek senaryo')
    s.append(cards([
        ('Butik (çiçekçi, 4 kişi)', '<b>Önce:</b> sahibi haftada 1 gönderi, Anneler Günü haftası panik. <b>Sonra:</b> Anneler Günü için 3 hafta öncesinden plan, ön sipariş kampanyası, WhatsApp sipariş asistanı, Google gönderileri. <b>Sonuç ölçütü:</b> ön sipariş sayısı, WhatsApp sipariş oranı.'),
        ('Diş kliniği (12 kişi)', '<b>Önce:</b> Google puanı 4.1, yorum azlığı, randevu telefonla. <b>Sonra:</b> hasta sonrası yorum daveti, bilgilendirici içerik (yönetmeliğe uygun, kademe 1), WhatsApp randevu asistanı, kontrol hatırlatması. <b>Ölçüt:</b> yeni randevu, yorum puanı/sayısı, kontrol geri dönüşü.'),
        ('B2B yazılım (30 kişi)', '<b>Önce:</b> LinkedIn düzensiz, e-posta yok, lead takibi Excel. <b>Sonra:</b> vaka çalışması serisi, bilgi içeriği + nurturing e-postaları, demo davet akışı, CRM entegrasyonu, haftalık pipeline raporu. <b>Ölçüt:</b> nitelikli demo talebi, satış döngüsü.'),
    ], cols=3, color=BLUE))
    s.append(PageBreak())

    s += chapter('D', 'Ek D · Şema ve istem örnekleri')
    s.append(P('Ajanlar serbest metin yerine şemalı çıktı üretir. Aşağıdakiler örnek <i>kavramsal</i> şemalardır; alan adları uygulamada netleştirilir.'))
    s.append(sec('Marka Koruyucu denetim çıktısı'))
    s.append(Paragraph('<font name="Courier" size="8.4">{ "verdict": "passed | needs_fix | blocked",<br/>&nbsp;&nbsp;"checks": { "tone": 0.0-1.0, "forbidden_terms": [..], "unverified_claims": [{"text": "...", "reason": "..."}],<br/>&nbsp;&nbsp;&nbsp;&nbsp;"legal_flags": ["comparative_claim", "health_claim"], "spelling": [..] },<br/>&nbsp;&nbsp;"suggested_fix": "…", "explain": "Neden bu karar verildi (tek paragraf)" }</font>', st('code', fontName='Courier', fontSize=8.4, leading=12, backColor=SOFT, borderPadding=7, leftIndent=4)))
    s.append(Spacer(1, 8))
    s.append(sec('İçerik üretim brief\'i'))
    s.append(Paragraph('<font name="Courier" size="8.4">{ "goal": "appointments", "channel": "instagram_post", "theme": "Anneler Günü ön sipariş",<br/>&nbsp;&nbsp;"must_include": ["fiyat aralığı", "WhatsApp ile sipariş"], "facts_ref": ["brand_fact#12", "product#4"],<br/>&nbsp;&nbsp;"tone": "samimi, siz", "variants": 3, "length": "≤ 220 karakter + 5 etiket" }</font>', st('code2', fontName='Courier', fontSize=8.4, leading=12, backColor=SOFT, borderPadding=7, leftIndent=4)))
    s.append(Spacer(1, 8))
    s.append(sec('İstem ilkeleri'))
    s += bullets([
        'Sistem istemi: rol, marka kuralları ve yasaklılar; <b>yalnızca verilen gerçekleri kullan</b>, bilmediğinde "bilmiyorum" ya da soru sor.',
        'Dış içerik (müşteri mesajı, web sayfası) açıkça "VERİ" bloğunda; içindeki talimatlar yok sayılır.',
        'Çıktı her zaman şemalı JSON; serbest metin yalnızca ilgili alanlarda.',
        'İstem sürümleri ve değerlendirme sonuçları kayıtlıdır; değişiklik testten geçmeden yayına girmez.',
    ])
    s.append(PageBreak())

    s += chapter('E', 'Ek E · Terimler sözlüğü')
    s.append(table([
        ['Terim', 'Anlamı'],
        ['CAC / müşteri edinme maliyeti', 'Bir yeni müşteri kazanmak için harcanan toplam pazarlama ve satış maliyeti'],
        ['CPL / lead başı maliyet', 'Bir müşteri adayı (iletişim talebi) başına maliyet'],
        ['ROAS', 'Reklam harcamasının getirdiği gelir / harcama (ör. 4x = 1 ₺ harcamaya 4 ₺ gelir)'],
        ['CTR', 'Tıklama oranı: tıklama / gösterim'],
        ['UTM', 'Bağlantıya eklenen izleme parametreleri; trafiğin kaynağını gösterir'],
        ['Atıf (attribution)', 'Bir satışın hangi pazarlama temas noktasına bağlanacağı'],
        ['RAG', 'Modelin yanıtı üretirken ilgili belgeleri (marka hafızası) aratıp bağlama eklemesi'],
        ['Artefakt', 'Ajanın ürettiği, şemalı ve izlenebilir iş çıktısı (içerik öğesi, kampanya, rapor)'],
        ['Yardımcı mod', 'Bağlantı olmadan içeriğin hazırlanıp kopyala/indir ve hatırlatıcıyla sunulduğu mod'],
        ['İYS', 'İleti Yönetim Sistemi; ticari elektronik ileti izinlerinin kaydı'],
        ['KVKK', 'Kişisel Verilerin Korunması Kanunu'],
        ['NAP', 'Ad-adres-telefon bilgisinin dizinlerde tutarlılığı (yerel SEO)'],
        ['LTV', 'Bir müşterinin tüm ilişki süresince getireceği değer'],
        ['MRR', 'Aylık tekrarlayan gelir'],
        ['Prompt injection', 'Dış içeriğe gömülü komutlarla modeli yanlış yönlendirme saldırısı'],
        ['Halüsinasyon', 'Modelin doğru olmayan bilgiyi kendinden emin biçimde üretmesi'],
    ], [1.6, 5.6]))
    s.append(Spacer(1, 14))
    s.append(callout('Belgenin kapsamı', 'Bu belge Kodaryum AgentSpace projesinin mevcut durumunun incelenmesi ve pazarlama alanındaki genel iyi uygulamalar temel alınarak hazırlanmıştır. Pazar büyüklüğü, fiyat, rakip özellikleri, platform kuralları ve mevzuat için doğrulanmış güncel kaynaklarla teyit gerekir; belgede sayısal pazar verisi iddia edilmemiştir.', 'blue'))
    return s
