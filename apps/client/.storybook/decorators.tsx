import { Suspense, useEffect, type ReactNode } from 'react'
import type { Decorator } from '@storybook/react-vite'
import { Canvas } from '@react-three/fiber'
import { ScrollControls } from '@react-three/drei'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useGLTF } from '@react-three/drei'
import { useScene } from '../src/stores/useScene'
import { useLevels } from '../src/stores/useLevels'
import { brand } from '../src/styles/brand'

/**
 * Point drei's GLTF loader at the self-hosted Draco decoder (public/draco/)
 * instead of the default gstatic CDN, so stories load Draco-compressed models
 * headless/offline without hanging in Suspense (Risk R2).
 */
useGLTF.setDecoderPath('/draco/')

/* ------------------------------------------------------------------ router */

/**
 * Wrap a DOM story in a MemoryRouter so components using `Link`/`useNavigate`/
 * `useParams` work. Honors the cross-Canvas rule: router context stays on the
 * DOM side and is never mounted inside `<Canvas>`.
 *
 * Pass `parameters.router` per story:
 *   { initialEntries?: string[], path?: string }
 * When `path` is set the story is mounted under a matching <Route> so
 * `useParams()` resolves (e.g. path '/projects/:id', initialEntries ['/projects/portal']).
 */
export const withRouter: Decorator = (Story, ctx) => {
  const router = (ctx.parameters.router ?? {}) as {
    initialEntries?: string[]
    path?: string
  }
  const entries = router.initialEntries ?? ['/']
  if (router.path) {
    return (
      <MemoryRouter initialEntries={entries}>
        <Routes>
          <Route path={router.path} element={<Story />} />
        </Routes>
      </MemoryRouter>
    )
  }
  return (
    <MemoryRouter initialEntries={entries}>
      <Story />
    </MemoryRouter>
  )
}

/* ------------------------------------------------------------------- store */

const STORE_INITIAL = useScene.getState()

/**
 * Seed the zustand scene store before render and reset it to the module's
 * initial state on unmount, so a story's store mutations never leak into the
 * next story. Pass `parameters.scene` with any subset of the store's data
 * fields (ready/section/hovered/lens/contactY/reducedMotion).
 */
export const withStore: Decorator = (Story, ctx) => {
  const seed = (ctx.parameters.scene ?? {}) as Partial<{
    ready: boolean
    section: typeof STORE_INITIAL.section
    hovered: string | null
    lens: typeof STORE_INITIAL.lens
    contactY: number
    reducedMotion: boolean
  }>
  // Apply synchronously for the first render (before the tree reads the store).
  useScene.setState(seed)
  useEffect(() => {
    useScene.setState(seed)
    return () => {
      useScene.setState({
        ready: STORE_INITIAL.ready,
        section: STORE_INITIAL.section,
        hovered: STORE_INITIAL.hovered,
        lens: STORE_INITIAL.lens,
        contactY: STORE_INITIAL.contactY,
        reducedMotion: STORE_INITIAL.reducedMotion,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <Story />
}

/* ------------------------------------------------------------- levels store */

const LEVELS_INITIAL = useLevels.getState()

/**
 * Seed the level-orchestrator store (useLevels) before render and reset it on
 * unmount, so level stories can pin a specific active level / phase. Pass
 * `parameters.levels` with any subset of { index, phase, direction, locked,
 * swapped, reducedMotion }.
 */
export const withLevels: Decorator = (Story, ctx) => {
  const seed = (ctx.parameters.levels ?? {}) as Partial<{
    index: number
    phase: typeof LEVELS_INITIAL.phase
    direction: typeof LEVELS_INITIAL.direction
    locked: boolean
    swapped: boolean
    reducedMotion: boolean
  }>
  useLevels.setState(seed)
  useEffect(() => {
    useLevels.setState(seed)
    return () => {
      useLevels.setState({
        index: LEVELS_INITIAL.index,
        phase: LEVELS_INITIAL.phase,
        direction: LEVELS_INITIAL.direction,
        locked: LEVELS_INITIAL.locked,
        swapped: LEVELS_INITIAL.swapped,
        reducedMotion: LEVELS_INITIAL.reducedMotion,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <Story />
}

/* ------------------------------------------------------------------ canvas */

interface CanvasOpts {
  /** drei ScrollControls; number = pages, or full options. Omit to skip. */
  scroll?: number | { pages: number; damping?: number }
  /** Initial camera position. Default [0, 0, 6]. */
  camera?: [number, number, number]
  /** Fixed pixel height for deterministic framing. Default 480. */
  height?: number
}

function CanvasFrame({ children, opts }: { children: ReactNode; opts: CanvasOpts }) {
  const scroll =
    typeof opts.scroll === 'number' ? { pages: opts.scroll } : opts.scroll
  const body = scroll ? (
    <ScrollControls pages={scroll.pages} damping={scroll.damping ?? 0.2}>
      {children}
    </ScrollControls>
  ) : (
    children
  )
  return (
    <div style={{ width: '100%', height: opts.height ?? 480, background: brand.bg0 }}>
      <Canvas
        frameloop="always"
        camera={{ position: opts.camera ?? [0, 0, 6], fov: 50 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          // Accumulate render stats (don't reset per frame) so sceneSmokeTest can
          // assert the scene actually drew something (cumulative
          // gl.info.render.calls > 0) without racing a single frame — catches
          // off-screen/blank framings that a "canvas present" check would pass.
          gl.info.autoReset = false
          ;(gl.domElement as HTMLCanvasElement & { __r3fGl?: typeof gl }).__r3fGl = gl
        }}
      >
        <Suspense fallback={null}>{body}</Suspense>
      </Canvas>
    </div>
  )
}

/**
 * Mount an R3F story inside a real `<Canvas frameloop="always">` (animations
 * play). Reads `parameters.canvas` (CanvasOpts) for camera/scroll/height, e.g.
 *   parameters: { canvas: { scroll: 4, camera: [0, 0, 10] } }
 *
 * Stories that need lights should render them in the story body; this decorator
 * only provides the Canvas (+ optional ScrollControls) shell.
 */
export const withCanvas: Decorator = (Story, ctx) => {
  const opts = (ctx.parameters.canvas ?? {}) as CanvasOpts
  return (
    <CanvasFrame opts={opts}>
      <Story />
    </CanvasFrame>
  )
}
