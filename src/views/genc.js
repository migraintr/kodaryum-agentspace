// Kodaryum Genç (kodaryum.net/genc) — satış ortaklığı platformu. Canlı veriler sitenin kendi
// yönetici panelinde; buradan her modül ilgili AI kuruluna bağlanır ve doğrudan o sayfa açılır.
export const SITE_URL = 'https://kodaryum.net'

export const GENC = {
  name: 'Kodaryum Genç',
  tagline: 'Satış Ortaklığı Platformu',
  url: `${SITE_URL}/genc`,
  adminUrl: `${SITE_URL}/admin`,
  summary:
    'Satış ortakları çevresindeki işletmeleri bulur ve fiyatta anlaşır; yazılımı Kodaryum ekibi yapar, kurar ve destekler. Müşteri ödemeyi tamamlayınca ortağın komisyonu IBAN’ına yatar.',
  facts: [
    ['%15–20', 'Ortak komisyonu'],
    ['5 adım', 'Satış süreci'],
    ['Ücretsiz', 'Ortak üyeliği'],
  ],
  steps: ['Ürünü öğren', 'Müşteriyle görüş', 'Fiyatta anlaş', 'Doğrulama', 'Kazanç ve ödeme'],
  modules: [
    { id: 'leads', name: 'Müşteri Adayları', path: '/admin/leads', board: 'operasyon', icon: 'UserPlus', desc: 'Ortakların eklediği işletmeler ve görüşme geçmişi' },
    { id: 'review', name: 'Doğrulama & Onay', path: '/admin/review', board: 'operasyon', icon: 'ShieldCheck', desc: 'Aday ve satışların ekip tarafından kontrolü' },
    { id: 'sales', name: 'Satışlar', path: '/admin/sales', board: 'pazarlama', icon: 'Handshake', desc: 'Fiyatı anlaşılıp panelden gönderilen satışlar' },
    { id: 'products', name: 'Ürün Kataloğu', path: '/admin/products', board: 'pazarlama', icon: 'Package', desc: 'Web sitesi, randevu, QR menü, AI asistan ve en düşük fiyatlar' },
    { id: 'academy', name: 'Akademi', path: '/admin/academy', board: 'pazarlama', icon: 'GraduationCap', desc: 'Ortakların ürünleri öğrendiği eğitimler' },
    { id: 'finance', name: 'Finans', path: '/admin/finance', board: 'operasyon', icon: 'Landmark', desc: 'Komisyon hesapları ve gelir takibi' },
    { id: 'withdrawals', name: 'Cüzdan & Çekimler', path: '/admin/withdrawals', board: 'operasyon', icon: 'Wallet', desc: 'IBAN ödemeleri ve çekim talepleri' },
    { id: 'fraud', name: 'Dolandırıcılık Kontrolü', path: '/admin/fraud', board: 'operasyon', icon: 'ShieldAlert', desc: 'Şüpheli aday ve satışların tespiti' },
    { id: 'notifications', name: 'Bildirimler', path: '/admin/notifications', board: 'yazilim', icon: 'Bell', desc: 'Ortaklara giden duyuru ve bildirimler' },
    { id: 'audit', name: 'Sistem & Denetim', path: '/admin/audit-logs', board: 'yazilim', icon: 'ScrollText', desc: 'Denetim kayıtları, sistem durumu ve ayarlar' },
  ],
}
