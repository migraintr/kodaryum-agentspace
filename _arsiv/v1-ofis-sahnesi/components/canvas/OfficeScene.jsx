/**
 * KKM — OFİS SAHNESİ (3D dijital şirket haritası)
 *
 * OfficeKit tüm instance setlerini sağlar; içindeki her bileşen parçalarını
 * bu setlere kaydeder. OfficeScene store'a abone OLMAZ — yalnızca BoardRooms
 * kurul listesini izler ve her oda sadece kendi kurulu değişince yenilenir.
 *
 * Katmanlar:
 *   Bina kabuğu → Komuta Merkezi → Mola & Resepsiyon → 18 Kurul Odası
 *   → Kurullar arası veri akışları → Başkan komuta kanalları
 */

import { useKKMStore } from '../../store/useKKMStore.js'
import { CommandChannels } from './flows/CommandChannels.jsx'
import { DataFlowNetwork } from './flows/DataFlowNetwork.jsx'
import { OfficeKit } from './kit/OfficeKit.jsx'
import { BoardRoom } from './office/BoardRoom.jsx'
import { Building } from './office/Building.jsx'
import { CommandCenter } from './office/CommandCenter.jsx'
import { Lobby } from './office/Lobby.jsx'
import { Lounge } from './office/Lounge.jsx'

function BoardRooms() {
  const boards = useKKMStore((s) => s.boards)
  return boards.map((board) => <BoardRoom key={board.id} board={board} />)
}

export function OfficeScene() {
  return (
    <OfficeKit>
      <Building />
      <CommandCenter />
      <Lounge />
      <Lobby />
      <BoardRooms />
      <DataFlowNetwork />
      <CommandChannels />
    </OfficeKit>
  )
}
