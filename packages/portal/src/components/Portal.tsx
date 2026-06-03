import { useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { useAppPortal } from '../hooks/useAppPortal'
import { getPortalData } from '../data/PortalData'
import { PortalEdge } from './PortalEdge'
import { PortalFluid } from './PortalFluid'
import { PortalTransition } from './PortalTransition'
import { DomWindowPresenter } from './presenters/DomWindowPresenter'
import { TexturePresenter } from './presenters/TexturePresenter'
import { StencilPresenter } from './presenters/StencilPresenter'
import { VisibilityDriver } from './lib/VisibilityDriver'
import { selectPresenter } from './lib/selectPresenter'

interface Props {
  app: string
  providerOrigin: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  size?: [number, number]
  /** Native-world content (the registered guest's R3F subtree) for kind 'native'. */
  children?: ReactNode
}

/** Public portal object. Placed in any R3F scene, it negotiates and windows the
 *  registered guest `app`: dormant portals show PortalFluid (~0 cost); clicking
 *  engages, which warms the guest and mounts the presenter the provider negotiated
 *  (dom-window / texture / stencil), falling through to a poster so it's never
 *  blank — "always works no matter the situation". */
export function Portal({
  app,
  providerOrigin,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  size,
  children,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null)
  const data = getPortalData(app)
  const [w, h] = size ?? data?.defaultSize ?? [2, 2]
  const { id, state, transport, engage, notifyVisibility } = useAppPortal(app, providerOrigin)
  const [domWindowFailed, setDomWindowFailed] = useState(false)

  const live = state === 'live'
  const choice = live && transport ? selectPresenter(transport, { domWindowFailed }) : null

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef} onClick={engage}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <VisibilityDriver
        meshRef={meshRef}
        width={w}
        height={h}
        onOffscreen={() => notifyVisibility(false)}
        onOnscreen={() => notifyVisibility(true)}
      />
      <PortalEdge width={w} height={h} intensity={live ? 1.6 : 1} />
      {(!live || choice === 'poster') && <PortalFluid width={w} height={h} />}
      {state === 'warming' && <PortalTransition state={state} width={w} height={h} />}

      {choice === 'dom-window' && transport && (
        <DomWindowPresenter
          transport={transport}
          providerOrigin={providerOrigin}
          width={w}
          height={h}
          meshRef={meshRef}
          engaged={live}
          onError={() => setDomWindowFailed(true)}
        />
      )}
      {choice === 'texture' && transport && (
        <TexturePresenter
          transport={transport}
          providerOrigin={providerOrigin}
          portalId={id}
          width={w}
          height={h}
          engaged={live}
        />
      )}
      {choice === 'stencil' && <StencilPresenter width={w} height={h}>{children}</StencilPresenter>}
    </group>
  )
}
