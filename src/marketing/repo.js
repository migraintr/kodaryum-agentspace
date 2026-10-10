// Veri erişim katmanı. Aşama A: tarayıcı deposu (localStorage), çalışma alanı (workspace) başına bir kayıt.
// Aşama B (Supabase): aynı arayüzü (load/save/clear/subscribe) Supabase istemcisiyle uygulayın; çalışma alanı kimliği
// satır düzeyinde güvenlik (RLS) ile izole edilir. Şema: supabase/schema.sql. Arayüz bileşenleri bu dosyadan başka
// depolamaya dokunmaz, böylece geçiş yalnızca burada yapılır.
const KEY = 'kkm:mkt:v1'
const listeners = new Set()

export const repo = {
  /** Çalışma alanı belgesini okur (yoksa null) */
  load() {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  /** Belgeyi yazar. Dolu depo / özel pencere gibi durumlarda sessizce başarısız olur ve false döner. */
  save(doc) {
    try {
      localStorage.setItem(KEY, JSON.stringify(doc))
      listeners.forEach((f) => f(doc))
      return true
    } catch {
      return false
    }
  },
  /** KVKK: tüm pazarlama verisini siler */
  clear() {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* erişilemiyor */
    }
  },
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  size() {
    try {
      return (localStorage.getItem(KEY) ?? '').length
    } catch {
      return 0
    }
  },
}
