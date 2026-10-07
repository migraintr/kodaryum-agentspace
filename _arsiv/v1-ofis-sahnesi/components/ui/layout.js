/**
 * KKM — HUD YERLEŞİM ÖLÇÜLERİ
 *
 * 2D paneller 3D sahnenin üstüne biner. Kamera, panellerin kapladığı alanı
 * bilerek sahneyi KALAN boş alanın ortasına yerleştirir (CameraRig →
 * camera.setViewOffset). Bu yüzden panel ölçüleri tek bir yerde tutulur ve
 * hem arayüz hem kamera aynı hesaplamayı kullanır.
 */

export const HUD = Object.freeze({
  headerHeight: 64,
  sidebarWidth: 272,
  rightWidth: 388,
  gap: 12,
  /** Bu genişliğin altında paneller sahnenin üstüne açılır (mobil/tablet) */
  desktopMinWidth: 1024,
})

/**
 * Panellerin ekranda kapladığı kenar boşlukları (px).
 * @param {{ isSidebarOpen: boolean, isDetailPanelOpen: boolean, isChatOpen: boolean, isPresidentFocused: boolean }} ui
 * @param {number} viewportWidth
 */
export function computeHudInsets(ui, viewportWidth) {
  const top = HUD.headerHeight + HUD.gap
  if (viewportWidth < HUD.desktopMinWidth) return { left: 0, right: 0, top, bottom: 0 }

  const rightOpen = ui.isDetailPanelOpen || ui.isPresidentFocused || ui.isChatOpen
  return {
    left: ui.isSidebarOpen ? HUD.sidebarWidth + HUD.gap * 2 : 0,
    right: rightOpen ? HUD.rightWidth + HUD.gap * 2 : 0,
    top,
    bottom: 0,
  }
}
