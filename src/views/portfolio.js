// kodaryum.net portföyündeki projeler (sitenin proje verisinden alınmış anlık görüntü).
// Site güncellenirse bu liste yeniden üretilir; kodaryum.net'e hiçbir şey yazılmaz.
export const PORTFOLIO = [
  {
    "id": "qr-menu",
    "name": "QR Menü",
    "tagline": "Dijital Menü ve Mekân Sayfası",
    "icon": "📱",
    "sector": "Restoran & Gıda",
    "category": "Yazılım",
    "status": "completed",
    "duration": "Hazır ürün",
    "tech": [
      "Next.js",
      "React",
      "Firebase"
    ],
    "description": "Masadaki QR koddan açılan, kategorili, stok durumlu ve mekân bilgili mobil dijital menü.",
    "overview": "Kafe, restoran ve nargile salonları için masadaki QR kodu okutunca telefonda açılan dijital menü. Kategoriler arasında tek dokunuşla geçilir; tükenen ürünler ve stokta olmayan aromalar anında işaretlenir. Adres, harita, telefon, Instagram ve çalışma saatleri aynı sayfadadır. Uygulama indirmeye gerek yoktur.",
    "problem": "Basılı menüler her fiyat değişiminde yeniden bastırılıyor, yıpranıyor ve hijyenik değil. Müşteri tükenen ürünü sipariş edip hayal kırıklığına uğruyor; garson aynı soruları tekrar tekrar cevaplıyordu.",
    "solution": "İşletmenin markasına özel, telefonda hızlı açılan bir dijital menü kurduk: sabit kategori çubuğu, ürün açıklamaları, özel karışımlar ve aroma filtreleri, \"tükendi\" ve \"stokta yok\" işaretleri, mekân ve iletişim bilgileri tek sayfada.",
    "features": [
      "Masadaki QR kod ile telefonda açılan menü",
      "Sabit kategori çubuğu ile tek dokunuşla geçiş",
      "Ürün açıklamaları ve TL fiyatları",
      "\"Tükendi\" ve \"stokta yok\" işaretleri",
      "Nargile aromaları için filtreler (meyveli, naneli, tatlı…)",
      "Mekânın özel karışımları / öne çıkan ürünler",
      "Harita, telefon ve Instagram bağlantıları",
      "Haftalık çalışma saatleri",
      "Mekânın markasına özel tasarım"
    ],
    "results": [
      {
        "value": "0 uygulama",
        "label": "QR okut, menü anında açılsın"
      },
      {
        "value": "Güncel",
        "label": "Fiyat ve stok bilgisi"
      },
      {
        "value": "Tek sayfa",
        "label": "Menü, adres, saatler, iletişim"
      }
    ]
  },
  {
    "id": "konusan-reklam-videosu-studyosu",
    "name": "Konuşan Reklam Videosu Stüdyosu",
    "tagline": "Yapay Zekâ ile Türkçe Tanıtım Videoları",
    "icon": "🎬",
    "sector": "Reklam & Sosyal Medya",
    "category": "Yazılım",
    "status": "completed",
    "duration": "Hazır ürün",
    "tech": [
      "React",
      "TypeScript",
      "Yapay zekâ video modelleri"
    ],
    "description": "Ürünü gerçek bir müşteri anlatıyormuş gibi Türkçe konuşan, sosyal medyaya hazır dikey reklam videoları üreten yapay zekâ stüdyosu.",
    "overview": "Instagram Reels ve TikTok için \"müşteri yorumu\" tarzı samimi reklam videolarını yapay zekâ ile üreten stüdyo. İşletme ürününü, öne çıkan faydasını ve hedef kitlesini yazar; tarzı, konuşan kişiyi ve ses tonunu seçer. Senaryo sihirbazı Türkçe diyaloğu yazar, video telefon ekranında önizlenir. Şablonlar, galeri ve analitik aynı panelde.",
    "problem": "Sosyal medyada en çok izlenen reklamlar bir kişinin ürünü kendi ağzından anlattığı videolar; ancak bunları üretmek için oyuncu, çekim, ses ve kurgu gerekiyor. Küçük markalar için hem pahalı hem yavaş.",
    "solution": "Ürün ve mesajdan başlayıp tarz, karakter ve senaryo adımlarıyla ilerleyen bir üretim stüdyosu kurduk. Yapay zekâ Türkçe senaryo yazıyor ve konuşan kişiyle dikey video üretiyor; hazır şablonlar ve tahmini maliyet gösterimi üretimi kolaylaştırıyor.",
    "features": [
      "Ürün, fayda ve hedef kitleden video üretimi",
      "Tarz seçimi (samimi, eğlenceli, bilgilendirici)",
      "Konuşan kişi ve ses tonu seçimi",
      "Yapay zekâ senaryo sihirbazı (Türkçe diyalog)",
      "Telefon ekranında canlı önizleme",
      "Şablon kaydetme ve video galerisi",
      "Analitik ve tahmini maliyet gösterimi"
    ],
    "results": [
      {
        "value": "Türkçe",
        "label": "Konuşan kişiyle tanıtım videosu"
      },
      {
        "value": "Dikey",
        "label": "Reels, TikTok ve Shorts formatı"
      },
      {
        "value": "Çekimsiz",
        "label": "Oyuncu, stüdyo ve kurgu gerekmez"
      }
    ]
  },
  {
    "id": "yayin-masasi",
    "name": "Yayın Masası",
    "tagline": "Yapay Zekâ ile YouTube İçerik Otomasyonu",
    "icon": "▶️",
    "sector": "Medya & İçerik",
    "category": "Otomasyon",
    "status": "in-progress",
    "duration": "Geliştiriliyor",
    "tech": [
      "n8n",
      "Gemini",
      "Apify",
      "Google Sheets",
      "Telegram",
      "YouTube API"
    ],
    "description": "Rakip araştırmasından YouTube’a yüklemeye kadar video içerik üretimini yapay zekâ ile otomatikleştiren yayın masası.",
    "overview": "Bir kanal için konu, süre ve dil girilir; sistem rakip videoları araştırır, en çok izlenenlerden ilham alarak fikir üretir, haftalık içerik takvimi hazırlar ve her içerik için başlık, açıklama ve video üretim komutunu yazar. Her gün belirlenen saatte o günün videosu üretilir, Telegram’dan onaya gönderilir ve onaylanınca YouTube’a yüklenir. Tüm süreç tek bir yayın masası panelinden izlenir.",
    "problem": "Düzenli YouTube içeriği üretmek; araştırma, fikir bulma, senaryo, çekim, kurgu, başlık ve açıklama yazma, yükleme gibi saatler süren tekrar eden işler demek. Küçük ekipler ve markalar bu tempoyu sürdüremiyor, kanal düzensizleşiyor.",
    "solution": "İki otomasyon akışı kurduk: Birincisi araştırma ve planlamayı (Gemini ile arama terimleri, Apify ile YouTube taraması, en iyi 5 videoya göre fikirler, haftada 2 Shorts + 1 uzun video takvimi) yapıp içerikleri Google Sheets’e yazıyor ve Telegram’dan onaya sunuyor. İkincisi her gün 19:00’da o günün videosunu üretip onay sonrası YouTube’a yüklüyor. Hepsini tek ekranda toplayan bir kontrol paneli geliştirdik.",
    "features": [
      "Rakip araştırması: YouTube’da en çok izlenen videoların taranması",
      "Yapay zekâ ile video fikri, başlık ve açıklama üretimi",
      "Haftalık içerik takvimi (Shorts ve uzun video)",
      "Video üretim komutları (uzun videoda sahne sahne)",
      "Telegram üzerinden içerik ve video onayı",
      "Her gün belirlenen saatte otomatik üretim",
      "Onay sonrası YouTube’a otomatik yükleme",
      "Google Sheets ile içerik takibi",
      "Yayın masası paneli: takvim, onaylar, durum dağılımı, kayıtlar"
    ],
    "results": [
      {
        "value": "Haftada 3",
        "label": "2 Shorts + 1 uzun video planı"
      },
      {
        "value": "Her gün 19:00",
        "label": "Otomatik üretim ve paylaşım turu"
      },
      {
        "value": "Telegram",
        "label": "Tek dokunuşla onay / ret"
      }
    ]
  },
  {
    "id": "sevkiyat-pazari",
    "name": "Sevkiyat Pazarı",
    "tagline": "Nakliye İş Platformu",
    "icon": "🚛",
    "sector": "Lojistik",
    "category": "Yazılım",
    "status": "completed",
    "duration": "16 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Supabase",
      "Gemini AI"
    ],
    "description": "Dağınık nakliye ilanlarını AI ile toplayıp şoförlere tek ekranda sunan yük platformu.",
    "overview": "Facebook ve WhatsApp gruplarına dağılmış binlerce nakliye ilanını yapay zeka ile toplayıp il, ilçe ve iletişim bilgilerini ayrıştırarak şoförlere tek ekranda sunan platform. Web ve mobil uygulamalarıyla uygun yük saniyeler içinde bulunuyor.",
    "problem": "Şoförler ve nakliyeciler onlarca Facebook ve WhatsApp grubunu elle tarayarak yük arıyor, ilanların çoğu düzensiz metin olduğu için güzergâha uygun iş saatler sonra fark ediliyordu.",
    "solution": "İlanları otomatik toplayan bir altyapı kurup Gemini AI ile il, ilçe, araç tipi ve iletişim bilgilerini ayrıştırdık; sonuçları filtrelenebilir tek bir ekranda ve WhatsApp botu üzerinden anlık bildirimle sunduk.",
    "features": [
      "Facebook gruplarından otomatik ilan toplama",
      "Yapay zeka ile il, ilçe ve iletişim ayrıştırma",
      "WhatsApp botu ile anlık yük bildirimi",
      "Araç tipi, çıkış ve varış iline göre filtreleme",
      "Harita üzerinde güzergâh ve mesafe hesabı",
      "Teklif verme ve iş takip sistemi",
      "Android ve iOS mobil uygulama",
      "Güvenli ödeme ve cüzdan altyapısı",
      "Anlık push bildirimleri"
    ],
    "results": [
      {
        "value": "Binlerce ilan",
        "label": "Otomatik toplanıp ayrıştırılıyor"
      },
      {
        "value": "Saniyeler",
        "label": "Uygun yükü bulma süresi"
      },
      {
        "value": "2 platform",
        "label": "Android ve iOS uygulaması"
      }
    ]
  },
  {
    "id": "callsense-ai",
    "name": "CallSense AI",
    "tagline": "Çağrı Analiz Merkezi",
    "icon": "🤖",
    "sector": "Çağrı Merkezi",
    "category": "Yazılım",
    "status": "completed",
    "duration": "12 hafta",
    "tech": [
      "React",
      "TypeScript",
      "OpenAI GPT-4o",
      "Whisper AI",
      "ElevenLabs"
    ],
    "description": "Telefon görüşmelerini analiz edip memnuniyet, satış ihtimali ve performans ölçen AI merkezi.",
    "overview": "Telefon görüşmelerini yapay zeka ile deşifre edip müşteri memnuniyeti, satış ihtimali, konuşma kalitesi ve personel performansını ölçen; her görüşme için otomatik özet çıkarıp CRM kaydı oluşturan çağrı analiz merkezi.",
    "problem": "Çağrı merkezleri günde binlerce görüşme yapıyor ama kalite ekibi bunların ancak küçük bir kısmını elle dinleyebiliyor; memnuniyetsiz müşteri ve kaçan satış fırsatı çoğu zaman iş işten geçtikten sonra fark ediliyordu.",
    "solution": "Whisper AI ile tüm görüşmeleri deşifre edip GPT-4o ile duygu, satış ihtimali ve konuşma kalitesi skorları ürettik; sonuçları temsilci bazlı performans paneline bağlayıp otomatik özet ve CRM kaydı oluşturduk.",
    "features": [
      "Whisper AI ile otomatik konuşma deşifresi",
      "Müşteri memnuniyet puanı ve duygu analizi",
      "Satış ihtimali ve konuşma kalitesi skorlaması",
      "Personel performans karşılaştırması",
      "GPT-4o ile otomatik görüşme özeti ve öneri",
      "Otomatik CRM kaydı oluşturma (Salesforce, HubSpot, Pipedrive)",
      "ElevenLabs TTS ile sesli yanıt üretimi",
      "Canlı çağrı izleme ve anlık uyarılar",
      "Detaylı raporlama ve trend analizi"
    ],
    "results": [
      {
        "value": "%100",
        "label": "Görüşmenin tamamı analiz ediliyor"
      },
      {
        "value": "3 CRM",
        "label": "Salesforce, HubSpot, Pipedrive entegrasyonu"
      },
      {
        "value": "Otomatik",
        "label": "Görüşme özeti ve aksiyon önerisi"
      }
    ]
  },
  {
    "id": "rent-a-car-yonetim-sistemi",
    "name": "Rent A Car Yönetim Sistemi",
    "tagline": "",
    "icon": "🚙",
    "sector": "Araç Kiralama",
    "category": "Yazılım",
    "status": "completed",
    "duration": "8 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL"
    ],
    "description": "Araç kiralama için AI talep tahmini, rezervasyon ve gelir analizi sunan yönetim sistemi.",
    "overview": "Araç kiralama işletmeleri için yapay zeka destekli talep tahmini, rezervasyon ve sözleşme yönetimi ile gelir analizini tek panelde toplayan yönetim sistemi. Araç envanteri ve durum takibi anlık olarak izlenir.",
    "problem": "Kiralama şirketleri rezervasyonları ajanda ve Excel üzerinden yönetiyor, sezon yoğunluğunu öngöremediği için filo ya boş kalıyor ya da talebi karşılayamıyordu.",
    "solution": "Geçmiş kiralama verisinden talep tahmini üreten bir model kurup rezervasyon, sözleşme, araç durumu ve gelir-gider takibini tek panelde birleştirdik.",
    "features": [
      "Yapay zeka destekli talep tahmini",
      "Rezervasyon ve sözleşme yönetimi",
      "Araç envanteri ve durum takibi",
      "Gelir-gider analizi ve raporlama"
    ],
    "results": [
      {
        "value": "Tek panel",
        "label": "Rezervasyon, sözleşme ve filo yönetimi"
      },
      {
        "value": "AI tahmin",
        "label": "Sezonluk talep öngörüsü"
      },
      {
        "value": "Anlık",
        "label": "Araç durumu ve müsaitlik takibi"
      }
    ]
  },
  {
    "id": "globalsense-ai",
    "name": "GlobalSense AI",
    "tagline": "Dünya Pazarı Analizi",
    "icon": "🌍",
    "sector": "İhracat & E-ticaret",
    "category": "Yazılım",
    "status": "completed",
    "duration": "12 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "OpenAI"
    ],
    "description": "Ürününüzü 198 ülkede analiz edip pazar, dil, kâr ve gümrük maliyetini raporlayan AI.",
    "overview": "Bir ürün girdiğinizde yapay zekânın 198 ülkeyi analiz edip hangi pazarda satılacağını, hangi dilin kullanılacağını, ortalama kârı, rakip yoğunluğunu ve gümrük maliyetlerini raporladığı ihracat pazar analiz platformu.",
    "problem": "İhracata açılmak isteyen işletmeler hangi ülkede satış yapacağını tahminle seçiyor; gümrük vergisi, lojistik maliyeti ve rakip yoğunluğu hesaba katılmadığı için kârsız pazarlara girip zaman ve bütçe kaybediyordu.",
    "solution": "Ürün bilgisinden yola çıkıp 198 ülke için pazar potansiyeli, kâr marjı, rekabet seviyesi, gümrük vergisi ve lojistik maliyetini hesaplayan; ülke bazlı önerilen perakende fiyatı ve dil önerisini tek raporda sunan bir analiz motoru geliştirdik.",
    "features": [
      "198 ülke için pazar potansiyeli analizi",
      "Yapay zekâ destekli hedef pazar bulucu",
      "Dil ve lokalizasyon önerileri",
      "Ortalama kâr marjı ve fiyat analizi",
      "Rakip yoğunluğu ve rekabet seviyesi haritası",
      "Gümrük vergisi ve lojistik maliyet tahmini",
      "Ülke bazlı önerilen perakende fiyat hesabı",
      "Trend ve fırsat takibi",
      "AI asistan ile detaylı analiz raporu"
    ],
    "results": [
      {
        "value": "198 ülke",
        "label": "Tek analizde karşılaştırma"
      },
      {
        "value": "Ülke bazlı",
        "label": "Önerilen perakende fiyat hesabı"
      },
      {
        "value": "Gümrük + lojistik",
        "label": "Maliyet dahil net kâr marjı"
      }
    ]
  },
  {
    "id": "adopixel-studio",
    "name": "AdoPixel Studio",
    "tagline": "AI Reklam Videosu Üretimi",
    "icon": "🎬",
    "sector": "Reklam & E-ticaret",
    "category": "Yazılım",
    "status": "completed",
    "duration": "16 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "OpenAI",
      "FFmpeg",
      "iyzico"
    ],
    "description": "Tek ürün fotoğrafından 2 dakikada sinematik reklam videosu üreten AI stüdyosu.",
    "overview": "Kullanıcının yüklediği tek bir ürün fotoğrafından sinematik reklam videosu üreten yapay zeka stüdyosu. Yapay zeka ürünü analiz edip stili, sahneyi, kamera hareketini ve müziği kendisi kurguluyor; sonuç TikTok, Reels, Shorts, Instagram ve YouTube için hazır formatlarda dışa aktarılıyor. Aboneliksiz üretim hakkı (kredi) modeliyle çalışıyor.",
    "problem": "Küçük markalar ve e-ticaret satıcıları reklam videosu için ajansa binlerce lira ödeyip haftalarca bekliyor; kendi çektiklerinde ise ışık, sahne ve kurgu amatör kaldığı için reklam performansı düşük kalıyordu.",
    "solution": "Ürün fotoğrafını analiz edip en uygun görsel dili otomatik seçen, sahne ve kamera hareketini kurgulayan, altyazıyı ekleyip üç en boy oranında çıktı veren uçtan uca bir üretim hattı kurduk; kullanıcının tek yapması gereken fotoğrafı bırakmak.",
    "features": [
      "Tek ürün fotoğrafından otomatik reklam videosu üretimi",
      "Ürünü analiz edip stili kendi seçen AI motoru",
      "6 sinematik stil: lüks, minimal, viral, karanlık sinematik, modern e-ticaret, fütüristik",
      "9:16 dikey, 1:1 kare ve 16:9 yatay format çıktısı",
      "Ürün türü ve hedef kitle bazlı sahne kurgusu",
      "Otomatik altyazı ve müzik eşleştirme",
      "Sürükle-bırak, panodan yapıştırma ve kamera ile yükleme",
      "Üretim galerisi ile geçmiş videolara erişim",
      "Aboneliksiz üretim hakkı (kredi) ve paket yönetimi",
      "3D Secure ödeme altyapısı ve fatura yönetimi"
    ],
    "results": [
      {
        "value": "2 dakika",
        "label": "Fotoğraftan yayına hazır videoya"
      },
      {
        "value": "41.900+",
        "label": "Platformda üretilen reklam videosu"
      },
      {
        "value": "4.9 / 5",
        "label": "1.200+ değerlendirme ortalaması"
      }
    ]
  },
  {
    "id": "urun-ve-stok-yonetimi",
    "name": "Ürün ve Stok Yönetimi",
    "tagline": "",
    "icon": "📦",
    "sector": "Perakende & Depo",
    "category": "Yazılım",
    "status": "completed",
    "duration": "7 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL"
    ],
    "description": "AI tüketim tahminiyle otomatik sipariş önerisi sunan stok ve depo yönetim paneli.",
    "overview": "Yapay zeka tüketim tahmini ile otomatik sipariş önerisi sunan stok takip ve depo yönetim paneli. Giriş-çıkış hareketleri, kritik seviye uyarıları ve e-fatura entegrasyonu tek ekranda toplanır.",
    "problem": "İşletmeler stok seviyesini elle takip ettiği için ya sermaye fazla stokta kilitleniyor ya da hızlı tüketilen ürünler tükenip satış kaybına yol açıyordu.",
    "solution": "Geçmiş tüketim verisinden ürün bazlı talep tahmini üretip kritik seviyeye yaklaşan kalemler için otomatik sipariş önerisi ve uyarı sistemi kurduk.",
    "features": [
      "Yapay zeka destekli stok tahmini",
      "Giriş-çıkış ve stok hareketi takibi",
      "Kritik stok seviyesi uyarıları",
      "Depo yönetimi ve e-fatura entegrasyonu"
    ],
    "results": [
      {
        "value": "Otomatik",
        "label": "Sipariş önerisi ve kritik stok uyarısı"
      },
      {
        "value": "Ürün bazlı",
        "label": "AI tüketim tahmini"
      },
      {
        "value": "E-fatura",
        "label": "Entegre fatura ve depo yönetimi"
      }
    ]
  },
  {
    "id": "arac-servis-yonetim-sistemi",
    "name": "Araç Servis Yönetim Sistemi",
    "tagline": "",
    "icon": "🚗",
    "sector": "Otomotiv Servis",
    "category": "Yazılım",
    "status": "completed",
    "duration": "9 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL"
    ],
    "description": "Servisler için AI bakım tahmini, randevu, stok ve muhasebeyi tek panelde toplayan sistem.",
    "overview": "Araç servisleri için yapay zeka destekli bakım tahmini, randevu planlama, yedek parça stoğu ve muhasebe yönetimini tek panelde toplayan sistem. Müşterilere SMS ile otomatik bilgilendirme yapılır.",
    "problem": "Servisler randevuları defterden yönetiyor, periyodik bakım zamanı gelen müşteriler hatırlatılmadığı için rakibe gidiyor, yedek parça stoğu iş sırasında tükeniyordu.",
    "solution": "Araç kilometresi ve geçmiş bakım verisinden bakım zamanını öngören bir model kurup randevu, parça stoğu, muhasebe ve SMS bildirimlerini tek panelde birleştirdik.",
    "features": [
      "Yapay zeka destekli bakım tahmini",
      "Servis ve randevu yönetimi",
      "Stok ve yedek parça takibi",
      "SMS bildirimleri ve raporlama"
    ],
    "results": [
      {
        "value": "AI tahmin",
        "label": "Periyodik bakım zamanı öngörüsü"
      },
      {
        "value": "Otomatik SMS",
        "label": "Randevu ve bakım hatırlatması"
      },
      {
        "value": "Tek panel",
        "label": "Servis, stok ve muhasebe yönetimi"
      }
    ]
  },
  {
    "id": "aidatim-ai",
    "name": "Aidatım AI",
    "tagline": "Akıllı Site Yönetimi",
    "icon": "🏢",
    "sector": "Site & Apartman Yönetimi",
    "category": "Yazılım",
    "status": "completed",
    "duration": "13 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "OpenAI"
    ],
    "description": "Aidat, arıza, kamera, plaka tanıma ve misafir girişini tek panelde toplayan site yönetimi.",
    "overview": "Apartman ve site yönetimleri için aidat tahsilatı, arıza takibi, kamera izleme, plaka tanıma ve misafir giriş sistemini tek panelde toplayan; yapay zekâ destekli yönetici asistanı sunan platform.",
    "problem": "Site yöneticileri aidat takibini Excel'de, arıza taleplerini WhatsApp grubunda, güvenliği ayrı bir kamera yazılımında yönetiyor; hiçbir veri bir araya gelmediği için gecikmeler ve şikayetler kayboluyordu.",
    "solution": "Aidat, arıza, duyuru, ziyaretçi, kamera ve plaka tanımayı tek panelde birleştirip yapay zekâ asistanına bağladık; yönetici artık \"bekleyen arıza taleplerini göster\" diyerek rapor alabiliyor.",
    "features": [
      "Aidat tahsilat takibi ve gecikme uyarıları",
      "Arıza talebi açma ve durum yönetimi",
      "Canlı kamera izleme ve kayıt arşivi",
      "Plaka tanıma ile otomatik araç geçişi",
      "Misafir giriş sistemi ve ziyaretçi kaydı",
      "Yapay zekâ destekli yönetici asistanı",
      "Duyuru ve sakin bilgilendirme yönetimi",
      "Gelir-gider ve kullanım analizi raporları"
    ],
    "results": [
      {
        "value": "256 daire",
        "label": "12 blokluk site tek panelden yönetiliyor"
      },
      {
        "value": "%92.4",
        "label": "Aidat tahsilat oranı"
      },
      {
        "value": "7/24",
        "label": "AI yönetici asistanı desteği"
      }
    ]
  },
  {
    "id": "booky",
    "name": "Booky",
    "tagline": "Online Randevu Sistemi",
    "icon": "📅",
    "sector": "Güzellik & Sağlık Hizmetleri",
    "category": "Yazılım",
    "status": "completed",
    "duration": "9 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL"
    ],
    "description": "Kuaför, spa, klinik gibi hizmet işletmeleri için online randevu ve takvim sistemi.",
    "overview": "Kuaför, güzellik salonu, spa, klinik ve özel antrenörler gibi hizmet işletmeleri için online randevu sistemi. Müşteriler paylaşılan rezervasyon sayfasından 7/24 randevu alıyor, işletme tarafında uzman bazlı takvim, müşteri kartı, gelir takibi ve bekleme listesi tek panelde yönetiliyor.",
    "problem": "Hizmet işletmeleri randevuyu telefon ve WhatsApp üzerinden alıyor; çakışan saatler, unutulan randevular ve cevapsız aramalar hem gelir hem müşteri kaybına yol açıyor, doluluk oranı hiç ölçülemiyordu.",
    "solution": "Müşterinin uzman ve hizmet seçip uygun saati kendi seçtiği online rezervasyon sayfası kurduk; arka tarafta uzman bazlı günlük takvim, otomatik hatırlatma, tekrarlayan randevu, ödeme durumu ve doluluk analitiğini tek panelde topladık.",
    "features": [
      "Paylaşılabilir online rezervasyon sayfası",
      "Uzman bazlı günlük ve haftalık takvim görünümü",
      "Hizmet, süre ve fiyat tanımlama (çoklu hizmet desteği)",
      "Personel ve uzman yönetimi, mesai planlama",
      "Müşteri kartı, geçmiş randevu ve özel notlar",
      "Tekrarlayan randevu (periyodik müşteri) tanımı",
      "Randevu durumu, ödeme takibi ve tahsilat",
      "İptal, cevapsız randevu ve bekleme listesi yönetimi",
      "Günlük gelir, doluluk oranı ve hedef takibi"
    ],
    "results": [
      {
        "value": "7/24",
        "label": "Online randevu alma imkânı"
      },
      {
        "value": "%70",
        "label": "Takip edilebilir doluluk oranı"
      },
      {
        "value": "Tek link",
        "label": "Paylaşılabilir rezervasyon sayfası"
      }
    ]
  },
  {
    "id": "market-pos",
    "name": "Market POS",
    "tagline": "Satış Terminali",
    "icon": "🛒",
    "sector": "Perakende",
    "category": "Yazılım",
    "status": "completed",
    "duration": "6 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL"
    ],
    "description": "Barkodlu, çoklu ödeme destekli ve AI satış tahminli perakende satış terminali.",
    "overview": "Perakende işletmeleri için yapay zeka satış tahmini, barkod okuma, nakit-kart-parçalı ödeme ve çoklu para birimi desteği sunan satış terminali. Kasa işlemleri ile stok tek sistemde senkron çalışır.",
    "problem": "Küçük marketler satışı basit yazar kasayla yapıyor, stok ve satış verisi birbirinden kopuk kaldığı için hangi ürünün ne zaman tükeneceği bilinmiyordu.",
    "solution": "Barkod okuma ve çoklu ödeme destekli hızlı bir satış terminali geliştirip her satışı stok ve satış tahmini motoruna bağladık.",
    "features": [
      "Yapay zeka destekli satış tahmini",
      "Barkod okuma ve ürün yönetimi",
      "Nakit, kart ve parçalı ödeme",
      "Çoklu para birimi ve kur takibi"
    ],
    "results": [
      {
        "value": "Saniyeler",
        "label": "Barkodla hızlı satış işlemi"
      },
      {
        "value": "Çoklu ödeme",
        "label": "Nakit, kart ve parçalı tahsilat"
      },
      {
        "value": "Çok kurlu",
        "label": "Farklı para birimi ve kur takibi"
      }
    ]
  },
  {
    "id": "hotelsense-ai",
    "name": "HotelSense AI",
    "tagline": "Otel Yönetim Sistemi",
    "icon": "🏨",
    "sector": "Otelcilik & Turizm",
    "category": "Yazılım",
    "status": "completed",
    "duration": "15 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "OpenAI"
    ],
    "description": "Doluluk tahmini, dinamik fiyatlandırma ve personel planlaması yapan otel yönetim sistemi.",
    "overview": "Oteller için yapay zekâ destekli doluluk tahmini, dinamik fiyatlandırma, müşteri segment analizi ve personel planlaması sunan; rezervasyon ile ön büro süreçlerini tek panelde toplayan yönetim sistemi.",
    "problem": "Oteller oda fiyatını sezon başında sabitliyor, doluluk dalgalandığında ne fiyatı ne de personel sayısını zamanında ayarlayabiliyor; hem gelir hem verimlilik kaybediyordu.",
    "solution": "Geçmiş doluluk, etkinlik ve rekabet verisinden 30 günlük doluluk tahmini üretip buna bağlı dinamik fiyat ve personel planı öneren bir motor kurduk; ADR, RevPAR ve GOPPAR anlık izleniyor.",
    "features": [
      "Yapay zekâ destekli doluluk tahmini",
      "Dinamik fiyatlandırma ve gelir optimizasyonu",
      "ADR, RevPAR ve GOPPAR takibi",
      "Müşteri segment analizi ve tekrar ziyaret oranı",
      "Yapay zekâ destekli personel planlama",
      "Rezervasyon, ön büro ve check-in yönetimi",
      "Oda, kat ve bakım durumu takibi",
      "Yiyecek-içecek ve çamaşırhane modülleri",
      "AI asistan ile anlık öneri ve raporlama"
    ],
    "results": [
      {
        "value": "30 gün",
        "label": "İleriye dönük doluluk tahmini"
      },
      {
        "value": "+%13.2",
        "label": "Dinamik fiyatlandırma ile gelir artışı"
      },
      {
        "value": "%92.5",
        "label": "Personel planlama verimlilik skoru"
      }
    ]
  },
  {
    "id": "insaat-muhasebe-otomasyon",
    "name": "İnşaat Muhasebe & Otomasyon",
    "tagline": "",
    "icon": "🏗️",
    "sector": "İnşaat",
    "category": "Yazılım",
    "status": "completed",
    "duration": "10 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL"
    ],
    "description": "AI belge analizi ile şantiye, kasa ve hakediş takibi yapan inşaat muhasebe otomasyonu.",
    "overview": "İnşaat sektörü için yapay zeka belge analizi, şantiye yönetimi ve kasa takibi yapan muhasebe otomasyonu. WhatsApp entegrasyonuyla sahadan gelen fiş ve faturalar doğrudan sisteme işlenir.",
    "problem": "Şantiyeden gelen fişler ve faturalar kağıt ve WhatsApp mesajı olarak birikiyor, muhasebe bunları elle girdiği için proje maliyeti ancak ay sonunda ortaya çıkıyordu.",
    "solution": "WhatsApp'a gönderilen belgeyi yapay zekâ ile okuyup tutar, tedarikçi ve şantiye bilgisini ayrıştıran; kasa ve gelir-gider tablosunu anlık güncelleyen bir otomasyon kurduk.",
    "features": [
      "Yapay zeka destekli belge analizi",
      "Proje ve şantiye yönetimi",
      "Gelir-gider ve kasa takibi",
      "WhatsApp entegrasyonu"
    ],
    "results": [
      {
        "value": "Anlık",
        "label": "Proje bazlı maliyet görünürlüğü"
      },
      {
        "value": "WhatsApp",
        "label": "Sahadan doğrudan belge girişi"
      },
      {
        "value": "AI okuma",
        "label": "Fiş ve faturadan otomatik veri çıkarma"
      }
    ]
  },
  {
    "id": "replio",
    "name": "Replio",
    "tagline": "AI Müşteri Destek Asistanı",
    "icon": "💬",
    "sector": "E-ticaret & Müşteri Destek",
    "category": "Yazılım",
    "status": "completed",
    "duration": "11 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "OpenAI",
      "WhatsApp API"
    ],
    "description": "WhatsApp, Instagram ve web sohbetini tek gelen kutusunda birleştiren AI destek asistanı.",
    "overview": "WhatsApp, Instagram ve web sohbetini tek gelen kutusunda birleştiren; bilgi tabanından beslenen yapay zekânın markanın tonuyla yanıt taslağı hazırladığı, ekibin onayladığı ve sık sorulanları otomasyonla kapattığı müşteri destek asistanı.",
    "problem": "E-ticaret ekipleri kargo, iade ve stok sorularını üç ayrı kanaldan takip ediyor; aynı soruya günde onlarca kez elle yanıt yazdığı için ilk yanıt süresi uzuyor ve müşteri memnuniyeti düşüyordu.",
    "solution": "Tüm kanalları tek gelen kutusunda topladık; bilgi tabanından beslenen AI her mesaja marka tonuyla hazır yanıt üretiyor, ekip tek tıkla gönderiyor, tekrar eden sorular otomasyonla insan gerekmeden kapanıyor.",
    "features": [
      "WhatsApp, Instagram ve web sohbeti tek gelen kutusunda",
      "Bilgi tabanından beslenen AI yanıt önerisi",
      "Marka tonuna uygun otomatik taslak ve tek tıkla gönderim",
      "Sık sorulan sorular için otomasyon akışları",
      "Kargo takibi, iade, stok ve şikayet senaryoları",
      "Önceliğe göre kuyruk ve SLA risk takibi",
      "Ortalama ilk yanıt, çözüm oranı ve CSAT metrikleri",
      "AI ile insansız çözüm oranı raporlaması",
      "Türkçe / İngilizce çift dil desteği"
    ],
    "results": [
      {
        "value": "12 sn",
        "label": "Ortalama ilk yanıt süresi"
      },
      {
        "value": "%68",
        "label": "AI ile insan gerekmeden çözülen konuşma"
      },
      {
        "value": "4.8 / 5",
        "label": "Müşteri memnuniyeti (CSAT)"
      }
    ]
  },
  {
    "id": "sitefly",
    "name": "Sitefly",
    "tagline": "AI Web Sitesi ve SEO Paneli",
    "icon": "🚀",
    "sector": "Dijital Pazarlama & KOBİ",
    "category": "Yazılım",
    "status": "completed",
    "duration": "14 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "OpenAI"
    ],
    "description": "Yerel işletmeler için AI ile kurulan web sitesi ve aylık SEO takip paneli.",
    "overview": "Yerel işletmeler ve KOBİ'ler için yapay zeka ile kurulan, cümleyle düzenlenebilen web sitesi ve buna bağlı aylık SEO takip paneli. İşletme \"menüye mevsimlik içecekler ekle\" yazıyor, yapay zeka ilgili bölümü yeniden yazıyor; aynı panelden organik trafik, anahtar kelime sıralaması ve gelen potansiyel müşteriler izleniyor.",
    "problem": "Yerel işletmeler ya web sitesi yaptıramıyor ya da yaptırdıktan sonra güncelleyemiyor; site kurulduğu gün donup kalıyor, SEO takip edilmediği için aramalarda hiç görünmüyordu.",
    "solution": "Siteyi doğal dille düzenlenebilir hale getirdik: kullanıcı ne istediğini yazıyor, yapay zeka bölümü yeniden kurguluyor. Üzerine anahtar kelime sıralaması, domain otoritesi ve organik trafik takibi ile terim bazlı AI içerik üretimini ekleyip aylık abonelik modeline bağladık.",
    "features": [
      "Yapay zeka ile dakikalar içinde web sitesi kurulumu",
      "Doğal dille bölüm düzenleme (yaz, uygula, yayınla)",
      "Canlı önizleme ve tek tıkla yayına alma",
      "Organik trafik, domain otoritesi ve sıralama takibi",
      "Anahtar kelime pozisyonu ve haftalık değişim grafiği",
      "Arama hacmi, zorluk ve niyet analizi",
      "Terim bazlı AI içerik ve blog üretimi",
      "Siteden gelen potansiyel müşteri (lead) yönetimi",
      "Çok dilli site desteği (TR / EN)",
      "Aylık SEO abonelik ve raporlama altyapısı"
    ],
    "results": [
      {
        "value": "Cümleyle",
        "label": "Kod bilmeden site düzenleme"
      },
      {
        "value": "+%18.2",
        "label": "30 günlük organik trafik artışı"
      },
      {
        "value": "İlk 100",
        "label": "214 anahtar kelimede sıralama takibi"
      }
    ]
  },
  {
    "id": "autocad-ai",
    "name": "AutoCAD AI",
    "tagline": "Statik Proje Analizi",
    "icon": "📐",
    "sector": "Mühendislik",
    "category": "Yazılım",
    "status": "completed",
    "duration": "10 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL"
    ],
    "description": "CAD dosyalarından otomatik metrik çıkarıp maliyet hesaplayan mühendislik analiz paneli.",
    "overview": "CAD dosyalarından otomatik metrik çıkarıp inşaat alanı, beton hacmi ve maliyet hesabı yapan, mühendislere özel yapay zeka analiz paneli. Proje görselleri ve paftalar tek yerde yönetilir.",
    "problem": "Mühendisler her proje için alan, beton hacmi ve maliyet hesabını CAD üzerinden elle çıkarıyor; bu iş günler sürüyor ve manuel ölçümlerde hata payı yüksek oluyordu.",
    "solution": "CAD dosyasını okuyup katman bazında metrikleri otomatik çıkaran, çıkan verilerden birim fiyatla maliyet tahmini üreten bir analiz motoru geliştirdik.",
    "features": [
      "Yapay zeka destekli proje analizi",
      "İnşaat alanı ve beton hacmi hesaplama",
      "Otomatik maliyet tahmini",
      "Proje görselleri ve pafta yönetimi"
    ],
    "results": [
      {
        "value": "Dakikalar",
        "label": "Günler süren metraj hesabı yerine"
      },
      {
        "value": "Otomatik",
        "label": "Alan, hacim ve maliyet çıkarımı"
      },
      {
        "value": "Tek arşiv",
        "label": "Proje görselleri ve pafta yönetimi"
      }
    ]
  },
  {
    "id": "billbook",
    "name": "Billbook",
    "tagline": "e-Fatura ve Ön Muhasebe",
    "icon": "🧾",
    "sector": "Muhasebe & Finans",
    "category": "Yazılım",
    "status": "completed",
    "duration": "12 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL"
    ],
    "description": "KOBİ ve freelancerlar için e-Fatura, e-Arşiv, tahsilat ve KDV takibi yapan ön muhasebe.",
    "overview": "KOBİ'ler ve serbest çalışanlar için fatura kesme, e-Fatura / e-Arşiv gönderimi, tahsilat takibi ve KDV raporlamasını tek panelde toplayan ön muhasebe sistemi. Fatura önizlemesi üzerinden GİB'e e-Fatura oluşturulup müşteriye tek tıkla gönderiliyor.",
    "problem": "Küçük işletmeler ve serbest çalışanlar faturayı Excel'de kesip e-Fatura portalında ayrıca giriyor; hangi faturanın tahsil edildiği ve dönemsel KDV yükünün ne olduğu ancak mali müşavir hesapladığında ortaya çıkıyordu.",
    "solution": "Fatura kesme, e-Fatura/e-Arşiv gönderimi, tahsilat ve gider takibini tek akışta birleştirdik; dönemsel KDV özeti, vade takibi ve müşteri bazlı alacak durumu panelde anlık hesaplanıyor.",
    "features": [
      "e-Fatura ve e-Arşiv düzenleme, GİB entegrasyonu",
      "VKN / TCKN doğrulamalı müşteri kartı yönetimi",
      "Fatura önizleme, kalem bazlı KDV ve genel toplam hesabı",
      "Taslak, gönderildi, ödendi ve vadesi geçti durum akışı",
      "Tahsilat takibi ve vadesi geçen fatura uyarıları",
      "Gider kaydı ve ürün/hizmet kataloğu",
      "Dönemsel KDV özeti (%20, %10, %1) ve indirilecek KDV",
      "Tekrarlayan (abonelik) fatura tanımı",
      "Muhasebe raporları ve dışa aktarma",
      "Türkçe / İngilizce çift dil arayüz"
    ],
    "results": [
      {
        "value": "Tek tıkla",
        "label": "GİB üzerinden e-Fatura oluşturma"
      },
      {
        "value": "Anlık",
        "label": "Dönemsel KDV ve tahsilat özeti"
      },
      {
        "value": "Vade takibi",
        "label": "Gecikmiş faturaların otomatik işaretlenmesi"
      }
    ]
  },
  {
    "id": "kodaryum-crm",
    "name": "Kodaryum CRM",
    "tagline": "",
    "icon": "📊",
    "sector": "Satış & Pazarlama",
    "category": "Yazılım",
    "status": "completed",
    "duration": "12 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL"
    ],
    "description": "AI satış tahmini, anlaşma takibi ve performans analiziyle müşteri ilişkilerini yöneten CRM.",
    "overview": "Yapay zeka satış tahmini, anlaşma takibi ve performans analiziyle müşteri ilişkilerini uçtan uca yöneten CRM. Görev ve proje yönetimi satış hattıyla aynı ekranda ilerler.",
    "problem": "Satış ekipleri fırsatları kişisel notlarda ve tablolarda takip ediyor, hangi anlaşmanın kapanacağı tahmin edilemediği için ay sonu hedefi sürprizle sonuçlanıyordu.",
    "solution": "Anlaşma hattını aşama bazlı modelleyip geçmiş verilerden kapanma olasılığı üreten bir CRM kurduk; görev, proje ve performans raporlarını aynı ekrana bağladık.",
    "features": [
      "Yapay zeka destekli satış tahmini",
      "Anlaşma ve müşteri takibi",
      "Görev ve proje yönetimi",
      "Detaylı analitik ve raporlama"
    ],
    "results": [
      {
        "value": "AI skor",
        "label": "Anlaşma kapanma olasılığı tahmini"
      },
      {
        "value": "Tek ekran",
        "label": "Satış, görev ve proje takibi"
      },
      {
        "value": "Detaylı",
        "label": "Temsilci bazlı performans analitiği"
      }
    ]
  },
  {
    "id": "kodaryum-erp-sistemi",
    "name": "Kodaryum ERP Sistemi",
    "tagline": "",
    "icon": "🏭",
    "sector": "Üretim & Sanayi",
    "category": "Yazılım",
    "status": "completed",
    "duration": "20 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL"
    ],
    "description": "AI talep tahmini, üretim planlama ve sipariş yönetimi sunan kurumsal kaynak planlama sistemi.",
    "overview": "Yapay zeka talep tahmini, üretim planlama, stok, maliyet ve cari hesap takibini birleştiren kurumsal kaynak planlama sistemi. E-ticaret kanallarıyla sipariş entegrasyonu içerir.",
    "problem": "Üretim yapan işletmeler siparişi, stoğu ve maliyeti ayrı programlarda tutuyor; veriler örtüşmediği için üretim planı gerçek talebe göre değil tahminle yapılıyordu.",
    "solution": "Talep tahmininden üretim planına, stok ve maliyetten cari hesaba kadar tüm süreci tek veri modelinde birleştirip e-ticaret siparişlerini doğrudan sisteme akıttık.",
    "features": [
      "Yapay zeka destekli talep tahmini",
      "Üretim yönetimi ve planlama",
      "Stok, maliyet ve cari hesap takibi",
      "E-ticaret entegrasyonu"
    ],
    "results": [
      {
        "value": "Uçtan uca",
        "label": "Sipariş, üretim, stok ve muhasebe"
      },
      {
        "value": "AI tahmin",
        "label": "Talebe göre üretim planlama"
      },
      {
        "value": "Entegre",
        "label": "E-ticaret sipariş akışı"
      }
    ]
  },
  {
    "id": "e-ticaret-fiyat-takip-sistemi",
    "name": "E-ticaret Fiyat Takip Sistemi",
    "tagline": "",
    "icon": "💰",
    "sector": "E-ticaret",
    "category": "Yazılım",
    "status": "completed",
    "duration": "5 hafta",
    "tech": [
      "Python",
      "Scrapy",
      "BeautifulSoup",
      "PostgreSQL"
    ],
    "description": "Rakip fiyatlarını izleyip AI ile fiyat optimizasyonu yapan otomatik takip sistemi.",
    "overview": "Rakip fiyatlarını sürekli izleyip yapay zeka ile fiyat optimizasyonu yapan otomatik takip sistemi. Fiyat değişimleri otomatik uygulanır, kritik hareketler e-posta ile bildirilir.",
    "problem": "E-ticaret satıcıları rakip fiyatlarını elle kontrol ediyor; pazaryerinde gün içinde değişen fiyatlara yetişemedikleri için ya kutuyu kaybediyor ya da gereksiz kâr bırakıyordu.",
    "solution": "Rakip sayfalarını düzenli tarayan bir scraping altyapısı kurup toplanan veriden optimum fiyatı hesaplayan ve fiyatı otomatik güncelleyen bir sistem geliştirdik.",
    "features": [
      "Yapay zeka destekli fiyat optimizasyonu",
      "Rakip fiyat trendi analizi",
      "Otomatik fiyat güncelleme",
      "Stok kontrolü ve e-posta bildirimleri"
    ],
    "results": [
      {
        "value": "Otomatik",
        "label": "Rakibe göre fiyat güncelleme"
      },
      {
        "value": "Sürekli",
        "label": "Rakip fiyat trendi izleme"
      },
      {
        "value": "E-posta",
        "label": "Kritik fiyat ve stok bildirimi"
      }
    ]
  },
  {
    "id": "donerci-necdet",
    "name": "Dönerci Necdet",
    "tagline": "Yönetim Paneli",
    "icon": "🍽️",
    "sector": "Restoran & Gıda",
    "category": "Yazılım",
    "status": "completed",
    "duration": "7 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Node.js",
      "MongoDB"
    ],
    "description": "Restoranlar için AI satış tahmini, sipariş ve envanter takibi sunan yönetim paneli.",
    "overview": "Restoranlar için yapay zeka satış ve menü önerisi, gerçek zamanlı sipariş takibi ile envanter yönetimi sunan panel. Günlük gelir ve satış raporları anlık izlenir.",
    "problem": "Restoran işletmecisi hangi ürünün ne kadar satacağını tahmin edemediği için fazla hazırlık yapıp malzeme israf ediyor, yoğun saatlerde ise siparişleri yetiştiremiyordu.",
    "solution": "Geçmiş satış verisinden gün ve saat bazlı satış tahmini üretip menü önerisi veren; siparişleri gerçek zamanlı takip eden ve stok uyarısı çıkaran bir panel geliştirdik.",
    "features": [
      "Yapay zeka destekli satış ve menü önerisi",
      "Gerçek zamanlı sipariş takibi",
      "Envanter ve stok uyarıları",
      "Gelir ve satış raporları"
    ],
    "results": [
      {
        "value": "Gün/saat bazlı",
        "label": "AI satış tahmini ve menü önerisi"
      },
      {
        "value": "Gerçek zamanlı",
        "label": "Sipariş durumu takibi"
      },
      {
        "value": "Otomatik",
        "label": "Envanter ve stok uyarıları"
      }
    ]
  },
  {
    "id": "kapitool-vignet",
    "name": "Kapitool Vignet",
    "tagline": "Avrupa Vignet Platformu",
    "icon": "🛣️",
    "sector": "Ulaşım & Turizm",
    "category": "Yazılım",
    "status": "completed",
    "duration": "14 hafta",
    "tech": [
      "React",
      "TypeScript",
      "Supabase",
      "PostgreSQL"
    ],
    "description": "Avrupa güzergâhındaki tüm ülkelerin yol vignetini tek seferde satan çok dilli platform.",
    "overview": "Almanya başta olmak üzere Avrupa'dan yola çıkan gurbetçilerin, güzergâhtaki tüm ülkelerin yol vignetini daha yola çıkmadan tek seferde almasını sağlayan çok dilli satış platformu. 16 dil ve çift para birimi desteğiyle sınırda kuyruk beklemeden, ceza riski olmadan güvenli yolculuk sunar.",
    "problem": "Gurbetçi sürücüler her ülkenin vignetini ayrı sitelerden, farklı dillerde ve sınır kapısında kuyrukta bekleyerek almak zorunda kalıyor, eksik vignet yüzünden yüksek cezalarla karşılaşıyordu.",
    "solution": "Güzergâh bazlı tek sepet, plaka ve araç tipi doğrulaması, sunucu taraflı fiyatlama ve 3D Secure ödeme altyapısıyla tüm vignetlerin yola çıkmadan dakikalar içinde alınabildiği tek bir platform kurduk.",
    "features": [
      "9 Avrupa ülkesi için online vignet satışı",
      "16 dil desteği (Almanca, Türkçe, İngilizce ve daha fazlası)",
      "Plaka ülkesi ve araç tipi doğrulama",
      "TRY / EUR çift para birimi desteği",
      "3D Secure ile güvenli ödeme altyapısı",
      "Sunucu taraflı fiyatlama ile manipülasyon koruması",
      "Sipariş, müşteri ve ülke yönetim paneli",
      "Yasal belge ve fatura yönetimi",
      "Anlık satış istatistikleri ve raporlama"
    ],
    "results": [
      {
        "value": "9 ülke",
        "label": "Tek sepette vignet satışı"
      },
      {
        "value": "16 dil",
        "label": "Çok dilli satış deneyimi"
      },
      {
        "value": "2 para birimi",
        "label": "TRY ve EUR ile ödeme"
      }
    ]
  }
]
