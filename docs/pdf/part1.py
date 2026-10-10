# Bölüm 0–4: yönetici özeti, problem ve pazar, vizyon, mevcut durum, operasyon döngüsü
from lib import *


def part1():
    s = []
    # ── Yönetici özeti ────────────────────────────────────────────────────────────────────────────
    s += chapter('0', 'Yönetici özeti')
    s.append(P('Her ölçekten işletmenin ortak sorunu aynı: <b>pazarlama işi çok, uzmanı pahalı, sonucu belirsiz</b>. Küçük işletmede sahibi geceleri gönderi hazırlıyor; orta ölçekte bir ya da iki kişilik ekip her kanala yetişemiyor; büyük işletmede ajanslar, araçlar ve onay zincirleri yüzünden hız kayboluyor. Kodaryum AgentSpace zaten "yapay zekâ çalışanlarından oluşan bir şirket" fikrini taşıyor. Pazarlama modülü bu fikrin <b>en satılabilir yüzü</b> olabilir: işletmenin cebindeki pazarlama departmanı.', LEAD))
    s.append(callout('Önerilen ürün tezi', 'Araç satmayalım, <b>iş sonucu</b> satalım. İşletme sahibi ayda 30 dakikasını harcayarak onay versin; sistem planlasın, üretsin, yayınlasın, ölçsün ve öğrensin. Ürünün vaadi: "Her hafta daha fazla müşteri adayı, daha az uğraş, tam kontrol sizde."', 'orange'))
    s.append(Spacer(1, 6))
    s.append(P('<b>Bu belge ne yapar?</b> Pazarlama modülünün neden, ne ve nasıl yapılacağını uçtan uca anlatır: problem ve müşteri segmentleri, ürün ilkeleri, 12 modülün ayrıntılı tasarımı, ajan mimarisi, teknik altyapı, ekran tasarımı, sektör kampanya kataloğu, uyum ve riskler, pazara çıkış, yol haritası, metrikler ve sizden beklenen kararlar. Bölümler birbirinden bağımsız okunabilir; acele ediyorsanız 0, 2, 5 ve 12. bölümler yeterli.'))
    s.append(sec('Karar için yedi ana öneri'))
    s += bullets([
        '<b>1. Dar başlayıp derin gidin.</b> İlk 90 günde tek hedef kitle: Instagram, Google Haritalar ve WhatsApp ile müşteri bulan 3–50 çalışanlı yerel hizmet ve perakende işletmeleri. Büyük işletmeler ikinci dalga.',
        '<b>2. Onay-önce otopilot.</b> Sistem her şeyi hazırlar, sahibi tek dokunuşla onaylar. Güven arttıkça kanal ve iş türü bazında otonomiyi kademeli açın. Bu, hem güvenin hem de hukuki sorumluluğun anahtarı.',
        '<b>3. Marka hafızası hendektir.</b> Rakipler "içerik üretir"; biz işletmeyi tanıyan, her hafta öğrenen bir hafıza kurarız. Müşteri bir kez anlattığında sistem bir daha sormaz; bırakıp gitmesi zorlaşır.',
        '<b>4. Kanal bağlantıları en zor kısım; erken başlayın.</b> Meta, Google ve WhatsApp erişim onayları haftalar alabilir. Başvuruları Faz 0\'da yapın; bu arada "hazırla, kopyala, hatırlat" moduyla ürünü bağlantısız da değerli kılın.',
        '<b>5. Yerel SEO ve WhatsApp ilk kazanım.</b> KOBİ\'ler için en hızlı geri dönüş: Google İşletme Profili, yorumlar, WhatsApp\'tan hızlı yanıt ve randevu. Reklam otopilotu bunların üstüne gelir.',
        '<b>6. Ücretsiz "pazarlama karnesi" satış makinesi olsun.</b> İki dakikada işletmenin Google, Instagram ve web durumunu puanlayan rapor hem lead toplar hem ürünü gösterir.',
        '<b>7. 3B ofis vitrin, çekirdek 2B olsun.</b> Pazarlama odasındaki ajanlar gerçek işe göre hareket etsin (farklılaşma ve güven), ama günlük iş "Pazarlama Merkezi" ekranında hızlı ve sade yürüsün.',
    ])
    s.append(Spacer(1, 4))
    s.append(callout('Dürüstlük notu', 'Bu belgedeki fiyat, hacim ve süre rakamları <b>hipotezdir</b>; doğrulanmış pazar verisi değildir. Platform kuralları (Meta, Google, WhatsApp) ve mevzuat (KVKK, İYS, reklam yönetmelikleri) sık değişir; ilgili yerlerde "doğrulayın" notu düşülmüştür. Hukuki konularda uygulamaya geçmeden bir hukukçuya danışın.', 'red'))
    s.append(PageBreak())

    # ── 1. Problem ve pazar ───────────────────────────────────────────────────────────────────────
    s += chapter('1', 'Problem ve pazar')
    s.append(P('Pazarlama, işletmelerin "yapmam lazım ama yapamıyorum" listesinin başında gelir. Aşağıdaki tablo, işletmelerin gerçekten yaşadığı sorunları, nasıl göründüklerini ve mevcut çözümlerin neden yetmediğini özetler. Ürünün her özelliği bu satırlardan birine karşılık gelmelidir.', LEAD))
    s.append(table([
        ['Sorun', 'Nasıl görünür', 'Mevcut çözüm', 'Neden yetersiz'],
        ['Zaman yok', 'Sahibi gönderiyi akşam yazar; haftalarca sessizlik', 'Kendisi yapar, arada bırakır', 'Tutarlılık yok; algoritma ve müşteri unutur'],
        ['Uzmanlık yok', 'Hangi kanal, hangi mesaj, ne kadar bütçe bilinmez', 'Tanıdık tavsiyesi, kurslar', 'Çelişkili bilgi; deneme yanılma pahalı'],
        ['Ajans pahalı ve yavaş', 'Aylık yönetim bedeli + reklam bütçesi; geri bildirim günler sürer', 'Ajans ya da freelancer', 'Küçük bütçe ajansa değmez; şeffaflık düşük'],
        ['İçerik üretimi darboğaz', 'Fikir, metin, görsel, video ayrı ayrı gerekir', 'Canva, telefon fotoğrafı', 'Araç var, <i>iş</i> yine sahibinde'],
        ['Ölçüm karanlık', '"Reklama para veriyorum ama ne getirdiğini bilmiyorum"', 'Platform panelleri', 'Dağınık; müşteriye çevrilmez'],
        ['Bütçe israfı', 'Yanlış hedefleme, durdurulmayan zayıf reklam', 'Reklam yöneticisi varsayılanları', 'Optimizasyon bilgisi ve gözetim gerekir'],
        ['Yerel görünürlük zayıf', 'Haritada geride, yorum az, bilgiler eksik', 'Yok ya da tek seferlik', 'Süreklilik ve yorum yönetimi gerekir'],
        ['Müşteriye geç dönüş', 'WhatsApp / DM saatlerce yanıtsız; müşteri rakibe gider', 'Sahibi telefona bakar', 'Mesai dışı ve yoğun saatlerde kaçan müşteri'],
        ['Tekrar satış yok', 'Eski müşteri hatırlanmaz', 'Excel, akılda', 'Segment ve zamanlama yok'],
        ['Marka tutarsızlığı', 'Her gönderi farklı ses ve görünüm', 'Şablonlar', 'Ton ve kurallar yazıya dökülmemiş'],
    ], [1.3, 2.2, 1.6, 2.2]))
    s.append(Spacer(1, 8))
    s.append(sec('Müşteri segmentleri'))
    s.append(P('Üç ölçekte de sorun aynı kökten gelir (kaynak ve süreklilik), ama <b>satın alma davranışı</b> çok farklıdır. Türkiye KOBİ tanımı çalışan sayısı ve yıllık net satış/bilanço eşiğine dayanır; güncel eşikleri mevzuattan doğrulayın.'))
    s.append(table([
        ['', 'Küçük işletme (1–9 kişi)', 'Orta (10–249)', 'Büyük (250+)'],
        ['Pazarlamayı kim yapar', 'Sahibi, bazen yakını ya da stajyer', '1–3 kişilik ekip + ajans/freelancer', 'Departman, marka yöneticileri, ajans havuzu'],
        ['Karar verici', 'Sahibi (tek kişi, hızlı)', 'Sahibi ya da genel müdür + pazarlama sorumlusu', 'Pazarlama direktörü, satın alma, hukuk, BT'],
        ['Ana acı', 'Zaman ve bilgi', 'Ölçek: çok kanal, az insan; ölçüm', 'Hız, tutarlılık, onay zinciri, maliyet, uyum'],
        ['Satın alma süresi', 'Gün–hafta; deneme ile', 'Hafta–ay; demo + pilot', 'Ay–çeyrek; güvenlik/hukuk incelemesi'],
        ['Ne ister', '"Benim yerime yapın, ne yaptığınızı basitçe göstermeniz yeter"', '"Ekibimi güçlendirin, raporu bana verin"', '"Mevcut sistemlerime bağlanın, denetlenebilir olun"'],
        ['Aboneliği bitirme nedeni', 'Sonuç görmedi, ödeme zor geldi, kullanması zahmetli', 'Ajansla karşılaştırdı, entegrasyon eksik', 'Güvenlik/uyum, kurumsal özellik eksikliği'],
        ['Ürün yaklaşımı', 'Hazır paket, tek ekran, WhatsApp onay', 'Çoklu kanal, rapor, ekip rolleri', 'SSO, rol ve onay zinciri, API, özel marka kuralları'],
        ['Fiyat duyarlılığı', 'Yüksek; net, öngörülebilir aylık bedel', 'Orta; değer ve ajans karşılaştırması', 'Düşük; ama satın alma süreci uzun'],
    ], [1.2, 2, 2, 2]))
    s.append(Spacer(1, 8))
    s.append(callout('Strateji sonucu', 'Küçük ve orta ölçek <b>ilk satış</b> hedefi; büyük işletme ise <b>itibar ve gelir derinliği</b> için ikinci dalga. Büyük işletmeyi erken hedeflemek, uzun satın alma süreçleri ve özel entegrasyon talepleriyle ürünü dağıtır. Mimariyi ise baştan kurumsala hazır kurun (çok kiracılı, rol/yetki, audit log), ki sonra yeniden yazmayın.', 'blue'))
    s.append(Spacer(1, 8))
    s.append(sec('Sahibin 10 işi (Jobs to be done)'))
    s.append(P('Ürün kararlarını özelliklerden değil, işletme sahibinin yapmak istediği işlerden çıkarın:'))
    s.append(table([
        ['#', 'İş', 'Başarı nasıl hissettirir', 'Modül'],
        ['1', 'Dükkânın/işimin kolayca bulunmasını istiyorum', 'Haritada ve aramada üst sıralarda, bilgiler doğru', 'M6'],
        ['2', 'Düzenli ve profesyonel görünmek istiyorum', 'Hafta boyu gönderi var, hepsi markama benziyor', 'M1, M4, M12'],
        ['3', 'Boş zamanım yokken müşteri çekmek istiyorum', 'Telefon/WhatsApp talebi ve randevu artıyor', 'M3, M5, M7'],
        ['4', 'Reklam parasının boşa gitmemesini istiyorum', 'Müşteri başı maliyet düşüyor, anlaşılır rapor', 'M7, M9'],
        ['5', 'Gelen her mesaja hızla ve doğru cevap verilsin', 'Kaçan müşteri yok, ben müdahale etmeden randevu geliyor', 'M8'],
        ['6', 'Eski müşteri geri gelsin', 'Hatırlatma ve kampanyalarla tekrar satış', 'M8'],
        ['7', 'Rakiplerin ne yaptığını bileyim', 'Haftalık kısa fırsat notu', 'M2'],
        ['8', 'Hata yapmadan ilerleyeyim', 'Yanlış/riskli içerik yayınlanmıyor', 'M10'],
        ['9', 'Ne yapıldığını ve ne kazandırdığını tek bakışta göreyim', 'Haftalık 1 sayfalık "patron raporu"', 'M9'],
        ['10', 'Kontrol bende kalsın', 'Onaylamadan hiçbir şey yayınlanmıyor, istediğimde durdururum', 'M10'],
    ], [0.4, 3, 3, 1]))
    s.append(Spacer(1, 8))
    s.append(sec('Alternatifler ve neden kazanabiliriz'))
    s.append(table([
        ['Alternatif', 'Güçlü yanı', 'Zayıf yanı', 'Bizim farkımız'],
        ['Ajans / freelancer', 'İnsan yaratıcılığı, ilişki', 'Pahalı, yavaş, küçük bütçeye ilgisiz', 'Yarım gün yerine dakikalar; sabit ve düşük bedel; şeffaf rapor'],
        ['Tasarım ve zamanlama araçları (Canva, Buffer vb. kategorisi)', 'Ucuz, kolay', 'Düşünme ve üretme işi kullanıcıda', 'Planı ve içeriği sistem üretir; kullanıcı yalnız onaylar'],
        ['Platformların kendi araçları (Meta, Google)', 'Doğrudan ve ücretsiz', 'Kanal başına ayrı; strateji yok', 'Tek merkez, çapraz kanal strateji ve ölçüm'],
        ['CRM ve e-posta paketleri (HubSpot, Mailchimp kategorisi)', 'Olgun otomasyon', 'Kurulum karmaşık, içerik sizden', 'Hazır kurulum, içerik dahil, Türkçe ve yerel kanal odaklı'],
        ['Genel amaçlı sohbet yapay zekâsı', 'Esnek', 'Marka hafızası, yayın, ölçüm yok; her seferinde baştan', 'Hafıza + yayın + ölçüm + onay döngüsü'],
        ['Yeni "yapay zekâ pazarlama ajanı" girişimleri', 'Hızlı demo', 'Çoğu İngilizce, yerel kanal (WhatsApp, Türk mevzuatı) zayıf', 'Türkçe kalite, yerel kanallar, uyum, KOBİ fiyatlaması'],
    ], [1.5, 1.5, 2, 2.4]))
    s.append(PageBreak())

    # ── 2. Vizyon ─────────────────────────────────────────────────────────────────────────────────
    s += chapter('2', 'Ürün vizyonu ve ilkeler')
    s.append(callout('Konumlandırma cümlesi (taslak)', '<b>Kodaryum Pazarlama: İşletmenizin cebindeki pazarlama departmanı.</b> Planlar, üretir, yayınlar, ölçer ve her hafta daha iyisini yapar. Siz yalnızca onaylarsınız.', 'blue'))
    s.append(Spacer(1, 8))
    s.append(sec('Altı fark yaratıcı'))
    s.append(cards([
        ('Sonuç odaklı', 'Gönderi sayısı değil müşteri adayı, randevu ve satış üzerinden ölçülür ve raporlanır.'),
        ('Marka hafızası', 'İşletmeyi tanır, ton ve kuralları öğrenir; her onay ve ret onu daha doğru yapar.'),
        ('Onay-önce otopilot', 'Hiçbir şey sahibi bilmeden yayınlanmaz; güven arttıkça otonomi kademeli açılır.'),
        ('Yerel ve Türkçe', 'WhatsApp, Google Haritalar, Instagram; özel günler, hitap ve mevzuat Türkiye için tasarlanır.'),
        ('Ekip hissi', '3B ofis ve isimli ajanlar: kim ne yapıyor görünür; soyut "yapay zekâ" değil, tanıdık bir ekip.'),
        ('Ölçeğe hazır', 'Aynı çekirdek: tek şubeden çok markalı gruba; roller, onay zinciri, API.'),
    ], cols=3, color=ORANGE))
    s.append(Spacer(1, 8))
    s.append(sec('Tasarım ilkeleri'))
    s += bullets([
        '<b>Sıfır boş sayfa:</b> Kullanıcıya hiçbir zaman "ne yazmak istersin?" diye sormayın; hazır öneriyle gelin.',
        '<b>İlk değer 15 dakikada:</b> Kayıttan sonra ilk onay kuyruğu ve ilk Google profil denetimi dakikalar içinde hazır olmalı.',
        '<b>Sahip meşgul:</b> Her etkileşim 30 saniyede biter; mobil ve WhatsApp üzerinden onay mümkün olur.',
        '<b>Şeffaflık:</b> "Neden böyle yazdın / neden bu bütçe?" sorusunun cevabı her çıktının altındadır.',
        '<b>Geri alınabilirlik:</b> Her yayın ve değişiklik kayıtlıdır, mümkünse geri çekilebilir; bütçe sınırları sert tavandır.',
        '<b>Veriye dayalı iddia:</b> Sistem yalnızca marka hafızasındaki gerçekleri iddia eder; fiyat, indirim ve tarih gibi bilgileri uydurmaz.',
        '<b>Az kanal, iyi yapılmış:</b> Her kanalı yarım yapmaktansa en iyi 2–3 kanalı mükemmel çalıştırın.',
        '<b>Dürüst ölçüm:</b> Atfedilemeyen şeyi "tahmin" diye etiketleyin; rakamı şişirmeyin. Güven uzun vadeli varlıktır.',
    ])
    s.append(sec('Yapmayacağımız şeyler'))
    s.append(callout('Kırmızı çizgiler', ['Sahte yorum, sahte takipçi, sahte beğeni üretmek ya da satın almak.', 'İzinsiz toplu SMS, e-posta ve WhatsApp mesajı (spam).', 'Rakip karalama, yanıltıcı indirim/"son 3 ürün" taktikleri, doğrulanamayan üstünlük iddiaları.', 'Gerçek kişi, ürün ya da mekân görselini yapay zekâyla değiştirip yanıltıcı kullanmak.', 'Müşterinin ödeme bilgisini ya da reklam bütçesini bizim hesabımızdan geçirmek (para onların hesabında kalır).'], 'red'))
    s.append(PageBreak())

    # ── 3. Mevcut durum ───────────────────────────────────────────────────────────────────────────
    s += chapter('3', 'Mevcut durum ve boşluk analizi')
    s.append(P('Projedeki Pazarlama bugün bir <b>vitrin ve prototip</b>: 3B odası, dört ajanı, örnek verili bir panosu ve görev akışı var. Gerçek bir işletmenin pazarlamasını yürütmek için gereken üretim, bağlantı, veri ve güven katmanları henüz yok. Aşağıdaki envanter kod incelemesinden çıkarıldı.', LEAD))
    s.append(table([
        ['Yetenek', 'Durum', 'Kodda nerede', 'Not'],
        ['Pazarlama odası (3B), masa başı davranış', 'Var', 'src/hq/HQ.jsx, Agents.jsx, kadro/work.js', 'Ajanlar yazar, fare kullanır, okur; ama gerçek işe bağlı değil'],
        ['4 pazarlama ajanı', 'Var', 'src/data.js (Emine, Hatice, Hüseyin, Merve)', 'İçerik, strateji, sosyal medya, dijital; yalnızca isim ve rol'],
        ['Görevler ve proje akışı', 'Var', 'src/store.js, views/', 'Görev başlığı ve ilerleme simülasyonu; çıktı (artefakt) yok'],
        ['Kağan ile sohbet ve görev planı', 'Kısmi', 'store.js send/approve, ChatWidget.jsx', 'Yerel kurallar + Gemini yolu; pazarlama görevleri içerik üretmez'],
        ['Pazarlama panosu', 'Kısmi', 'src/ui/dept/sections.jsx MarketingSection', 'Huni, harcama, kanal grafikleri <b>örnek veridir</b>'],
        ['Gemini (Vertex AI) sunucu katmanı', 'Kısmi', 'server/ai.js, http.js', 'Sohbet, ajan güncellemesi, brifing; kimlik dosyası bekliyor'],
        ['Takvim ve ajanda', 'Var', 'ui/CalendarModal.jsx, calendar.js', 'Etkinlik takvimi; içerik takvimine dönüştürülebilir'],
        ['Kullanıcı hesabı, çok kiracılı veri', 'Yok', '-', 'İki sabit kurucu; kalıcı veritabanı yok'],
        ['İşletme profili / marka hafızası', 'Yok', '-', 'Bu belgenin M1 modülü'],
        ['İçerik üretimi ve onay kuyruğu', 'Yok', '-', 'M4 + M10'],
        ['Kanal bağlantıları ve zamanlanmış yayın', 'Yok', '-', 'M5'],
        ['Reklam yönetimi, CRM, WhatsApp', 'Yok', '-', 'M7, M8'],
        ['Gerçek ölçüm ve atıf', 'Yok', '-', 'M9'],
        ['Faturalama, kullanım ölçümü, roller', 'Yok', '-', 'Ticari altyapı (Bölüm 8)'],
    ], [2.1, 0.7, 2.4, 3]))
    s.append(Spacer(1, 8))
    s.append(callout('En önemli mimari karar', 'Proje bugün ağırlıkla tarayıcıda çalışan bir istemci (örnek veri + hafif sunucu). Pazarlama modülü için <b>gerçek bir arka uç şarttır</b>: kalıcı veritabanı, iş kuyruğu/zamanlayıcı, kanal bağlayıcıları ve gizli anahtar yönetimi. Bu, projenin demodan ürüne geçiş noktasıdır; Bölüm 8\'de önerilen yığın bu geçişi tarif eder.', 'orange'))
    s.append(sec('Mevcut varlıkları nasıl kullanırız'))
    s += bullets([
        '<b>3B ofis ve ajanlar:</b> Pazarlama odasının "canlı" hâli, gerçek iş durumuna bağlanır (içerik yazarken Emine yazar, reklam optimize ederken Merve fareyle çalışır). Bu, rakiplerde olmayan görsel güven katmanı.',
        '<b>Kağan (CEO ajanı):</b> Orkestratör olur: hedefi alır, plana böler, ajanlara dağıtır (zaten çalışan görev planı ve onay akışı).',
        '<b>Takvim modalı:</b> İçerik ve kampanya takvimi görünümüne evrilir.',
        '<b>Pazarlama panosu:</b> Örnek veri yerine M9\'un gerçek metriklerini gösterir; bileşenler (huni, kanal grafikleri) yeniden kullanılır.',
        '<b>Gemini sunucu katmanı:</b> İçerik üretim, denetim ve analiz görevlerinin ortak model katmanı olur; şemalı JSON çıktı yaklaşımı aynen devam eder.',
    ])
    s.append(PageBreak())

    # ── 4. Operasyon döngüsü ──────────────────────────────────────────────────────────────────────
    s += chapter('4', 'Pazarlama operasyon döngüsü')
    s.append(P('Ürünün omurgası yedi adımlı bir döngüdür. Her adımın bir girdisi, sorumlu ajanı, çıktısı (<i>artefakt</i>) ve insan rolü vardır. Döngü her hafta döner; ölçüm ve öğrenme bir sonraki planı iyileştirir. Bu yapı, "içerik üreten araç" ile "pazarlama departmanı" arasındaki farktır.', LEAD))
    s.append(Loop(250))
    s.append(Spacer(1, 4))
    s.append(table([
        ['Adım', 'Girdi', 'Sorumlu ajan', 'Çıktı (artefakt)', 'İnsan rolü'],
        ['1 Anla', 'Web sitesi, sosyal hesaplar, Google profili, röportaj', 'Marka analisti (Hatice)', 'Marka Kartı + işletme profili + ilk "pazarlama karnesi"', 'Doğrular, düzeltir (bir kez)'],
        ['2 Planla', 'Marka Kartı, hedef, bütçe, mevsim, rakip notu', 'Strateji (Hatice) + Araştırma', '30 günlük büyüme planı, kanal karması, takvim, KPI hedefleri', 'Planı onaylar / değiştirir'],
        ['3 Üret', 'Takvim, marka hafızası, ürün kataloğu', 'İçerik (Emine), Sosyal (Hüseyin), Performans (Merve)', 'Gönderi, hikâye, e-posta, reklam seti, blog, görsel brief', 'Yok (otomatik)'],
        ['4 Onayla', 'Üretilen içerikler + Marka Koruyucu raporu', 'Marka Koruyucu', 'Onay kuyruğu: riskli olanlar işaretli', 'Tek dokunuş onay / düzeltme isteği'],
        ['5 Yayınla', 'Onaylı içerik, kanal bağlantıları', 'Yayın otomasyonu', 'Zamanlanmış/yayınlanmış gönderi, reklam, e-posta', 'Yok; istediğinde durdurur'],
        ['6 Ölç', 'Kanal verileri, UTM/WhatsApp kodları, satış bildirimi', 'Analist', 'Panolar + haftalık patron raporu', 'Okur (1 dakika)'],
        ['7 Öğren', 'Performans + onay/ret sebepleri', 'Hafıza yöneticisi', 'Marka hafızası güncellemesi, bir sonraki plan önerisi', 'Öğrenilenleri gözden geçirir'],
    ], [0.95, 2, 1.7, 2.5, 1.4]))
    s.append(Spacer(1, 8))
    s.append(sec('Güven kademeleri: otonomi bir ayardır, sabit değil'))
    s.append(P('Her kanal ve iş türü için sahibi bir kademe seçer; sistem performansa göre bir üst kademeyi <i>önerir</i>. Örneğin yorum yanıtları genelde hızla kademe 2\'ye çıkar; reklam bütçesi uzun süre kademe 1–2\'de kalır.'))
    s.append(table([
        ['Kademe', 'Ad', 'Ne olur', 'Tipik kullanım'],
        ['0', 'Öner', 'Sistem fikir ve taslak gösterir, hiçbir şeyi hazırlamaz', 'İlk gün, deneme'],
        ['1', 'Hazırla', 'Yayına hazır içerik onay kuyruğuna düşer; sahibi yayınlar', 'İlk hafta, hassas sektörler'],
        ['2', 'Onayla ve yayınla', 'Sahibi onaylar, sistem zamanlar ve yayınlar', 'Standart çalışma biçimi'],
        ['3', 'Sınırlar içinde otonom', 'Kurallı iş türlerinde sistem kendisi yayınlar (ör. olumlu yoruma teşekkür); bütçe/uyarı sınırları sert', 'Güven oluştuktan sonra, düşük riskli işler'],
    ], [0.9, 1.5, 3.4, 2.4]))
    return s
