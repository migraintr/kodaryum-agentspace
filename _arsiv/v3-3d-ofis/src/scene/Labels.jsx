// 3D sahnenin üstünde keskin HTML etiketler: oda tabelaları (tıklanabilir) ve çalışan isimlikleri.
// LabelLayer DOM'u bir kez çizer; Projector her karede 3D çapaları ekrana yansıtıp yalnızca
// değişen konumları yazar (React yeniden çizimi yok). Uzaklaştıkça ayrıntı azalır (data-lod).
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Crown } from 'lucide-react'
import { teamOf } from '../data.js'
import { useStore } from '../store.js'
import { ICONS, alpha } from '../ui/kit.jsx'
import { CEO_ANCHOR, PLACES, ROOMS, personAnchor, signAnchor } from './layout.js'

const COUNT = Object.fromEntries(ROOMS.map((r) => [r.id, teamOf(r.id).length]))
const ORDERED = [...PLACES].sort((a, b) => a.z - b.z) // arkadakiler önce → öndekiler üstte kalır
const HIDDEN = { display: 'none' }

const ANCHORS = new Map([
  ...ROOMS.map((r) => [`room:${r.id}`, new THREE.Vector3(...signAnchor(r))]),
  ...PLACES.map((p) => [`person:${p.person.id}`, p.standing ? CEO_ANCHOR : new THREE.Vector3(...personAnchor(p))]),
])

function PersonLabel({ place }) {
  const { person, room } = place
  const [first, ...rest] = person.name.split(' ')
  if (place.standing) {
    return (
      <div className="-translate-x-1/2 -translate-y-full">
        <div className="flex items-center gap-1.5 rounded-lg border border-amber-300/60 bg-amber-50/95 dark:bg-[#120d02]/85 px-2 py-1 whitespace-nowrap shadow-[0_0_18px_-4px_#f59e0b]">
          <Crown size={12} className="text-amber-600 dark:text-amber-300" />
          <span className="text-[11px] leading-none font-bold text-amber-900 dark:text-amber-100">
            {first}
            <span className="lod-last"> {rest.join(' ')}</span>
          </span>
          <span className="rounded bg-amber-400/20 px-1 font-mono text-[9px] text-amber-800 dark:text-amber-200">CEO</span>
        </div>
      </div>
    )
  }
  return (
    <div className="lod-person -translate-x-1/2">
      <div
        className="flex items-center gap-1.5 rounded-md border bg-panel/90 px-1.5 py-[3px] whitespace-nowrap"
        style={{ borderColor: alpha(room.color, 0.45), boxShadow: `0 0 12px -6px ${room.color}` }}
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: room.color, boxShadow: `0 0 6px ${room.color}` }} />
        <span className="leading-none">
          <span className="block text-[10px] font-semibold text-ink-2">
            {first}
            <span className="lod-last"> {rest.join(' ')}</span>
          </span>
          <span className="lod-role mt-0.5 block text-[8.5px] text-ink-4">{person.role}</span>
        </span>
      </div>
    </div>
  )
}

function RoomSign({ room, active, dim }) {
  const Icon = ICONS[room.icon]
  const { focusRoom, hoverRoom } = useStore.getState()
  return (
    <button
      type="button"
      onClick={() => focusRoom(room.id)}
      onPointerEnter={() => hoverRoom(room.id)}
      onPointerLeave={() => hoverRoom(null)}
      className={`pointer-events-auto flex -translate-y-full cursor-pointer items-center gap-1.5 rounded-lg border bg-panel/90 py-1 pr-2 pl-1 whitespace-nowrap transition-[opacity,box-shadow] duration-300 ${dim ? 'opacity-40' : ''}`}
      style={{
        borderColor: alpha(room.color, active ? 0.9 : 0.45),
        boxShadow: `0 0 ${active ? 26 : 14}px -${active ? 4 : 6}px ${room.color}`,
      }}
    >
      <span className="grid h-5 w-5 place-items-center rounded-md" style={{ background: alpha(room.color, 0.2), color: room.color }}>
        <Icon size={12} />
      </span>
      <span className="lod-sign-name text-[11px] font-semibold text-ink">{room.name}</span>
      {COUNT[room.id] > 0 && (
        <span className="lod-sign-meta font-mono text-[10px]" style={{ color: room.color }}>
          {COUNT[room.id]}
        </span>
      )}
    </button>
  )
}

export function LabelLayer({ registry, layerRef }) {
  const roomId = useStore((s) => s.roomId)
  const selectedId = useStore((s) => s.selectedId)
  const hoveredRoom = useStore((s) => s.hoveredRoom)

  // Kararlı ref geri çağrıları: öğeyi kayda ekler / çıkarır
  const refs = useMemo(
    () =>
      Object.fromEntries(
        [...ANCHORS.keys()].map((key) => [
          key,
          (el) => {
            if (el) registry.set(key, { el, pos: ANCHORS.get(key), x: -1e5, y: -1e5, hidden: null })
            else registry.delete(key)
          },
        ]),
      ),
    [registry],
  )

  const inFocus = (room) => (roomId ? roomId === room.id : selectedId ? room.board === selectedId : true)

  return (
    <div ref={layerRef} data-lod="mid" className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {ROOMS.map((r) => (
        <div key={r.id} ref={refs[`room:${r.id}`]} className="absolute top-0 left-0 will-change-transform" style={HIDDEN}>
          <RoomSign
            room={r}
            dim={!inFocus(r)}
            active={(inFocus(r) && !!(roomId || selectedId)) || hoveredRoom === r.id}
          />
        </div>
      ))}
      {/* Çalışan isimlikleri ana görünümde gizli; yalnızca seçilen odanın (veya kurulun) ekibi görünür */}
      {ORDERED.map((p) => (
        <div key={p.person.id} ref={refs[`person:${p.person.id}`]} className="absolute top-0 left-0 will-change-transform" style={HIDDEN}>
          {(roomId || selectedId) && inFocus(p.room) && <PersonLabel place={p} />}
        </div>
      ))}
    </div>
  )
}

export function Projector({ registry, layerRef }) {
  const v = useMemo(() => new THREE.Vector3(), [])
  const lod = useRef('mid')

  useFrame(({ camera, size, controls }) => {
    for (const item of registry.values()) {
      v.copy(item.pos).project(camera)
      const hidden = v.z > 1 || Math.abs(v.x) > 1.3 || Math.abs(v.y) > 1.3
      if (hidden !== item.hidden) {
        item.el.style.display = hidden ? 'none' : ''
        item.hidden = hidden
      }
      if (hidden) continue
      const x = ((v.x + 1) / 2) * size.width
      const y = ((1 - v.y) / 2) * size.height
      if (Math.abs(x - item.x) > 0.1 || Math.abs(y - item.y) > 0.1) {
        item.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`
        item.x = x
        item.y = y
      }
    }

    // Ayrıntı düzeyi: hedef noktasında 1 dünya biriminin kaç piksel olduğuna göre
    if (controls && layerRef.current) {
      const dist = camera.position.distanceTo(controls.target)
      const ppu = size.height / (2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2))
      const next = ppu < 11 ? 'tiny' : ppu < 18 ? 'far' : ppu < 30 ? 'mid' : 'near'
      if (next !== lod.current) {
        layerRef.current.dataset.lod = next
        lod.current = next
      }
    }
  })
  return null
}
