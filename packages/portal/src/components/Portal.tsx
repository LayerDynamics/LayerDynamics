import { useRef } from 'react'
import * as THREE from 'three'
import { useAppPortal } from '../hooks/useAppPortal'
import { getPortalData } from '../data/PortalData'
import { PortalEdge } from './PortalEdge'
import { PortalFluid } from './PortalFluid'
import { DomWindowPresenter } from './presenters/DomWindowPresenter'

interface Props {
  app: string
  providerOrigin: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  size?: [number, number]
}

/** Public portal object. Placed in any R3F scene, it negotiates and windows the
 *  registered guest `app`: dormant portals show PortalFluid (~0 cost); clicking
 *  engages, which warms the guest and mounts its presenter. */
export function Portal({ app, providerOrigin, position = [0, 0, 0], rotation = [0, 0, 0], size }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)
  const data = getPortalData(app)
  const [w, h] = size ?? data?.defaultSize ?? [2, 2]
  const { state, transport, engage } = useAppPortal(app, providerOrigin)

  const live = state === 'live'

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef} onClick={engage}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <PortalEdge width={w} height={h} intensity={live ? 1.6 : 1} />
      {!live && <PortalFluid width={w} height={h} />}
      {live && transport?.transport === 'dom-window' && (
        <DomWindowPresenter
          transport={transport}
          providerOrigin={providerOrigin}
          width={w}
          height={h}
          meshRef={meshRef}
          engaged={live}
        />
      )}
    </group>
  )
}
