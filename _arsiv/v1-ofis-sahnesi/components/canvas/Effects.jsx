/**
 * KKM — POST-PROCESSING
 *
 *  N8AO      → Ekran-uzayı ortam gölgelemesi (köşeler, masa altları, nesne
 *              temas noktaları) — "gerçekçilik" hissinin en büyük kaynağı
 *  Bloom     → Yoğunluğu 1'i aşan (HDR) yüzeyler parlar: ekranlar, LED'ler,
 *              statü haleleri, Başkan çekirdeği
 *  ToneMapping (ACES Filmic) → Sinematik renk/kontrast eğrisi
 *              (EffectComposer, renderer'ın kendi ton eşlemesini kapatır)
 *  Vignette  → Kenarlarda hafif kararma, odağı merkeze çeker
 */

import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

export function Effects({ quality = 'high' }) {
  const high = quality === 'high'
  return (
    <EffectComposer multisampling={high ? 4 : 0}>
      <N8AO aoRadius={1.1} distanceFalloff={0.6} intensity={2.4} aoSamples={high ? 16 : 8} denoiseSamples={4} halfRes={!high} />
      <Bloom mipmapBlur luminanceThreshold={1.2} luminanceSmoothing={0.2} intensity={1.0} radius={0.72} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.62} />
    </EffectComposer>
  )
}
