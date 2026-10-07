// Kurul ajanları: her kurulun etrafında duran sade silindir insan figürleri.
// Kurul rengi gövde, ten rengi baş; kurul başkanında altın yaka. Tüm figürler
// tek seferde (instancing) çizilir: 28 kişi = 3 draw call.
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BOARDS } from '../data.js'
import { boardPosition } from './helpers.js'

const RADIUS = 3.8 // kurul merkezine uzaklık
const GAP = THREE.MathUtils.degToRad(110) // CEO'ya bakan tarafta boşluk (veri akışı oradan geçer)
const BODY_HEIGHT = 1.3
const HEAD_Y = BODY_HEIGHT + 0.3

// Her kurul ekibini, CEO'ya bakan taraf hariç yay üzerinde eşit aralıklarla dizer; başkan ortada
const PEOPLE = BOARDS.flatMap((board, b) => {
  const [bx, , bz] = boardPosition(board.angle)
  const outward = Math.atan2(bx, bz) // kurulun CEO'dan uzağa bakan yönü
  const team = [...board.agents]
  team.splice(Math.floor(team.length / 2), 0, board.chair.name) // başkanı ortaya yerleştir
  const span = Math.PI * 2 - GAP
  return team.map((name, i) => {
    const a = outward - span / 2 + (span * i) / (team.length - 1)
    return {
      x: bx + Math.sin(a) * RADIUS,
      z: bz + Math.cos(a) * RADIUS,
      color: new THREE.Color(board.color),
      chair: name === board.chair.name,
      phase: b * 1.7 + i * 0.9,
    }
  })
})
const CHAIRS = PEOPLE.filter((p) => p.chair)

export default function Agents() {
  const bodies = useRef()
  const heads = useRef()
  const collars = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Figürleri yerleştirir; hafif nefes alma salınımı ekler
  const place = (t) => {
    const set = (mesh, list, y) => {
      list.forEach((p, i) => {
        dummy.position.set(p.x, y + Math.sin(t * 1.6 + p.phase) * 0.04, p.z)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    }
    set(bodies.current, PEOPLE, BODY_HEIGHT / 2)
    set(heads.current, PEOPLE, HEAD_Y)
    set(collars.current, CHAIRS, BODY_HEIGHT - 0.04)
  }

  // İlk karede doğru konumda olsunlar (gölgeler ilk karede bir kez hesaplanıyor)
  useLayoutEffect(() => {
    PEOPLE.forEach((p, i) => bodies.current.setColorAt(i, p.color))
    bodies.current.instanceColor.needsUpdate = true
    place(0)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(({ clock }) => place(clock.elapsedTime))

  return (
    <group>
      <instancedMesh ref={bodies} args={[null, null, PEOPLE.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.26, 0.3, BODY_HEIGHT, 24]} />
        <meshStandardMaterial roughness={0.45} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[null, null, PEOPLE.length]} frustumCulled={false}>
        <sphereGeometry args={[0.24, 24, 16]} />
        <meshStandardMaterial color="#e5c4a8" roughness={0.55} />
      </instancedMesh>
      <instancedMesh ref={collars} args={[null, null, CHAIRS.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.29, 0.29, 0.1, 24]} />
        <meshStandardMaterial color="#C9971F" metalness={0.8} roughness={0.3} />
      </instancedMesh>
    </group>
  )
}
