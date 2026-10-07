/**
 * KKM — 3D ETİKET KATMANI (DOM)
 *
 * Canvas'ın tam üstünde, onunla aynı boyutta duran şeffaf katman.
 * İçindeki etiketlerin konumunu Canvas içindeki <LabelProjector> günceller.
 *
 *   - 18 kurul rozeti        → her zaman
 *   - Başkan rozeti          → her zaman
 *   - Agent statü etiketleri → yalnızca seçili kurulun agent'ları
 */

import { useMemo } from 'react'
import { useKKMStore } from '../../../store/useKKMStore.js'
import { selectSelectedBoard } from '../../../store/selectors.js'
import { getAgentLabelAnchors } from '../layout/floorPlan.js'
import { AgentLabel } from './AgentLabel.jsx'
import { PresidentLabel } from './PresidentLabel.jsx'
import { RoomLabel } from './RoomLabel.jsx'

function SelectedBoardAgentLabels() {
  const board = useKKMStore(selectSelectedBoard)
  const anchors = useMemo(() => (board ? getAgentLabelAnchors(board) : []), [board])
  return anchors.map(({ agent, position }) => <AgentLabel key={agent.id} agent={agent} position={position} />)
}

export function LabelLayer() {
  const boards = useKKMStore((s) => s.boards)

  return (
    <div className="pointer-events-none absolute inset-0 isolate z-10 overflow-hidden">
      {boards.map((board) => (
        <RoomLabel key={board.id} board={board} />
      ))}
      <PresidentLabel />
      <SelectedBoardAgentLabels />
    </div>
  )
}
