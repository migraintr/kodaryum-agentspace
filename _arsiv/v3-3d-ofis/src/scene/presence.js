// 3D figürlerin birbirini görmesi için paylaşılan (React dışı, her karede güncellenen) durum.
// Yöneticiler, CEO, oturan çalışanlar ve nargileler bu nesneler üzerinden haberleşir.

// Çevrimiçi yöneticinin bulunduğu oda. since: odaya vardığı an (saniye, sahne saati).
// Odadakiler bu andan sonraki birkaç saniye ayağa kalkıp ona döner; CEO ayağa kalkıp selamlar.
export const PRESENCE = { room: 'yonetim', since: -100, x: 0, z: 0 }
export const GREET_SECONDS = 6

// Nargile hortumları: anahtar → { active, hand (dünya konumu), inhale (0..1) }
// Figür nargile içerken her karede kendi hortumunun ucunu eline taşır.
export const SMOKERS = new Map()

// Duman parçacığı kuyruğu: figürler ve nargileler buraya ekler, Smoke bileşeni her karede boşaltır.
export const SMOKE_QUEUE = []
export function emitSmoke(x, y, z, count = 6, strength = 1) {
  for (let i = 0; i < count; i++) SMOKE_QUEUE.push({ x, y, z, strength })
}
