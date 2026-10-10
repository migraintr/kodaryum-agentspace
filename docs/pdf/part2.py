# Bölüm 5–9: modül kataloğu, segment paketleri, ajan tasarımı, teknik mimari, ürün ve ekran tasarımı
from lib import *


def module(code, title, goal, features, agents, data, mvp, kpi, color=BLUE):
    rows = [
        [Paragraph(f'<font color="#ffffff"><b>{code}</b></font>', st('mc', fontName='S-B', fontSize=11, textColor=colors.white, alignment=TA_CENTER, spaceAfter=0)),
         Paragraph(f'<b>{title}</b><br/><font size="8.6" color="#64748b">{goal}</font>', st('mt', fontName='S-B', fontSize=11, leading=14, textColor=NAVY, spaceAfter=0))]
    ]
    head = Table(rows, colWidths=[40, CW - 40])
    head.setStyle(TableStyle([('BACKGROUND', (0, 0), (0, 0), color), ('BACKGROUND', (1, 0), (1, 0), SOFT), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                              ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7), ('LEFTPADDING', (1, 0), (1, 0), 10)]))
    body = [Spacer(1, 4)]
    body += bullets(features, style=st('mb', fontSize=9.4, leading=13.2, leftIndent=12, bulletIndent=1, spaceAfter=2))
    meta = table([
        ['Ajan(lar)', agents],
        ['Veri ve entegrasyon', data],
        ['MVP kapsamı', mvp],
        ['Başarı ölçütü', kpi],
    ], [1.2, 5.8], head=False, zebra=False)
    return [KeepTogether([head] + body + [Spacer(1, 3), meta]), Spacer(1, 12)]


def part2():
    s = []
    s += chapter('5', 'Modül kataloğu (M1–M12)')
    s.append(P('Pazarlama ürünü on iki modülden oluşur. Her modül tek başına değer üretir ama asıl güç aralarındaki bağdır: marka hafızası her üretimi besler, ölçüm her planı günceller. Modüller dört katmanda toplanır; <b>temel</b> katman olmadan diğerleri güvenilir çalışmaz.', LEAD))
    s.append(ModuleMap())
    s.append(Spacer(1, 6))
    s.append(callout('Okuma kılavuzu', 'Her modül için: amaç, özellikler, sorumlu ajanlar, veri/entegrasyon, <b>MVP kapsamı</b> (ilk sürümde ne var) ve başarı ölçütü verilir. MVP kapsamı yol haritasındaki fazlarla (Bölüm 13) birebir uyumludur.', 'blue'))
    s.append(Spacer(1, 10))

    s += module('M1', 'Marka hafızası (Brand Brain)', 'Sistemin işletmeyi tanıması; her çıktının temeli',
                ['<b>15 dakikalık kurulum:</b> web sitesi, Instagram ve Google İşletme URL\'leri verilir; sistem ürünleri, fiyatları, görselleri, renkleri ve ses tonunu çıkarır. Ardından 12–20 soruluk sohbet röportajı (Ek A).',
                 '<b>Marka Kartı:</b> ses tonu (resmî–samimi ayarı), değerler, hedef kitle personaları, ürün/hizmet kataloğu, SSS, çalışma saatleri, mevsimsellik, yasaklı kelime ve konular, "iyi içerik" örnekleri.',
                 '<b>Üç hafıza türü:</b> (1) doğrulanmış <i>gerçekler</i> (fiyat, adres; değiştirilene dek sabit), (2) <i>tercihler</i> (onay ve ret nedenlerinden öğrenilir), (3) <i>performans öğrenimleri</i> (hangi içerik, saat, mesaj işe yaradı).',
                 '<b>Açıklanabilirlik:</b> "Neden böyle yazdın?" sorusuna hangi gerçeğe ve tercihe dayandığını gösterir; kullanıcı her maddeyi düzenleyebilir, sürüm geçmişi tutulur.',
                 '<b>Görsel kit:</b> logo, renk, yazı tipi, fotoğraf kütüphanesi (kullanıcı yükler; sistem etiketler: ürün, mekân, ekip).'],
                'Marka analisti (Hatice), hafıza yöneticisi (arka plan)',
                'Yapılandırılmış profil (JSON) + doğrulanmış gerçekler tablosu + vektör arama (RAG); web/sosyal tarama; dosya yükleme',
                'Web + Instagram + Google tarama, Marka Kartı, gerçekler tablosu, onay/ret öğrenmesi (ilk sürüm: kural tabanlı)',
                'Kurulum ≤ 15 dk; ilk 10 içerikte "bunu ben yazmışım gibi" oranı ≥ %70 (kullanıcı anketi)', NAVY)
    s += module('M2', 'Pazar ve rakip istihbaratı', 'Ne yapılacağına karar vermeden önce çevreyi bilmek',
                ['<b>Rakip izleme:</b> yerel ve sektörel 3–10 rakibin herkese açık sosyal hesapları, Google yorumları, fiyat ve kampanyaları (yalnızca herkese açık veri, platform koşullarına uygun).',
                 '<b>Reklam kütüphanesi taraması:</b> rakiplerin yayındaki reklamları (Meta Reklam Kütüphanesi gibi herkese açık kaynaklar) → mesaj ve teklif kalıpları.',
                 '<b>Fırsat radarı:</b> anahtar kelime ve arama niyeti, yerel arama sıralaması, sezon ve trend; Türkiye özel gün takvimi (bayramlar, Anneler Günü, 14 Şubat, Efsane Cuma/Kasım indirimleri, okul dönemleri, tatil sezonu).',
                 '<b>Haftalık "fırsat ve tehdit" notu:</b> 5 madde; her biri "ne yapalım" önerisiyle biter.',
                 '<b>Yorum analizi:</b> kendi ve rakip yorumlarından tekrarlayan şikâyet/övgü temaları; içeriğe ve ürüne girdi.'],
                'Araştırma (Esra, Cem) + Strateji (Hatice)',
                'Herkese açık web/sosyal veri, Google Haritalar/Business verisi (yetkiyle), arama verisi sağlayıcıları; sonuçlar marka hafızasına yazılır',
                'Rakip tarama (hesap + yorum), özel gün takvimi, haftalık not',
                'Haftalık notun açılma ve "uyguladım" oranı; önerinin planlanan içeriğe dönüşme oranı', NAVY)
    s += module('M3', 'Strateji ve plan motoru', 'Hedeften 30 günlük uygulanabilir plana',
                ['<b>Hedef seçimi:</b> daha çok telefon/randevu · mağaza trafiği · online sipariş · B2B lead · tekrar satın alma · bilinirlik; sayısal hedef ve bütçe girilir.',
                 '<b>Büyüme planı:</b> kanal karması ve bütçe dağılımı (yüzde), aylık tema, haftalık ritim, kampanya takvimi, KPI hedefleri; her karar için gerekçe.',
                 '<b>Senaryolar:</b> düşük/orta/yüksek bütçe karşılaştırması ("2.000 ₺ ile şu, 8.000 ₺ ile bu beklenir" biçiminde aralıklı tahmin; kesin vaat değil).',
                 '<b>30-60-90 gün haritası</b> ve mevsimsel kampanya önerileri; plan sürümleri ve değişiklik nedeni kaydı.',
                 '<b>Plan → görev dönüşümü:</b> plan onaylanınca Kağan görevleri ajanlara dağıtır (mevcut görev akışı kullanılır).'],
                'Strateji (Hatice), orkestratör (Kağan)',
                'Marka hafızası, M2 çıktıları, geçmiş performans; kural motoru + LLM; bütçe kuralları',
                'Hedef sihirbazı, kanal karması şablonları (sektör bazlı), 30 günlük plan ve takvim',
                'Planın onay oranı; planlanan iş / yapılan iş oranı; hedef KPI\'a yakınsama', VIOLET)
    s += module('M4', 'İçerik fabrikası', 'Her kanal için marka sesiyle, Türkçe, toplu üretim',
                ['<b>Format kataloğu:</b> Instagram gönderi/carousel/reels senaryosu/hikâye, Facebook, LinkedIn, TikTok senaryosu, X; Google İşletme gönderisi; blog ve SEO makalesi; e-posta (hoş geldin, kampanya, terk edilmiş sepet, bülten); SMS; WhatsApp şablonları; reklam metinleri (başlık/açıklama karakter sınırlarına uygun); açılış sayfası metni; ürün açıklamaları (toplu); SSS; basın bülteni.',
                 '<b>Üretim hattı:</b> brief → 3 varyant → Marka Koruyucu denetimi (ton, yasaklılar, iddia doğrulama, yasal) → görsel eşleme → onay kuyruğu. Her aşama kayıtlı.',
                 '<b>Türkçe kalitesi:</b> ekler, hitap (siz/sen), bölgesel ve sektörel dil; resmî–samimi ayarı; yazım denetimi; "yapay zekâ kokusu" taşıyan klişelerin filtrelenmesi.',
                 '<b>Tekrar kullanım:</b> bir fikir → tüm kanallara uyarlama (blog → 5 gönderi → 3 hikâye → e-posta); aynı içeriği kopyalamak yerine kanala göre yeniden yazar.',
                 '<b>Çok dilli:</b> turizm ve ihracat için EN/DE/AR; çeviri değil yerelleştirme.',
                 '<b>Serbest düzenleme:</b> kullanıcı metni değiştirir; düzenleme farkı öğrenme sinyali olarak hafızaya girer.'],
                'İçerik (Emine), Sosyal (Hüseyin), Performans (Merve), Marka Koruyucu',
                'Marka hafızası + takvim; model katmanı (Gemini); görsel motoru (M12)',
                'Instagram gönderi/hikâye, Google İşletme gönderisi, e-posta, WhatsApp şablonu, reklam metni; 3 varyant + denetim',
                'İlk taslağın düzenlemeden onaylanma oranı (hedef ≥ %60), ortalama düzenleme mesafesi azalır', VIOLET)
    s += module('M12', 'Görsel ve video stüdyosu', 'Marka kitine bağlı, tasarımcı gerektirmeyen görsel üretim',
                ['<b>Şablon motoru:</b> marka rengi/yazı tipi ile gönderi, hikâye, kapak, afiş şablonları (kod ile üretilen; piksel hassasiyetli ve düzenlenebilir).',
                 '<b>Ürün fotoğrafı iyileştirme:</b> arka plan kaldırma, ışık/renk düzeltme, tutarlı kadraj. Ürünün kendisi yapay zekâyla <i>değiştirilmez</i>; yalnızca sahne/arka plan.',
                 '<b>Kısa video:</b> fotoğraf+metin+müzik+altyazılı reels/hikâye şablonları (lisanslı müzik kütüphanesi); otomatik altyazı.',
                 '<b>Görsel üretimi (yapay zekâ):</b> soyut/atmosfer görselleri; gerçek mekân, kişi ve ürün temsilinde yanıltma yok; gerektiğinde "yapay zekâ ile üretildi" etiketi.',
                 '<b>Telif güvenliği:</b> yalnızca lisanslı ya da kullanıcıya ait varlıklar; font ve müzik lisans kaydı.'],
                'İçerik (Emine) + tasarım ajanları (Ali, Fatma, Hasan)',
                'Nesne depolama, görsel işleme (sunucu tarafı), görsel üretim modeli, müzik/font kütüphanesi',
                'Şablon motoru (gönderi + hikâye), ürün fotoğrafı arka plan temizleme',
                'Görsel için "tasarımcıya gerek kalmadı" oranı; görsel onay oranı', VIOLET)
    s += module('M5', 'Kanal bağlayıcıları', 'Üretileni doğru yerde, doğru zamanda yayınlamak',
                ['<b>Hedef kanallar:</b> Instagram/Facebook (Meta), Google İşletme Profili, Google Ads, Meta Ads, TikTok, LinkedIn, YouTube, WhatsApp Business, e-posta, SMS; web sitesi/e-ticaret (WordPress, Shopify, ikas, Ticimax, T-Soft; webhook ve izleme kodu).',
                 '<b>İki mod:</b> <i>Tam bağlantı</i> (OAuth ile yayın/okuma) ve <i>Yardımcı mod</i> (içerik hazır, kopyala/indir + hatırlatıcı). Yardımcı mod, onaylar gecikse bile ürünü değerli tutar.',
                 '<b>Güvenilir yayın:</b> kuyruk, yeniden deneme, idempotent işlem, hız sınırı, hata bildirimi; "yayını geri çek" ve "tümünü duraklat" düğmeleri.',
                 '<b>Güvenlik:</b> en az yetki kapsamı, token şifreleme (KMS), bağlantı kesme ve veri silme.',
                 '<b>Başvuru hattı (doğrulayın):</b> Meta uygulama incelemesi ve işletme doğrulaması; Instagram yayını için işletme/yaratıcı hesabı + Facebook Sayfası bağlantısı; Google Ads API için geliştirici belirteci onayı; Google Business Profile API için erişim başvurusu; TikTok içerik yayın API\'si için denetim; WhatsApp için şablon mesaj onayı, 24 saatlik servis penceresi ve açık rıza.'],
                'Yayın otomasyonu (sistem), Sosyal (Hüseyin)',
                'Resmî API\'ler (OAuth), webhook\'lar, kuyruk/zamanlayıcı, gizli anahtar yönetimi',
                'Meta (Instagram + Facebook yayın), Google İşletme, e-posta; diğerleri Yardımcı modda',
                'Yayın başarı oranı ≥ %99; ortalama yayın gecikmesi ≤ 2 dk; bağlantı kopma oranı', ORANGE)
    s += module('M6', 'Yerel SEO ve yorumlar', 'KOBİ için en hızlı geri dönüş',
                ['<b>Google İşletme Profili denetimi ve optimizasyonu:</b> kategori, saatler, hizmet/ürünler, SSS, fotoğraf, haftalık gönderi; eksik puanı ve düzeltme listesi.',
                 '<b>Yorum toplama:</b> QR ve WhatsApp mesaj şablonuyla memnun müşteriden yorum isteme (yönlendirme etik kurallara uygun; yorum <i>yazdırmayız</i>, yalnızca davet ederiz).',
                 '<b>Yorum yanıt asistanı:</b> olumlu yorumlara kişiselleştirilmiş teşekkür taslağı; olumsuz yorumlarda empatik, çözüm odaklı yanıt önerisi ve sahibine <i>zorunlu onay</i>.',
                 '<b>Yerel anahtar kelime ve sıralama takibi:</b> "[semt] + [hizmet]" aramalarında konum; haftalık değişim.',
                 '<b>Tutarlılık:</b> ad-adres-telefonun dizinlerde ve sitede tutarlılığı; yerel açılış sayfaları.',
                 '<b>Pazarlama karnesi:</b> işletmenin yerel görünürlük puanı; satış aracı olarak ücretsiz sunulur (Bölüm 12).'],
                'SEO ve yerel uzmanı (yeni rol), İçerik (Emine)',
                'Google Business Profile API (yetkiyle), arama sıralama verisi, web sitesi tarama',
                'Profil denetimi + düzeltme listesi, haftalık Google gönderisi, yorum yanıt taslağı',
                'Profil görüntüleme, arama/yol tarifi/arama (telefon) tıklaması, yorum puanı ve sayısı artışı', ORANGE)
    s += module('M7', 'Reklam otopilotu', 'Küçük bütçeyle büyük verim, sert güvenlik sınırlarıyla',
                ['<b>Kurulum asistanı:</b> reklam hesabını bağlama ya da sıfırdan kurma (Meta, Google); piksel/etiket ve dönüşüm takibi kontrolü.',
                 '<b>Kampanya şablonları:</b> yerel randevu/arama, e-ticaret katalog, potansiyel müşteri formu, yeniden pazarlama, marka bilinirliği; sektör bazlı hazır yapılar.',
                 '<b>Yaratıcı üretimi ve A/B test:</b> M4 + M12 ile 3–5 yaratıcı; kazananı seçip bütçeyi kaydırma önerisi.',
                 '<b>Kural motoru ve uyarılar:</b> müşteri başı maliyet hedefin 1,5 katını 3 gün aşarsa duraklatma önerisi; anormal harcama artışı anında uyarı.',
                 '<b>Sert korumalar:</b> günlük ve aylık harcama tavanı; tavan aşan öneri sistem tarafından reddedilir; bütçe artışı yalnız sahibi onayıyla.',
                 '<b>Para akışı:</b> reklam bütçesi işletmenin kendi reklam hesabındadır; biz para tutmayız, harcama onayı sahibindedir.'],
                'Performans (Merve), Analist',
                'Meta Marketing API, Google Ads API, dönüşüm olayları; harcama/kayıt tablosu',
                'Meta için taslak kampanya + öneri (otomatik uygulama kademe 2); Google Ads Faz 3',
                'Müşteri başı maliyet düşüşü, ROAS, israf (dönüşümsüz harcama) azalması', ORANGE)
    s += module('M8', 'Müşteri ve WhatsApp asistanı', 'Gelen talebi kaçırmamak, tekrar satış yapmak',
                ['<b>Lead toplama:</b> formlar, WhatsApp, Instagram/Facebook mesajı, "beni arayın" talebi tek kutuda.',
                 '<b>Hızlı yanıt:</b> 5 dakika içinde marka sesiyle karşılama; SSS, fiyat ve çalışma saati bilgisi marka hafızasından; bilmediğinde uydurmaz, insana devreder.',
                 '<b>Nitelendirme ve randevu:</b> birkaç soruyla ihtiyaç ve bütçe; Google Takvim ile randevu oluşturma/hatırlatma.',
                 '<b>Takip (nurturing):</b> yanıt vermeyene 1., 3., 7. gün nazik hatırlatma; satış sonrası memnuniyet ve yorum daveti.',
                 '<b>Basit CRM:</b> kişi, kaynak, etiket, aşama, not, değer; segmentler (yeni, sadık, uyuyan); doğum günü ve tekrar satın alma hatırlatması.',
                 '<b>İzin yönetimi:</b> iletişim izni kaydı, abonelikten çıkma, sessiz saatler; İYS ve KVKK uyumu (Bölüm 11).',
                 '<b>Şeffaflık:</b> asistan kendini "dijital asistan" olarak tanıtır; kullanıcı istediğinde insana aktarılır; insan devralma bildirimi sahibine gider.'],
                'CRM ve WhatsApp uzmanı (yeni rol), Müşteri ajanları',
                'WhatsApp Business Platform, Meta mesaj API\'leri, Google Takvim, e-posta/SMS sağlayıcıları, veritabanı (kişi/konuşma/izin)',
                'WhatsApp karşılama + SSS + randevu talebi; basit CRM; izin kaydı',
                'İlk yanıt süresi ≤ 5 dk; lead → randevu dönüşümü; tekrar satış oranı', GREEN)
    s += module('M9', 'Analitik ve patron raporu', 'Sonucu tek bakışta ve dürüstçe göstermek',
                ['<b>Tek ekran:</b> harcama, lead, randevu, satış, müşteri başı maliyet (CAC/CPL), ROAS, kanal ve içerik bazlı performans.',
                 '<b>Atıf (attribution) yaklaşımı:</b> UTM + kanala özel WhatsApp/telefon kodları + "Bizi nereden duydunuz?" sorusu (kullanıcı beyanı) birleşimi; kesin olmayan rakamlar "tahmin" etiketiyle.',
                 '<b>Haftalık Patron Raporu</b> (WhatsApp mesajı + 1 sayfa PDF): ne yaptık, ne kazandırdı, ne öğrendik, gelecek hafta, senden istediklerimiz.',
                 '<b>Uyarı ve fırsatlar:</b> anomali (trafik düşüşü, harcama sıçraması), kazanan içerik, mevsim yaklaşıyor.',
                 '<b>Deney kaydı:</b> hangi A/B testi, sonuç ne, hafızaya ne yazıldı.',
                 '<b>Satış girişi kolaylığı:</b> işletme kapatılan satışı tek dokunuşla bildirir ("bu müşteri Instagram\'dan geldi") ya da POS/e-ticaret verisi bağlanır.'],
                'Analist (Esra, Cem)',
                'Kanal API verisi, kendi izleme (UTM, kodlar), e-ticaret/POS verisi, manuel satış bildirimi',
                'Tek ekran pano (gerçek veri), haftalık patron raporu, UTM + beyan atfı',
                'Raporun açılma/okunma oranı; sahibinin "sonucu anlıyorum" skoru; tahmin-gerçek sapması', GREEN)
    s += module('M10', 'Onay, güvenlik ve uyum', 'Hız ve güvenin aynı anda mümkün olması',
                ['<b>Onay kutusu:</b> mobil öncelikli, kart başına tek dokunuş (onayla / düzelt / reddet + sebep); WhatsApp\'tan onay bağlantısı; toplu onay.',
                 '<b>Marka Koruyucu ajanı:</b> her çıktıyı denetler: ton uyumu, yasaklı kelime, doğrulanmamış iddia (fiyat, tarih, "en iyi"), yazım, yasal risk işaretleri; riskli olanı kırmızı bayrakla öne çıkarır.',
                 '<b>Yasal kontrol listeleri:</b> karşılaştırmalı/abartılı reklam, indirim ifadeleri, sağlık/finans/gıda gibi kısıtlı sektörler, influencer iş birliğinde reklam etiketi.',
                 '<b>Veri koruma:</b> KVKK aydınlatma ve saklama süreleri, silme talebi, İYS izinleri; müşteri verisi hiçbir koşulda model eğitiminde kullanılmaz.',
                 '<b>Prompt injection koruması:</b> müşteri mesajı ve web sayfası içeriği <i>veridir, talimat değildir</i>; araç çağrıları şemayla sınırlı; kritik eylemler insan onayı ister.',
                 '<b>Denetim kaydı:</b> kim, ne zaman, hangi model/bağlamla, hangi çıktıyı üretti ve kim onayladı; dışa aktarılabilir.',
                 '<b>Roller:</b> sahip, editör, izleyici; kurumsalda çok aşamalı onay (içerik → marka → hukuk).',
                 '<b>Acil durdurma:</b> tek düğmeyle tüm yayın ve reklamları duraklatma.'],
                'Marka Koruyucu (denetçi ajan), sistem',
                'Kural motoru + model denetimi, audit log, rol/yetki, onay kuyruğu',
                'Onay kutusu, Marka Koruyucu v1 (ton/yasaklı/iddia), audit log, acil durdurma',
                'Yayınlanan içerikte olay sayısı (hatalı/riskli) ≈ 0; onay süresi medyanı ≤ 4 saat', NAVY)
    s += module('M11', 'Satış kanalı ve e-ticaret verisi', 'Pazarlamayı gerçek ürün, stok ve satışla bağlamak',
                ['<b>Katalog bağlantısı:</b> Shopify/WooCommerce/ikas/Ticimax/T-Soft ve pazar yerleri (Trendyol, Hepsiburada) üzerinden ürün, stok, fiyat, satış verisi.',
                 '<b>Otomasyonlar:</b> ürün başına metin ve görsel, katalog reklamı, terk edilmiş sepet e-postası/WhatsApp mesajı, stok azalınca "son adet" (doğruysa) içeriği.',
                 '<b>Marj ve stok bilinci:</b> yüksek marjlı ve stokta fazla olan ürünleri öne çıkarma önerisi.',
                 '<b>B2B:</b> CRM bağlantıları (HubSpot, Zoho, Bitrix), LinkedIn kampanya/outbound taslakları, teklif sonrası takip.',
                 '<b>Fiziksel işletme:</b> randevu/POS yazılımı bağlantıları ya da günlük manuel giriş (en basit hâli: günün cirosu).'],
                'Performans (Merve), İçerik (Emine), Operasyon ajanları',
                'Mağaza/pazar yeri API\'leri, webhook\'lar, ürün veri akışı (feed)',
                'Faz 2+: Shopify, WooCommerce, ikas; manuel ciro girişi MVP\'de',
                'Katalog kapsama oranı; ürün başına gelir; terk edilmiş sepet geri kazanımı', GREEN)

    # ── 6. Paketler ───────────────────────────────────────────────────────────────────────────────
    s.append(PageBreak())
    s += chapter('6', 'Segment paketleri ve fiyat mantığı')
    s.append(P('Paketler, Bölüm 1\'deki segmentlere göre kurgulanır. Fiyatlar <b>hipotezdir</b>: ilk 10 pilot işletmeyle test edilmeden kesinleşmemelidir. Ölçüt: işletmenin alternatif maliyeti (ajans aylık bedeli, bir tasarımcı/içerik uzmanı maaşı) ve ürünün yarattığı sonucun değeri.', LEAD))
    s.append(table([
        ['', 'Başlangıç', 'Büyüme', 'Kurumsal'],
        ['Hedef', 'Küçük işletme (1–9 kişi)', 'Küçük–orta (10–99 kişi)', 'Orta–büyük, çok şubeli/markalı'],
        ['Modüller', 'M1, M3, M4, M6, M12 (temel), M10 (temel)', 'Başlangıç + M5 tam, M8, M9 tam, M2', 'Büyüme + M7 tam, M11, özel entegrasyon'],
        ['Kanal sayısı', '2 (Instagram + Google İşletme)', '5–6', 'Sınırsız + özel'],
        ['Aylık içerik', '~30 parça', '~120 parça', 'Özel kota'],
        ['Onay', 'Tek kişi, mobil', 'Sahip + editör', 'Çok aşamalı (içerik → marka → hukuk)'],
        ['Raporlama', 'Haftalık patron raporu', 'Panolar + haftalık/aylık rapor', 'Özel pano, API, veri dışa aktarma'],
        ['Destek', 'Uygulama içi + WhatsApp', 'Öncelikli destek, aylık danışma görüşmesi', 'Hesap yöneticisi, SLA, güvenlik incelemesi'],
        ['Fiyat hipotezi (aylık)', '₺2.500–3.500 (sabit)', '₺7.000–10.000 + reklam yönetimi eklentisi', 'Teklif bazlı; yıllık sözleşme'],
        ['Satış yöntemi', '14 gün deneme, kredi kartı ile kendi başına', 'Demo + 30 günlük pilot', 'Pilot + güvenlik/hukuk süreci'],
    ], [1.2, 2, 2.2, 2.2]))
    s.append(Spacer(1, 8))
    s.append(sec('Fiyat tasarım ilkeleri'))
    s += bullets([
        '<b>Sabit ve öngörülebilir:</b> küçük işletme için "token" ya da kullanım hesabı anlatmayın; paket içi kota koyun, fazlası için paket yükseltin.',
        '<b>Reklam bütçesi ayrı:</b> reklam harcaması işletmenin kendi hesabından çıkar; biz yalnızca yönetim bedeli alırız. Bu, güven ve hukuki netlik sağlar.',
        '<b>Değer ölçümü:</b> deneme sonunda "bu ay getirdiğimiz tahmini lead/randevu" özeti sunulur; abonelik bu sayıyla savunulur.',
        '<b>Performans bileşeni (isteğe bağlı):</b> büyük müşterilerde sabit bedel + teyit edilebilir sonuç primi; atıf güvenilirliği oturmadan erken uygulamayın.',
        '<b>Eklentiler:</b> ek marka/şube, ek dil, ek kanal paketi, premium görsel/video kotası, canlı yönetici saati.',
        '<b>Birim ekonomisi kontrolü:</b> brüt marj hedefi ≥ %70 (Bölüm 14\'teki hesapla); görsel/video kullanımı kota ile sınırlı.',
    ])

    # ── 7. Ajanlar ────────────────────────────────────────────────────────────────────────────────
    s.append(PageBreak())
    s += chapter('7', 'Ajan tasarımı')
    s.append(P('Pazarlama odasında bugün dört isimli çalışan var. Modüller için ekibi sekiz role genişletmek ve Kağan\'ı <b>orkestratör</b> olarak konumlamak önerilir. Mevcut isimleri koruyun (kullanıcı onlara alıştı); yeni roller için yeni çalışanlar ekleyin ya da mevcutlardan birinin rolünü genişletin.', LEAD))
    s.append(table([
        ['Rol', 'Çalışan', 'Sorumluluk', 'Başlıca araçları (function calling)', 'Model sınıfı'],
        ['Orkestratör', 'Kağan (CEO)', 'Hedefi planlara/görevlere böler, öncelik ve çakışma yönetir', 'plan_olustur, gorev_ata, onay_iste, rapor_yaz', 'Üst model (akıl yürütme)'],
        ['Strateji ve marka', 'Hatice', 'Marka Kartı, büyüme planı, takvim', 'marka_oku/yaz, plan_taslak, takvim_yaz', 'Üst model'],
        ['İçerik', 'Emine', 'Metin, blog, e-posta, SSS, reklam metni', 'icerik_uret, varyant_uret, marka_ara (RAG)', 'Hızlı model + üst model denetim'],
        ['Sosyal medya', 'Hüseyin', 'Sosyal gönderi, hikâye, yayın ritmi, etkileşim', 'gonderi_planla, yayinla, yorum_oku', 'Hızlı model'],
        ['Performans ve reklam', 'Merve', 'Reklam kurulumu, optimizasyon, bütçe önerisi', 'reklam_oku/oner, butce_kontrol, deney_baslat', 'Üst model (sayısal akıl yürütme)'],
        ['SEO ve yerel (yeni)', 'Yeni çalışan', 'Google profili, yorum, yerel sıralama', 'profil_oku/yaz, yorum_yanit_taslak, siralama_olc', 'Hızlı model'],
        ['CRM ve WhatsApp (yeni)', 'Yeni çalışan', 'Lead yanıt, takip, segment, randevu', 'mesaj_gonder (şablon), kisi_guncelle, takvim_ayir', 'Hızlı model + sıkı kurallar'],
        ['Analist', 'Esra / Cem (Araştırma ile ortak)', 'Ölçüm, atıf, rapor, rakip ve pazar notları', 'metrik_oku, rapor_uret, anomali_tespit', 'Üst model'],
        ['Marka Koruyucu (yeni)', 'Denetçi (Serkan\'ın pazarlama yüzü)', 'Her çıktıyı denetler: ton, iddia, yasal, yasaklılar', 'denetle (şemalı çıktı), kural_oku', 'Üst model, düşük sıcaklık'],
    ], [1.2, 1.2, 2.2, 2.3, 1.3]))
    s.append(Spacer(1, 8))
    s.append(sec('Orkestrasyon deseni'))
    s += bullets([
        '<b>1.</b> Hedef (sohbet ya da sihirbaz) → Kağan şemalı <i>plan JSON</i> üretir (görevler, sahipler, bağımlılıklar, son tarihler).',
        '<b>2.</b> Görevler iş kuyruğuna düşer; her ajan yalnız kendi araçlarını çağırabilir (en az yetki).',
        '<b>3.</b> Ajan çıktısı serbest metin değil <b>artefakttır</b> (içerik öğesi, kampanya, rapor); alanları şemayla sabittir.',
        '<b>4.</b> Marka Koruyucu artefaktı denetler; sonuç artefaktın üzerine yazılır (geçti / düzeltilmeli / engellendi + nedeni).',
        '<b>5.</b> Onay kuyruğu → yayın → ölçüm; ölçüm sonuçları hafızaya ve sonraki plana girdi olur.',
        '<b>6.</b> Her adım çalıştırma kaydına (run log) yazılır: model, istem sürümü, bağlam, maliyet, süre, kalite puanı.',
    ])
    s.append(callout('Model ve maliyet stratejisi', 'Hızlı/ucuz model ilk taslak ve toplu işler için; üst model strateji, denetim ve sayısal analiz için. Marka bağlamı önbelleğe alınır; üç varyantı tek çağrıda üretin; denetim ayrı ve kısa bir çağrı olsun. Her istem şablonu sürümlenir ve bir <b>değerlendirme setiyle</b> (en az 50 gerçek brief + altın örnekler) regresyon testinden geçer; model değişikliği bu test olmadan yayına çıkmaz.', 'blue'))
    s.append(Spacer(1, 6))
    s.append(sec('Kalite güvencesi'))
    s += bullets([
        '<b>Altın örnekler:</b> her sektör için insanın yazdığı en iyi 20 içerik; üretimde few-shot ve değerlendirmede referans.',
        '<b>Otomatik testler:</b> yasaklı kelime yok, fiyat/tarih gerçekler tablosuyla eşleşiyor, karakter sınırları, hitap tutarlılığı, Türkçe yazım.',
        '<b>İnsan geri bildirimi:</b> onay/ret ve düzenleme farkı en değerli etiket verisidir; haftalık örneklem incelemesi.',
        '<b>Halüsinasyon önlemi:</b> sistem yalnız hafızadaki gerçekleri iddia eder; kaynağı olmayan sayı üretmesi engellenir; belirsizlikte soru sorar.',
    ])
    return s


def part2b():
    s = []
    # ── 8. Teknik mimari ──────────────────────────────────────────────────────────────────────────
    s += chapter('8', 'Teknik mimari')
    s.append(P('Proje zaten Google Cloud üzerinde Gemini kullanacak şekilde kurgulandığı için aynı bulutta ilerlemek hem kredi hem operasyon açısından doğal. Aşağıdaki yığın bir <b>öneridir</b>; ekibin tecrübesine göre değiştirilebilir. Değişmemesi gereken ilkeler: çok kiracılı veri, iş kuyruğu, gizli anahtar yönetimi, audit log.', LEAD))
    s.append(table([
        ['Katman', 'Öneri', 'Neden'],
        ['İstemci', 'Mevcut React + 3B ofis; Pazarlama Merkezi 2B ekranları; PWA (mobil onay)', 'Mevcut yatırımı korur; mobil onay şart'],
        ['API', 'Node.js (mevcut server/ klasörü genişler) · Cloud Run', 'Otomatik ölçekleme, kolay dağıtım'],
        ['Veritabanı', 'PostgreSQL (Cloud SQL), satır düzeyinde kiracı izolasyonu (workspace_id)', 'İlişkisel veri (içerik, kampanya, kişi); güçlü sorgu'],
        ['Hafıza / arama', 'pgvector ile vektör arama (marka hafızası), tam metin arama', 'Ek altyapı gerektirmez; RAG için yeterli'],
        ['Dosyalar', 'Cloud Storage (görsel, video, rapor PDF)', 'Ucuz, imzalı URL ile güvenli erişim'],
        ['Kuyruk ve zamanlayıcı', 'Cloud Tasks + Cloud Scheduler (gerekirse Pub/Sub)', 'Zamanlanmış yayın, yeniden deneme, ölçüm toplama'],
        ['Model', 'Vertex AI (Gemini), embedding modeli', 'Mevcut Cloud kredisi; tek fatura'],
        ['Gizli anahtarlar', 'Secret Manager + KMS ile OAuth token şifreleme', 'Token sızıntısı en büyük risk'],
        ['Kimlik', 'Identity Platform / Firebase Auth; rol tabanlı yetki', 'E-posta, Google girişi, ileride SSO'],
        ['Ödeme', 'Yerel ödeme altyapısı (iyzico, PayTR vb.) + Stripe (yurt dışı)', 'Abonelik, fatura, e-fatura entegrasyonu'],
        ['Gözlemlenebilirlik', 'Cloud Logging/Monitoring, run_log, maliyet panosu', 'İş başına maliyet ve kalite görünür olmalı'],
    ], [1.2, 3, 2.4]))
    s.append(Spacer(1, 6))
    s.append(callout('Veri konumu ve KVKK uyarısı', 'Gemini 3.x modelleri <b>global uç noktada</b> çalışır; global uç noktada verinin işlendiği bölge garanti edilmez. KVKK kapsamında yurt dışına aktarım ve işleme konusunu müşteri sözleşmelerinde ve aydınlatma metinlerinde ele alın; kurumsal müşteriler için bölgesel uç nokta seçeneğini araştırın. Bu konuda hukuki görüş alın.', 'red'))
    s.append(sec('Çekirdek veri modeli'))
    s.append(P('Tüm tablolar <b>workspace_id</b> taşır ve her sorgu bu alanla süzülür. Aşağıdaki liste ilk şema için yeterli bir başlangıçtır:'))
    s.append(table([
        ['Alan', 'Tablolar', 'Açıklama'],
        ['Hesap', 'workspace, user, membership, role, subscription, usage_meter', 'Kiracı, kullanıcı, rol, abonelik, kullanım ölçümü'],
        ['Marka', 'brand, brand_fact, persona, product, brand_asset, forbidden_term, learning', 'Marka kartı, doğrulanmış gerçekler, personalar, ürünler, görseller, yasaklılar, öğrenimler'],
        ['Planlama', 'goal, plan, plan_version, campaign, calendar_slot, task', 'Hedef, plan sürümleri, kampanya, takvim yuvası, görev'],
        ['İçerik', 'content_item, content_variant, creative, review_flag, approval, publish_job', 'İçerik, varyant, görsel, denetim bayrağı, onay, yayın işi'],
        ['Kanal', 'connector_account, channel_profile, webhook_event', 'Bağlı hesap ve token (şifreli), kanal profili, gelen olaylar'],
        ['Reklam', 'ad_account, ad_campaign, ad_set, ad, budget_rule, experiment', 'Reklam yapısı, bütçe kuralı, deney'],
        ['Müşteri', 'contact, conversation, message, consent, segment, lead_source', 'Kişi, konuşma, mesaj, izin kaydı, segment, kaynak'],
        ['Ölçüm', 'metric_daily, attribution_event, report', 'Günlük metrikler, atıf olayı, rapor'],
        ['Güvenlik', 'run_log, audit_log, prompt_version, eval_case, eval_result', 'Çalıştırma kaydı, denetim kaydı, istem sürümü, değerlendirme'],
    ], [0.8, 3.2, 3]))
    s.append(Spacer(1, 6))
    s.append(sec('Yayın akışı (örnek: Instagram gönderisi)'))
    s += bullets([
        '<b>1.</b> Onay verilir → publish_job oluşur (idempotency anahtarıyla) → Cloud Tasks zamanlanmış saate kuyruklar.',
        '<b>2.</b> Saat gelince işçi, token\'ı Secret Manager/KMS\'ten çözer, platform API\'sine medya konteyneri açar, yayınlar.',
        '<b>3.</b> Başarı: kanal gönderi kimliği kaydedilir, ölçüm toplayıcısı 1. saat, 24. saat ve 7. günde metrik çeker.',
        '<b>4.</b> Hata: sınıflandırılır (geçici → üstel bekleme ile tekrar; yetki/içerik reddi → sahibine açıklamalı bildirim, alternatif öner).',
        '<b>5.</b> Her adım audit_log\'a yazılır; kullanıcı "geri çek" derse silme isteği aynı hat üzerinden gider.',
    ])
    s.append(sec('Güvenlik kontrol listesi'))
    s += bullets([
        'OAuth token\'ları şifreli; en az yetki kapsamı; bağlantı kesilince token silinir.',
        'Kiracı izolasyonu: her sorguda workspace_id; otomatik testle çapraz erişim denemeleri.',
        'Müşteri verisi model eğitiminde kullanılmaz; sağlayıcı sözleşmesinde de doğrulanır.',
        'Prompt injection: dış içerik veri olarak işaretlenir; araç çağrıları şema ile sınırlı; para/yayın gibi eylemler insan onayı ister.',
        'Hız sınırı ve maliyet tavanı: kiracı başına günlük/aylık; aşımda yavaşlatma ve bildirim.',
        'Yedekleme, silme süreleri, olay müdahale planı; sızma testi lansman öncesi.',
    ])
    s.append(PageBreak())

    # ── 9. Ürün ve UX ─────────────────────────────────────────────────────────────────────────────
    s += chapter('9', 'Ürün deneyimi ve ekran tasarımı')
    s.append(P('Çekirdek arayüz, işletme sahibinin gün içinde 2 dakikasında işini bitirebileceği sade bir <b>Pazarlama Merkezi</b>. 3B ofis, ürünün kimliği ve güven katmanı olarak durur; ayrıntı için tıklanır. Aşağıdaki taslak ana ekranın düzenini gösterir.', LEAD))
    s.append(Wire(300))
    s.append(Spacer(1, 4))
    s.append(P('<i>Taslak: sol sütun "bugün için 5 iş" ve toplu onay; orta sütun içerik takvimi; sağ sütun son 30 günün sonuçları. Rakamlar örnektir.</i>', SMALL))
    s.append(sec('Ekran envanteri'))
    s.append(table([
        ['Ekran', 'Amaç', 'Önemli davranışlar'],
        ['Bugün', 'En fazla 5 iş: onay bekleyen, hazır, yayında, planlı', 'Toplu onay; her kartta "neden?" ve düzenle; bildirim özeti'],
        ['Onay kutusu', 'Tüm bekleyen çıktılar; riskli olanlar üstte', 'Tek dokunuş; sebep seçerek ret; WhatsApp\'tan onay'],
        ['Takvim', 'Haftalık/aylık içerik ve kampanya görünümü', 'Sürükle-bırak yeniden planlama; özel gün ve rakip hareketleri işaretli'],
        ['Kampanyalar', 'Reklam ve çok adımlı kampanyalar', 'Bütçe tavanı, durum, sonuç; duraklat/devam'],
        ['Kanallar', 'Bağlı hesaplar ve sağlık durumu', 'Bağlan/kes; izin kapsamı; son yayın hatası'],
        ['Müşteriler', 'Gelen kutusu ve basit CRM', 'Lead durumları, etiketler, insana devral, segment'],
        ['Sonuçlar', 'Metrikler, atıf, haftalık rapor arşivi', 'Tarih aralığı; "tahmin" etiketleri; PDF/WhatsApp rapor'],
        ['Marka hafızası', 'Marka Kartı, gerçekler, öğrenimler', 'Düzenle, sürüm geçmişi, "ajan neyi öğrendi?"'],
        ['Ayarlar', 'Güven kademeleri, bütçe tavanları, roller, faturalama', 'Kanal başına kademe; acil durdurma'],
    ], [1.2, 2.6, 3.4]))
    s.append(Spacer(1, 6))
    s.append(sec('Onboarding: ilk değer anı ≤ 15 dakika'))
    s.append(table([
        ['Dk', 'Adım', 'Kullanıcı ne görür'],
        ['0–2', 'URL gir (web / Instagram / Google)', 'Sistem tarıyor; canlı ilerleme ve ofiste ajanların çalıştığı animasyon'],
        ['2–6', 'Marka röportajı (sohbet, 12 kısa soru)', 'Hazır şık seçenekleri; yazmak zorunda değil'],
        ['6–9', 'Pazarlama karnesi', 'Puan, 5 hızlı kazanım, rakip karşılaştırma (merak ve güven)'],
        ['9–13', 'İlk 5 gönderi taslağı', 'Beğenmediğini değiştir; marka sesi yakalandı mı?'],
        ['13–15', 'Takvim + kanal bağlantısı', 'Bağlanırsa otomatik yayın; bağlanmazsa Yardımcı mod'],
    ], [0.6, 2.6, 4]))
    s.append(Spacer(1, 6))
    s.append(callout('Bildirim politikası', 'Sahibi bunaltılmaz: günde en fazla bir özet bildirimi ve yalnızca acil durumlarda anlık bildirim (riskli içerik, bütçe aşımı, olumsuz yorum, kanal bağlantısı koptu). Onay isteği WhatsApp ve uygulama içinde tek yerde toplanır.', 'orange'))
    s.append(sec('3B ofisin rolü'))
    s += bullets([
        '<b>Canlı iş görselleştirmesi:</b> Emine içerik üretirken yazar, Merve reklamı optimize ederken fareyle çalışır, onay beklerken masasında işaretle bekler.',
        '<b>Odaya giriş:</b> Pazarlama odasına yaklaşınca Pazarlama Merkezi paneli açılır; duvar panosu gerçek kampanya durumunu gösterir.',
        '<b>Ekip hissi:</b> "Emine bu gönderiyi hazırladı" gibi kişileştirilmiş çıktı; kullanıcı ajanla sohbetten konuşabilir.',
        '<b>Performans bütçesi:</b> mobil ve düşük donanımda 2B moda düşer; çekirdek iş akışı 3B\'ye bağımlı olmaz.',
    ])
    return s
