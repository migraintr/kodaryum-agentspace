// Şirket kurulum formu: veri odaklı soru kataloğu. Her soru: id (profil yolu), type, label, help, options (şıklar), presets (hazır öneriler),
// rec(profile) → önerilen cevap ("Önerilen" rozeti ve "Önerileri uygula"). Cevapların hiçbiri zorunlu değildir; boş bırakılan soru için
// mevcut (varsayılan) davranış korunur. Kurulum sonradan serbestçe değiştirilebilir.
import { getAnswer as ga } from '../../company/rules.js'

const O = (v, l, h) => ({ v, l, h })
const Q = (id, type, label, extra = {}) => ({ id, type, label, ...extra })
const risk = (p) => Number(ga(p, 'goals.risk')) || 3
const size = (p) => ({ solo: 1, kucuk: 4, orta: 15, buyuk: 60 })[ga(p, 'identity.size')] ?? 4

// ── 1. Kimlik ─────────────────────────────────────────────────────────────────────────────────────────
const SECTORS = ['Yazılım / SaaS', 'E-ticaret / Pazaryeri', 'Finans / Fintek', 'Sağlık', 'Eğitim', 'Medya / İçerik', 'Danışmanlık / Ajans', 'Üretim / Sanayi', 'Turizm / Hizmet', 'Gayrimenkul', 'Yapay zekâ / Veri', 'Diğer']

const kimlik = [
  Q('identity.name', 'line', 'Şirketinizin adı nedir?', { placeholder: 'ör. Kodaryum AI Şirketi', help: 'Kağan ve ajanlar sizi bu adla tanır.' }),
  Q('identity.tagline', 'line', 'Şirketi tek cümleyle anlatın', { placeholder: 'ör. KOBİ’ler için yapay zekâ destekli pazaryeri', help: 'Slogan değil; ne yaptığınız.' }),
  Q('identity.sector', 'single', 'Hangi sektördesiniz?', { options: SECTORS.map((s) => O(s, s)), help: 'Departman önerileri ve uyum maddeleri sektöre göre değişir.' }),
  Q('identity.stage', 'single', 'Şirket hangi aşamada?', { options: [O('fikir', 'Fikir / doğrulama', 'Henüz müşteri yok'), O('prototip', 'Prototip / MVP', 'İlk sürüm hazırlanıyor'), O('buyume', 'Büyüme', 'Müşteri var, ölçekleniyoruz'), O('olgun', 'Olgun', 'Oturmuş süreçler, istikrar')], rec: () => 'prototip' }),
  Q('identity.size', 'single', 'Şirkette kaç insan çalışıyor (yapay zekâ ajanlar hariç)?', { options: [O('solo', 'Tek kişi'), O('kucuk', '2–9 kişi'), O('orta', '10–49 kişi'), O('buyuk', '50+ kişi')], rec: () => 'kucuk' }),
  Q('identity.city', 'line', 'Merkez şehir', { placeholder: 'ör. İstanbul' }),
  Q('identity.model', 'multi', 'Nasıl para kazanıyorsunuz? (iş modeli)', { options: ['Abonelik (SaaS)', 'Komisyon', 'Ürün satışı', 'Hizmet / proje', 'Lisans', 'Reklam', 'Danışmanlık', 'Henüz gelir yok'].map((x) => O(x, x)), custom: true }),
  Q('identity.customers', 'multi', 'Ana müşterileriniz kimler?', { options: ['Bireyler', 'KOBİ’ler', 'Kurumsal şirketler', 'Kamu', 'Geliştiriciler', 'Satıcılar / esnaf', 'Yatırımcılar'].map((x) => O(x, x)), custom: true }),
  Q('identity.mission', 'text', 'Misyonunuz: neden varsınız?', { placeholder: 'Bir veya iki cümle', help: 'Kağan kararlarını bu amaca göre tartar.' }),
  Q('identity.vision', 'text', 'Vizyonunuz: 3 yıl sonra nerede olmak istersiniz?', { placeholder: 'ör. Türkiye’nin her KOBİ’sinin yapay zekâ ekibi olmak' }),
  Q('identity.values', 'multi', 'Şirketin değerleri', { options: ['Müşteri odaklılık', 'Hız', 'Kalite', 'Şeffaflık', 'Yenilikçilik', 'Güven', 'Sadelik', 'Sürdürülebilirlik', 'Öğrenme', 'Sahiplenme'].map((x) => O(x, x)), custom: true, rec: () => ['Müşteri odaklılık', 'Şeffaflık', 'Hız'], help: 'En fazla 5 seçin; ajanların önceliklendirmesinde yol gösterir.' }),
  Q('identity.language', 'single', 'Ana çalışma/iletişim dili', { options: [O('tr', 'Türkçe'), O('en', 'İngilizce'), O('both', 'Türkçe + İngilizce')], rec: () => 'tr' }),
]

// ── 2. Hedefler ────────────────────────────────────────────────────────────────────────────────────────
const hedef = [
  Q('goals.horizon', 'single', 'Planlama ufkunuz nedir?', { options: [O('ceyrek', 'Bu çeyrek (3 ay)'), O('yil', 'Bu yıl'), O('uc', '3 yıl')], rec: () => 'ceyrek' }),
  Q('goals.northStar', 'single', 'Şu an en önemli tek hedef (kuzey yıldızı)', { options: [O('gelir', 'Gelir büyütmek'), O('musteri', 'Müşteri / kullanıcı sayısı'), O('urun', 'Ürünü çıkarmak / olgunlaştırmak'), O('yatirim', 'Yatırım almak'), O('karlilik', 'Kârlılık / nakit'), O('marka', 'Marka bilinirliği')], rec: (p) => (ga(p, 'identity.stage') === 'fikir' || ga(p, 'identity.stage') === 'prototip' ? 'urun' : 'gelir') }),
  Q('goals.growth', 'single', 'Büyüme temposu', { options: [O('hizli', 'Hızlı büyüme', 'Risk alırım, hız önemli'), O('dengeli', 'Dengeli', 'Büyüme ve kontrol bir arada'), O('istikrar', 'İstikrarlı', 'Yavaş ve sağlam')], rec: () => 'dengeli' }),
  Q('goals.priorities', 'multi', 'Önümüzdeki dönem hangi departmanlar öncelikli? (en çok 3)', { options: [O('yazilim', 'Yazılım'), O('tasarim', 'Tasarım'), O('pazarlama', 'Pazarlama'), O('arastirma', 'Araştırma'), O('muhasebe', 'Muhasebe'), O('operasyon', 'Operasyon')], max: 3, rec: (p) => (ga(p, 'goals.northStar') === 'urun' ? ['yazilim', 'tasarim'] : ga(p, 'goals.northStar') === 'gelir' ? ['pazarlama', 'yazilim'] : ga(p, 'goals.northStar') === 'karlilik' ? ['muhasebe', 'operasyon'] : ['pazarlama', 'arastirma']), help: 'Seçilen departmanların iş hızı ağırlığı otomatik yükseltilir (departman bölümünden değiştirebilirsiniz).' }),
  Q('goals.okrs', 'list', 'Bu dönemin 3 ana hedefi (OKR)', { placeholder: 'ör. 1.000 satıcı ile canlıya çıkmak', max: 5, help: 'Kağan görevleri bu hedeflere bağlar.' }),
  Q('goals.budget', 'single', 'Aylık yapay zekâ / araç bütçesi', { options: [O('dusuk', '₺10.000’e kadar'), O('orta', '₺10.000–50.000'), O('yuksek', '₺50.000–250.000'), O('cok', '₺250.000+')], rec: (p) => (size(p) <= 4 ? 'dusuk' : 'orta') }),
  Q('goals.risk', 'scale', 'Risk iştahınız', { min: 1, max: 5, labels: ['Çok temkinli', 'Temkinli', 'Dengeli', 'Cesur', 'Çok cesur'], rec: () => 3, help: 'Ajanların ne kadar özerk davranacağını doğrudan etkiler: temkinli → her işi sorar, cesur → hızlı ilerler.' }),
  Q('goals.competition', 'single', 'Rekabetle ilişkiniz', { options: [O('izle', 'Yakından izlerim, tepki veririm'), O('fark', 'Kendi yolumda ilerlerim'), O('agresif', 'Pazar payı için agresifim')], rec: () => 'izle' }),
  Q('goals.constraints', 'multi', 'Mevcut kısıtlarınız', { options: ['Sınırlı bütçe', 'Zaman baskısı', 'Küçük ekip', 'Yasal/uyum yükü', 'Teknik borç', 'Müşteri bağımlılığı', 'Yatırımcı beklentisi'].map((x) => O(x, x)), custom: true }),
]

// ── 3. Ofis çalışma prensipleri ──────────────────────────────────────────────────────────────────────────
const ofis = [
  Q('ops.days', 'multi', 'Hangi günler çalışılır?', { options: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((x) => O(x, x)), rec: () => ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'] }),
  Q('ops.hours', 'hours', 'Mesai saatleri', { start: 'ops.hoursStart', end: 'ops.hoursEnd', help: 'Kağan raporlama ve toplantı zamanlarını buna göre planlar.' }),
  Q('ops.pauseOutside', 'toggle', 'Mesai dışında ofis dursun mu?', { yes: 'Evet, ajanlar mesai dışında beklesin', no: 'Hayır, 7/24 çalışsınlar', rec: () => false, help: 'Açıksa canlı simülasyon mesai dışında ilerlemez.' }),
  Q('ops.tempo', 'single', 'Ofisin çalışma temposu', { options: [O('sakin', 'Sakin', 'Önce düşün, sonra yap (görevler daha yavaş, daha dikkatli)'), O('dengeli', 'Dengeli'), O('hizli', 'Hızlı', 'Hız önce, iyileştirme sonra')], rec: (p) => (ga(p, 'goals.growth') === 'hizli' ? 'hizli' : ga(p, 'goals.growth') === 'istikrar' ? 'sakin' : 'dengeli') }),
  Q('ops.decision', 'single', 'Kararları kim verir?', { options: [O('kurucu', 'Kurucular', 'Kağan öneri sunar, karar sizin'), O('ceo', 'Kağan (CEO)', 'Sıradan kararları Kağan verir, önemlileri sorar'), O('ortak', 'Ortak karar', 'Kağan + ilgili departman lideri')], rec: (p) => (size(p) <= 4 ? 'kurucu' : 'ceo') }),
  Q('ops.approval', 'single', 'Görev planları onay gerektirir mi?', { options: [O('her', 'Her plan onayımla başlasın', 'En kontrollü'), O('riskli', 'Yalnızca riskli işler onay istesin', 'Düşük riskli işler (araştırma, taslak) kendiliğinden başlar'), O('hic', 'Onay gerekmesin, hemen başlasınlar', 'En hızlı; sonradan raporla')], rec: (p) => (risk(p) <= 2 ? 'her' : risk(p) >= 5 ? 'hic' : 'riskli'), help: 'Departmanların kendi otonomi seviyesi ile birlikte çalışır: “Öner” seviyesindeki bir departman her durumda onay bekler.' }),
  Q('ops.priority', 'single', 'Yeni işlerin varsayılan önceliği', { options: [O('normal', 'Normal'), O('yuksek', 'Yüksek'), O('kritik', 'Kritik')], rec: () => 'normal' }),
  Q('ops.escalation', 'multi', 'Hangi durumlarda size haber verilsin / sorulsun?', { options: ['Bütçe aşımı', 'Teslim tarihi kayması', 'Güvenlik/veri olayı', 'Müşteri şikâyeti', 'Departmanlar arası çakışma', 'Yasal/uyum riski', 'Beklenmeyen maliyet', 'Kalite sorunu'].map((x) => O(x, x)), custom: true, rec: () => ['Bütçe aşımı', 'Teslim tarihi kayması', 'Güvenlik/veri olayı', 'Yasal/uyum riski'] }),
  Q('ops.meetings', 'single', 'Ekip toplantı ritmi', { options: [O('gunluk', 'Günlük kısa durum'), O('haftalik', 'Haftalık planlama'), O('iki', 'Günlük + haftalık'), O('yok', 'Toplantı yok, yazılı rapor')], rec: (p) => (ga(p, 'ops.tempo') === 'hizli' ? 'gunluk' : 'haftalik') }),
  Q('ops.reportFreq', 'single', 'Kağan size ne sıklıkla rapor versin?', { options: [O('anlik', 'Önemli olaylarda anlık'), O('gunluk', 'Günlük özet'), O('haftalik', 'Haftalık özet'), O('aylik', 'Aylık değerlendirme')], rec: (p) => (ga(p, 'ops.tempo') === 'hizli' ? 'gunluk' : 'haftalik') }),
  Q('ops.reportFormat', 'single', 'Rapor biçimi', { options: [O('kisa', 'Kısa madde madde'), O('ozet', 'Özet + rakamlar'), O('detay', 'Ayrıntılı (neden-sonuç)')], rec: () => 'ozet' }),
  Q('ops.tone', 'single', 'Ofis içi iletişim dili', { options: [O('samimi', 'Samimi'), O('profesyonel', 'Profesyonel ve net'), O('resmi', 'Resmî')], rec: () => 'profesyonel' }),
  Q('ops.qualityGate', 'multi', 'Bir iş “bitti” sayılmadan önce ne olmalı?', { options: ['İkinci göz incelemesi', 'Otomatik test/kontrol', 'Müşteri bakış açısıyla kontrol', 'Dokümantasyon', 'Kurucu onayı', 'Marka/ton kontrolü'].map((x) => O(x, x)), custom: true, rec: () => ['İkinci göz incelemesi', 'Otomatik test/kontrol'] }),
  Q('ops.conflict', 'single', 'İki departman çakışırsa kim karar verir?', { options: [O('ceo', 'Kağan'), O('kurucu', 'Kurucular'), O('oncelik', 'Öncelik ağırlığı yüksek olan departman'), O('gorusme', 'İlgili liderler görüşüp karar verir, Kağan onaylar')], rec: () => 'ceo' }),
  Q('ops.handoff', 'single', 'Departmanlar arası iş devri nasıl olsun?', { options: [O('yazili', 'Yazılı devir notu zorunlu'), O('sohbet', 'Sohbetten haber yeter'), O('kagan', 'Her devir Kağan üzerinden')], rec: () => 'yazili' }),
  Q('ops.docs', 'multi', 'Hangi çıktılar dokümante edilsin?', { options: ['Kararlar', 'Toplantı notları', 'Süreçler', 'Teknik mimari', 'Müşteri geri bildirimleri', 'Hatalar ve çözümleri'].map((x) => O(x, x)), rec: () => ['Kararlar', 'Süreçler'] }),
  Q('ops.feedback', 'single', 'Hata ve başarısızlıklara yaklaşım', { options: [O('ogren', 'Suçlamadan öğren (olay sonrası inceleme)'), O('sorumluluk', 'Sorumlu net belirlenir'), O('hizli', 'Hızlı düzelt, konuşma')], rec: () => 'ogren' }),
]

// ── 4. CEO ──────────────────────────────────────────────────────────────────────────────────────────────
const ceo = [
  Q('ceo.persona', 'multi', 'CEO Kağan nasıl bir yönetici olsun?', { options: ['Net ve kararlı', 'Danışan / dinleyen', 'Veriye dayalı', 'İlham veren', 'Temkinli', 'Atak', 'Sabırlı', 'Detaycı'].map((x) => O(x, x)), max: 4, rec: () => ['Net ve kararlı', 'Veriye dayalı'] }),
  Q('ceo.authority', 'single', 'Kağan’ın yetkisi', { options: [O('oner', 'Yalnızca öneri sunsun', 'Her şeyi siz yaparsınız'), O('planla', 'Planlasın, siz onaylayın', 'Görevleri böler, onayınızı bekler'), O('baslat', 'Planlasın ve düşük riskli işleri başlatsın'), O('yurut', 'Tam yetki: planla, dağıt, yürüt, sonra raporla')], rec: (p) => ({ her: 'planla', riskli: 'baslat', hic: 'yurut' })[ga(p, 'ops.approval')] ?? 'planla', help: 'Ofis çalışma prensiplerindeki onay biçimiyle uyumlu olmalıdır; önerilen buna göre hesaplanır.' }),
  Q('ceo.briefing', 'single', 'Kağan kendiliğinden ne sıklıkla proje güncellemesi yazsın?', { options: [O('sik', 'Sık (yaklaşık 25 sn’de bir)'), O('normal', 'Normal (yaklaşık 45 sn)'), O('seyrek', 'Seyrek (yaklaşık 105 sn)'), O('kapali', 'Yalnızca ben sorduğumda')], rec: (p) => ({ hizli: 'sik', sakin: 'seyrek' })[ga(p, 'ops.tempo')] ?? 'normal' }),
  Q('ceo.style', 'single', 'Yanıt üslubu', { options: [O('kisa', 'Kısa ve öz'), O('dengeli', 'Dengeli'), O('ayrintili', 'Ayrıntılı ve gerekçeli')], rec: (p) => (size(p) <= 4 ? 'kisa' : 'dengeli') }),
  Q('ceo.proactive', 'scale', 'Proaktiflik: sormadan öneri getirsin mi?', { min: 1, max: 5, labels: ['Hiç', 'Az', 'Orta', 'Çok', 'Her zaman'], rec: () => 3 }),
  Q('ceo.delegate', 'single', 'Görevleri nasıl dağıtsın?', { options: [O('yuk', 'En az yüklü uygun ajana'), O('uzman', 'Uzmanlığı en yakın ajana'), O('rotasyon', 'Sırayla (adil dağıtım)'), O('lider', 'Önce departman liderine')], rec: () => 'yuk' }),
  Q('ceo.ask', 'multi', 'Hangi konularda önce size sorsun?', { options: ['Para harcamak', 'Müşteriyle iletişim', 'Fiyat değişikliği', 'Yeni işe alım / yeni ajan', 'Dış paylaşım (sosyal medya, basın)', 'Hukuki metinler', 'Mimari değişiklik', 'Veri paylaşımı'].map((x) => O(x, x)), custom: true, rec: () => ['Para harcamak', 'Müşteriyle iletişim', 'Fiyat değişikliği', 'Hukuki metinler'] }),
  Q('ceo.collab', 'single', 'Çapraz ekip çalışması', { options: [O('otomatik', 'Kağan gerekirse otomatik destek ajan atasın'), O('onayli', 'Destek ataması onayımla'), O('kapali', 'Her departman kendi işini yapsın')], rec: () => 'otomatik' }),
  Q('ceo.redlines', 'list', 'Kağan’ın asla yapmaması gerekenler', { placeholder: 'ör. Onaysız fiyat değiştirme', presets: ['Onaysız fiyat değiştirme', 'Müşteriye taahhüt verme', 'Bütçeyi aşma', 'Kişisel veriyi dışarı gönderme', 'Rakip hakkında olumsuz paylaşım'], max: 8 }),
  Q('ceo.conflict', 'single', 'Kurucular arasında görüş ayrılığı olursa', { options: [O('ikisi', 'İki görüşü de özetleyip karar bekle'), O('asil', 'Asıl kurucunun kararını uygula'), O('veri', 'Veriye göre öneri getir')], rec: () => 'ikisi' }),
  Q('ceo.notes', 'text', 'Kağan’a eklemek istediğiniz özel talimat', { placeholder: 'ör. Her cuma günü haftalık özet iste. Müşteri şikâyetlerini önceliklendir.' }),
]

// ── 5–11. Departmanlar ───────────────────────────────────────────────────────────────────────────────────────
const D = {
  yonetim: { name: 'CEO Ofisi', focus: ['Strateji ve hedef takibi', 'Çapraz ekip koordinasyonu', 'Kurucularla raporlama', 'Yatırımcı ilişkileri', 'Önceliklendirme', 'Risk yönetimi'], mode: ['Haftalık hedef döngüsü (OKR)', 'Günlük koordinasyon', 'Olay bazlı'], quality: ['Net karar kaydı', 'Veriye dayalılık', 'Zamanında bilgilendirme'], kpis: ['Hedeflere ilerleme', 'Teslim tarihine uyum', 'Kurucu memnuniyeti', 'Karar süresi'], tools: ['Görev panosu', 'Haftalık rapor', 'Takvim'], review: ['Kurucular'], cadence: ['Günlük', 'Haftalık'], red: ['Kurucu onayı olmadan bütçe taahhüdü verme'], auto: 'hazirla' },
  yazilim: { name: 'Yazılım', focus: ['Web uygulaması', 'Mobil uygulama', 'API ve entegrasyonlar', 'Altyapı / DevOps', 'Test ve kalite', 'Güvenlik', 'Veri / yapay zekâ modelleri'], mode: ['2 haftalık sprint', 'Kanban (sürekli akış)', 'Özellik hazır olunca yayın', 'Proje bazlı'], quality: ['Kod incelemesi', 'Otomatik test', 'Performans bütçesi', 'Güvenlik taraması', 'Dokümantasyon'], kpis: ['Sürüm sıklığı', 'Hata oranı', 'Teslim süresi', 'Test kapsamı', 'Kesinti süresi'], tools: ['GitHub', 'CI/CD', 'Bulut sunucu', 'Hata izleme', 'Tasarım sistemi'], review: ['Kıdemli ajan', 'CEO', 'Kurucular', 'Otomatik (testler)'], cadence: ['Günlük durum', 'Haftalık sürüm', 'Sprint sonu'], red: ['Testsiz canlıya çıkma', 'Gizli anahtarı koda yazma', 'Müşteri verisini test ortamına kopyalama'], auto: 'hazirla' },
  tasarim: { name: 'Tasarım', focus: ['Arayüz / deneyim (UI/UX)', 'Marka kimliği', 'Ürün tasarımı', 'Hareketli tasarım', 'Pazarlama görselleri', 'Tasarım sistemi'], mode: ['Tasarım sprinti', 'Talebe göre (kuyruk)', 'Proje bazlı'], quality: ['Marka uyumu', 'Erişilebilirlik', 'Tutarlılık', 'Kullanıcı testi', 'Mobil uyum'], kpis: ['Revizyon sayısı', 'Teslim süresi', 'Kullanıcı memnuniyeti', 'Tasarım sistemi kapsamı'], tools: ['Prototip aracı', 'Tasarım sistemi', 'Görsel kütüphane'], review: ['Tasarım lideri', 'CEO', 'Kurucular'], cadence: ['Haftalık gözden geçirme', 'Proje sonu'], red: ['Lisanssız görsel/font kullanma', 'Marka renk ve kurallarını çiğneme'], auto: 'hazirla' },
  pazarlama: { name: 'Pazarlama', focus: ['İçerik üretimi', 'Sosyal medya', 'SEO ve yerel görünürlük', 'Reklam yönetimi', 'E-posta / otomasyon', 'Basın / halkla ilişkiler', 'Marka'], mode: ['Aylık kampanya takvimi', 'Haftalık içerik ritmi', 'Lansman odaklı'], quality: ['Marka sesi', 'Doğrulanmış bilgi', 'Yasal uyum (reklam, KVKK, İYS)', 'Ölçülebilir hedef'], kpis: ['Lead sayısı', 'Müşteri edinme maliyeti', 'Erişim', 'Dönüşüm oranı', 'Reklam getirisi (ROAS)'], tools: ['Pazarlama Merkezi', 'Sosyal medya hesapları', 'E-posta aracı', 'Analitik'], review: ['Pazarlama lideri', 'Marka Koruyucu', 'CEO', 'Kurucular'], cadence: ['Haftalık planlama', 'Aylık kampanya'], red: ['Sahte yorum / takipçi kullanma', 'İzinsiz toplu mesaj', 'Rakibi karalama', 'Doğrulanmamış üstünlük iddiası'], auto: 'hazirla' },
  arastirma: { name: 'Araştırma', focus: ['Pazar analizi', 'Rakip izleme', 'Kullanıcı araştırması', 'Veri analizi', 'Teknoloji / yapay zekâ trendleri', 'Fizibilite'], mode: ['Soru bazlı araştırma', 'Haftalık trend taraması', 'Sürekli izleme'], quality: ['Kaynak gösterme', 'Çift doğrulama', 'Tarafsızlık', 'Uygulanabilir öneri'], kpis: ['Rapor teslim süresi', 'Kararlara etkisi', 'Tahmin isabeti', 'Kaynak kalitesi'], tools: ['Arama / veri kaynakları', 'Anket', 'Analiz defteri'], review: ['Araştırma lideri', 'CEO'], cadence: ['Haftalık özet', 'Talebe göre'], red: ['Kaynaksız rakam sunma', 'Gizli kaynakları izinsiz kullanma'], auto: 'uygula' },
  muhasebe: { name: 'Muhasebe', focus: ['Fatura ve tahsilat', 'Bütçe ve maliyet takibi', 'Vergi / mevzuat uyumu', 'Bordro', 'Finansal raporlama', 'Nakit akışı'], mode: ['Aylık kapanış', 'Haftalık nakit kontrolü', 'Olay bazlı (fatura geldikçe)'], quality: ['Çift kontrol', 'Belgeli kayıt', 'Mevzuat uyumu', 'Mutabakat'], kpis: ['Nakit akışı', 'Bütçe sapması', 'Tahsilat süresi', 'Kapanış süresi'], tools: ['Muhasebe yazılımı', 'Banka mutabakatı', 'E-fatura'], review: ['Muhasebe müdürü', 'CEO', 'Kurucular'], cadence: ['Haftalık', 'Aylık kapanış'], red: ['Onaysız ödeme yapma', 'Mevzuata aykırı kayıt', 'Banka bilgilerini paylaşma'], auto: 'oner' },
  operasyon: { name: 'Operasyon', focus: ['Süreç otomasyonu', 'İzleme ve alarm', 'Destek / müşteri hizmetleri', 'Tedarik / lojistik', 'Kalite denetimi', 'Olay yönetimi'], mode: ['Sürekli izleme', 'Kat turu / denetim', 'Olay bazlı'], quality: ['Kesintisizlik', 'Yanıt süresi', 'Süreç dokümantasyonu', 'Tekrarlanabilirlik'], kpis: ['Çalışma süresi', 'Çözüm süresi', 'Otomasyon oranı', 'SLA uyumu'], tools: ['İzleme panosu', 'Otomasyon aracı', 'Destek kutusu'], review: ['Operasyon lideri', 'CEO'], cadence: ['Sürekli', 'Günlük denetim turu'], red: ['Onaysız canlı sistemde değişiklik', 'Müşteri verisine gereksiz erişim'], auto: 'uygula' },
}
const LABEL = Object.fromEntries(Object.entries(D).map(([k, v]) => [k, v.name]))

const deptSection = (id) => {
  const d = D[id]
  const p = `depts.${id}`
  const others = Object.keys(D).filter((k) => k !== id)
  return [
    Q(`${p}.enabled`, 'toggle', `${d.name} departmanı aktif olsun mu?`, { yes: 'Evet, aktif', no: 'Hayır, şimdilik kapalı', rec: () => true, help: 'Kapalı departmana Kağan yeni görev vermez.' }),
    Q(`${p}.focus`, 'multi', `${d.name} hangi alanlara odaklansın?`, { options: d.focus.map((x) => O(x, x)), custom: true, help: 'Seçtikleriniz yönlendirmede anahtar kelime olarak da kullanılır: Kağan bu alandaki işleri bu departmana verir.', rec: (pr) => d.focus.slice(0, ((ga(pr, 'goals.priorities') ?? []).includes(id) ? 4 : 2)) }),
    Q(`${p}.mode`, 'single', 'Çalışma biçimi', { options: d.mode.map((x) => O(x, x)), rec: () => d.mode[0] }),
    Q(`${p}.autonomy`, 'single', 'Otonomi seviyesi: bu ekip ne kadar bağımsız çalışsın?', { options: [O('oner', 'Öner', 'Yalnızca fikir/taslak sunar, her iş onay bekler'), O('hazirla', 'Hazırla', 'İşi hazırlar, başlatmak için onay ister'), O('uygula', 'Uygula', 'Onay modu izin veriyorsa kendiliğinden başlar')], rec: (pr) => (risk(pr) <= 2 ? (d.auto === 'uygula' ? 'hazirla' : 'oner') : risk(pr) >= 4 ? (d.auto === 'oner' ? 'hazirla' : 'uygula') : d.auto), help: 'Ofis çalışma prensiplerindeki onay biçimiyle birlikte çalışır.' }),
    Q(`${p}.weight`, 'scale', 'Öncelik ağırlığı (iş hızı)', { min: 1, max: 3, labels: ['Normal altı', 'Normal', 'Öncelikli'], rec: (pr) => ((ga(pr, 'goals.priorities') ?? []).includes(id) ? 3 : 2), help: 'Öncelikli departmanın görevleri daha hızlı ilerler (ofis simülasyonunda).' }),
    Q(`${p}.quality`, 'multi', 'Kalite ölçütleri', { options: d.quality.map((x) => O(x, x)), custom: true, rec: () => d.quality.slice(0, 2) }),
    Q(`${p}.kpis`, 'multi', 'Başarı göstergeleri (KPI)', { options: d.kpis.map((x) => O(x, x)), custom: true, max: 5, rec: () => d.kpis.slice(0, 3) }),
    Q(`${p}.tools`, 'multi', 'Kullanılan araçlar', { options: d.tools.map((x) => O(x, x)), custom: true }),
    Q(`${p}.collab`, 'multi', 'En çok hangi departmanlarla birlikte çalışır?', { options: others.map((k) => O(k, LABEL[k])), rec: () => (id === 'yonetim' ? others : id === 'yazilim' ? ['tasarim', 'operasyon'] : id === 'pazarlama' ? ['tasarim', 'arastirma'] : id === 'muhasebe' ? ['yonetim'] : ['yonetim']) }),
    Q(`${p}.review`, 'single', 'Çıktıları kim inceler?', { options: d.review.map((x) => O(x, x)), rec: () => d.review[0] }),
    Q(`${p}.cadence`, 'single', 'Raporlama / çalışma ritmi', { options: d.cadence.map((x) => O(x, x)), rec: () => d.cadence[0] }),
    Q(`${p}.redlines`, 'list', 'Kırmızı çizgiler: bu ekibin asla yapmaması gerekenler', { presets: d.red, placeholder: 'Yeni bir kural yazın', max: 8, rec: () => d.red.slice(0, 2) }),
    Q(`${p}.notes`, 'text', 'Bu departman için özel talimat / not', { placeholder: 'Kağan ve ajanlar bu notu göz önünde bulundurur.' }),
  ]
}

// ── 12. Risk, güvenlik, uyum ──────────────────────────────────────────────────────────────────────────────
const riskQ = [
  Q('risk.data', 'multi', 'Hangi veriyi işliyorsunuz?', { options: ['Müşteri kişisel verisi', 'Ödeme / kart bilgisi', 'Sağlık verisi', 'Çalışan verisi', 'Ticari sır', 'Kaynak kod', 'Hiçbiri (yalnızca genel veri)'].map((x) => O(x, x)), custom: true }),
  Q('risk.compliance', 'multi', 'Uymanız gereken mevzuat / standartlar', { options: ['KVKK', 'GDPR', 'Ticari elektronik ileti (İYS)', 'Ödeme güvenliği (PCI)', 'Sağlık mevzuatı', 'Reklam yönetmeliği', 'Finansal mevzuat', 'ISO 27001'].map((x) => O(x, x)), custom: true, rec: (p) => (/Sağlık/.test(ga(p, 'identity.sector') ?? '') ? ['KVKK', 'Sağlık mevzuatı', 'Reklam yönetmeliği'] : /E-ticaret/.test(ga(p, 'identity.sector') ?? '') ? ['KVKK', 'Ticari elektronik ileti (İYS)', 'Ödeme güvenliği (PCI)'] : ['KVKK']), help: 'Hukuki danışmanlık yerine geçmez; ajanlar bu maddeleri “dikkat edilecek” olarak ele alır.' }),
  Q('risk.security', 'single', 'Güvenlik düzeyi', { options: [O('temel', 'Temel', 'Parola, yedek, erişim kontrolü'), O('yuksek', 'Yüksek', 'Rol bazlı yetki, denetim kaydı, sızma testi'), O('kurumsal', 'Kurumsal', 'Standart/denetim gereksinimleri')], rec: (p) => (risk(p) <= 2 ? 'yuksek' : 'temel') }),
  Q('risk.humanReview', 'multi', 'Her zaman insan onayı gerektiren işler', { options: ['Ödeme ve para transferi', 'Müşteriye giden mesajlar', 'Hukuki/sözleşme metinleri', 'Canlı sistemde değişiklik', 'Fiyat değişikliği', 'Kişisel veri paylaşımı', 'Kamuya açık paylaşım', 'Yeni abonelik/satın alma'].map((x) => O(x, x)), custom: true, rec: () => ['Ödeme ve para transferi', 'Hukuki/sözleşme metinleri', 'Kişisel veri paylaşımı', 'Canlı sistemde değişiklik'], help: 'Onay modu “hiç” olsa bile bu işler için ajanlar durup sorar.' }),
  Q('risk.incident', 'single', 'Güvenlik/veri olayında ne olsun?', { options: [O('durdur', 'İlgili işleri durdur ve hemen bildir'), O('bildir', 'Yalnızca bildir, işler sürsün'), O('toplanti', 'Acil toplantı çağır (CEO + ilgili lider)')], rec: () => 'durdur' }),
  Q('risk.secrets', 'single', 'Gizli anahtar ve parola yönetimi', { options: [O('kasa', 'Anahtar kasası / ortam değişkeni (kodda asla)'), O('manuel', 'Elle yönetilir')], rec: () => 'kasa' }),
  Q('risk.backup', 'single', 'Yedekleme sıklığı', { options: [O('gunluk', 'Günlük'), O('haftalik', 'Haftalık'), O('yok', 'Henüz yok')], rec: () => 'gunluk' }),
  Q('risk.ai', 'multi', 'Yapay zekâ kullanım politikası', { options: ['Müşteri verisi modele gönderilmez', 'Hassas veri maskelenir', 'Çıktı insan onayı olmadan dışarı çıkmaz', 'Üretilen içerik “yapay zekâ ile üretildi” etiketlenir', 'Kaynaksız iddia yazılmaz'].map((x) => O(x, x)), custom: true, rec: () => ['Müşteri verisi modele gönderilmez', 'Kaynaksız iddia yazılmaz'] }),
  Q('risk.comms', 'single', 'Dış iletişim (basın, sosyal medya, müşteri) kim onaylar?', { options: [O('kurucu', 'Kurucular'), O('ceo', 'Kağan'), O('lider', 'İlgili departman lideri')], rec: () => 'kurucu' }),
]

export const SECTIONS = [
  { id: 'kimlik', title: 'Şirket kimliği', icon: 'Building2', intro: 'Şirketi tanıyalım. Kağan ve ajanlar bu bilgilerle sizin dilinizden konuşur.', questions: kimlik },
  { id: 'hedef', title: 'Hedefler ve strateji', icon: 'Target', intro: 'Nereye gidiyoruz? Öncelikler, risk iştahı ve bütçe ofisin hızını ve özerkliğini belirler.', questions: hedef },
  { id: 'ofis', title: 'Ofis çalışma prensipleri', icon: 'Workflow', intro: 'Ofis nasıl çalışsın? Kararlar, onaylar, tempo, raporlama ve kalite kapısı.', questions: ofis },
  { id: 'ceo', title: 'CEO Kağan', icon: 'Crown', intro: 'Yapay zekâ CEO’nuzun kişiliği, yetkisi ve sizinle çalışma şekli.', questions: ceo },
  ...['yonetim', 'yazilim', 'tasarim', 'pazarlama', 'arastirma', 'muhasebe', 'operasyon'].map((id) => ({ id: `dept-${id}`, dept: id, title: D[id].name, icon: id === 'yonetim' ? 'Crown' : { yazilim: 'Code', tasarim: 'Palette', pazarlama: 'Megaphone', arastirma: 'FlaskConical', muhasebe: 'Calculator', operasyon: 'Workflow' }[id], intro: `${D[id].name} ekibi nasıl çalışsın? Odak, otonomi, kalite ve kırmızı çizgiler.`, questions: deptSection(id) })),
  { id: 'risk', title: 'Risk, güvenlik ve uyum', icon: 'ShieldCheck', intro: 'Hassas veri, mevzuat ve her zaman insan onayı gerektiren işler.', questions: riskQ },
  { id: 'ozet', title: 'Özet ve öneriler', icon: 'ClipboardCheck', intro: 'Cevaplarınızdan çıkan çalışma kuralları ve sistemin önerileri.', questions: [] },
]
export const ALL_QUESTIONS = SECTIONS.flatMap((s) => s.questions.map((q) => ({ ...q, section: s.id })))
export const QUESTION_BY_ID = Object.fromEntries(ALL_QUESTIONS.map((q) => [q.id, q]))

const has = (v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length)
export const answered = (p, q) => has(ga(p, q.id)) || (q.type === 'hours' && (has(ga(p, q.start)) || has(ga(p, q.end))))
export function progress(p, section) {
  const qs = section ? SECTIONS.find((s) => s.id === section)?.questions ?? [] : ALL_QUESTIONS
  const n = qs.filter((q) => answered(p, q)).length
  return { n, total: qs.length, pct: qs.length ? Math.round((n / qs.length) * 100) : 0 }
}

/** Boş sorular için önerilen cevaplar { yol: değer } (kullanıcı cevabını ezmez) */
export function recommendations(p, section) {
  const out = {}
  const qs = section ? SECTIONS.find((s) => s.id === section)?.questions ?? [] : ALL_QUESTIONS
  // sıralı uygula: bir öneri başka cevaba bağlı olabilir (ör. onay biçimi → CEO yetkisi)
  let cur = p
  for (const q of qs) {
    if (!q.rec || answered(cur, q)) continue
    const v = q.rec(cur)
    if (has(v) || v === false || v === 0) {
      out[q.id] = v
      cur = mergeDeep(p, out)
    }
  }
  return out
}
function mergeDeep(base, flat) {
  const out = JSON.parse(JSON.stringify(base))
  for (const [path, v] of Object.entries(flat)) {
    const keys = path.split('.')
    let o = out
    keys.forEach((k, i) => {
      if (i === keys.length - 1) o[k] = v
      else o = o[k] ??= {}
    })
  }
  return out
}

/** Çapraz kontrol ve sistem önerileri: { id, level: 'öneri'|'uyarı', text, patch } */
export function suggestions(p) {
  const out = []
  const g = (path) => ga(p, path)
  const add = (id, level, text, patch) => out.push({ id, level, text, patch })
  const pri = g('goals.priorities') ?? []
  const heavy = Object.entries(p.depts ?? {}).filter(([, d]) => d?.weight === 3).map(([k]) => k)
  if (heavy.length > 3) add('heavy', 'uyarı', `${heavy.length} departman “Öncelikli”: hepsi öncelikliyse hiçbiri değildir. En çok 3 tanesini öncelikli tutun.`)
  if (pri.length && heavy.length === 0) add('pri', 'öneri', 'Önceliklendirdiğiniz departmanların iş hızı ağırlığını yükseltelim.', Object.fromEntries(pri.map((d) => [`depts.${d}.weight`, 3])))
  if (g('ops.approval') === 'hic' && (g('risk.humanReview') ?? []).length === 0) add('hic', 'uyarı', 'Onay gerekmesin dediniz ama “her zaman insan onayı” listesi boş. Ödeme, hukuki metin ve kişisel veri için onay isteyen bir liste önerilir.', { 'risk.humanReview': ['Ödeme ve para transferi', 'Hukuki/sözleşme metinleri', 'Kişisel veri paylaşımı'] })
  if (g('ops.approval') === 'hic' && g('ceo.briefing') === 'kapali') add('blind', 'uyarı', 'Onaysız çalışma + sessiz CEO: ne olduğunu göremeyebilirsiniz. Kağan’ın güncelleme sıklığını “normal” yapmanızı öneririz.', { 'ceo.briefing': 'normal' })
  if (g('ops.approval') === 'her' && g('ceo.authority') === 'yurut') add('mismatch', 'uyarı', 'CEO’ya tam yetki verdiniz ama ofis her planı onayınıza bağlıyor. İkisini uyumlu hâle getirelim (CEO yetkisi: planlasın, siz onaylayın).', { 'ceo.authority': 'planla' })
  if (g('ops.approval') === 'hic' && g('ceo.authority') === 'planla') add('mismatch2', 'öneri', 'Onay gerekmediği için CEO’nun yetkisini “planlasın ve yürütsün” yapmak daha tutarlı.', { 'ceo.authority': 'yurut' })
  const dis = Object.entries(p.depts ?? {}).filter(([k, d]) => d?.enabled === false && pri.includes(k)).map(([k]) => k)
  if (dis.length) add('disabled', 'uyarı', `Öncelikli seçtiğiniz “${dis.map((k) => LABEL[k]).join(', ')}” departmanı kapalı.`, Object.fromEntries(dis.map((k) => [`depts.${k}.enabled`, true])))
  const comp = g('risk.compliance') ?? []
  if (comp.includes('KVKK') && !(g('risk.ai') ?? []).includes('Müşteri verisi modele gönderilmez')) add('kvkk', 'öneri', 'KVKK’ya tabisiniz: “müşteri verisi modele gönderilmez” kuralını yapay zekâ politikasına ekleyelim.', { 'risk.ai': [...new Set([...(g('risk.ai') ?? []), 'Müşteri verisi modele gönderilmez'])] })
  if (g('ops.hoursStart') && g('ops.pauseOutside') === undefined) add('pause', 'öneri', 'Mesai saatlerini girdiniz; mesai dışında ofisin durmasını ister misiniz? (Kapalıyken ajanlar 7/24 çalışır.)', { 'ops.pauseOutside': true })
  if (g('goals.risk') <= 2 && Object.entries(p.depts ?? {}).some(([, d]) => d?.autonomy === 'uygula')) add('risk-auto', 'öneri', 'Temkinli bir risk iştahı seçtiniz; “Uygula” otonomisindeki departmanları “Hazırla” seviyesine çekmeyi düşünün.', Object.fromEntries(Object.entries(p.depts ?? {}).filter(([, d]) => d?.autonomy === 'uygula').map(([k]) => [`depts.${k}.autonomy`, 'hazirla'])))
  if (g('goals.risk') >= 4 && g('ops.approval') === 'her') add('speed', 'öneri', 'Cesur bir risk iştahınız var ama her plan onaya bağlı. “Yalnızca riskli işler onay istesin” seçeneği hızınızı artırır.', { 'ops.approval': 'riskli' })
  if (!(g('goals.okrs') ?? []).length) add('okr', 'öneri', 'Hedef (OKR) girmediniz: Kağan görevleri hedeflere bağlayamaz. En az 1–3 hedef yazın.')
  if (!g('identity.name')) add('name', 'uyarı', 'Şirket adı boş: ajanlar şirketi adıyla anamaz.')
  if (g('ops.reportFreq') === 'anlik' && g('ceo.briefing') === 'kapali') add('report', 'uyarı', 'Anlık rapor istiyorsunuz ama CEO güncellemeleri kapalı.', { 'ceo.briefing': 'sik' })
  return out
}

/** Cevaplardan türeyen çalışma kurallarının okunur özeti (özet sayfası ve kayıt farkı için) */
export function describeRules(p) {
  const g = (x) => ga(p, x)
  const lbl = (qid, v) => QUESTION_BY_ID[qid]?.options?.find((o) => o.v === v)?.l ?? v
  const rows = []
  const add = (k, v) => v !== undefined && v !== '' && rows.push([k, v])
  add('Onay biçimi', lbl('ops.approval', g('ops.approval')))
  add('Karar verme', lbl('ops.decision', g('ops.decision')))
  add('Tempo', lbl('ops.tempo', g('ops.tempo')))
  add('Mesai', g('ops.hoursStart') ? `${g('ops.hoursStart')}–${g('ops.hoursEnd') ?? ''}${g('ops.pauseOutside') ? ' · mesai dışında durur' : ''}` : undefined)
  add('CEO yetkisi', lbl('ceo.authority', g('ceo.authority')))
  add('CEO güncelleme', lbl('ceo.briefing', g('ceo.briefing')))
  add('CEO üslubu', lbl('ceo.style', g('ceo.style')))
  add('Rapor', [lbl('ops.reportFreq', g('ops.reportFreq')), lbl('ops.reportFormat', g('ops.reportFormat'))].filter(Boolean).join(' · ') || undefined)
  add('Risk iştahı', g('goals.risk') ? `${g('goals.risk')}/5 · ${QUESTION_BY_ID['goals.risk'].labels[g('goals.risk') - 1]}` : undefined)
  add('Öncelikli departmanlar', (g('goals.priorities') ?? []).map((k) => LABEL[k]).join(', ') || undefined)
  return rows
}

export const DEPT_LABEL = LABEL
