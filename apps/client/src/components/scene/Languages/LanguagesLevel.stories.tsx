import type { Meta, StoryObj, Decorator } from '@storybook/react-vite'
import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import type { WebGLRenderer } from 'three'
import LanguagesLevel from './LanguagesLevel'
import { withCanvas, withLevels } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'
import { brand } from '../../../styles/brand'

/**
 * Languages level: the five brand-colored logo GLBs. On wide aspects they form a
 * single 5-wide row; the Portrait story renders into a real ~390×844 canvas so the
 * responsive 3-column (2-row) reflow is exercised as a real-browser test.
 */
const meta = {
  title: 'Levels/LanguagesLevel',
  component: LanguagesLevel,
  decorators: [withLevels],
  parameters: {
    layout: 'fullscreen',
    levels: { index: 1 },
    a11y: { test: 'off' },
  },
  render: () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 5]} intensity={1.2} />
      <directionalLight position={[-3, -2, 4]} intensity={0.6} />
      <LanguagesLevel />
    </>
  ),
} satisfies Meta<typeof LanguagesLevel>

export default meta
type Story = StoryObj<typeof LanguagesLevel>

/** Wide aspect — a single 5-wide row. */
export const Default: Story = {
  decorators: [withCanvas],
  parameters: { canvas: { camera: [0, 0, 12] } },
  play: sceneSmokeTest,
}

/** A real ~390×844 phone canvas — exercises the 3-column, 2-row reflow. */
const portraitCanvas: Decorator = (Story) => (
  <div style={{ width: 390, height: 844, margin: '0 auto', background: brand.bg0 }}>
    <Canvas
      frameloop="always"
      camera={{ position: [0, 0, 12], fov: 50 }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.info.autoReset = false
        ;(gl.domElement as HTMLCanvasElement & { __r3fGl?: WebGLRenderer }).__r3fGl = gl
      }}
    >
      <Suspense fallback={null}>
        <Story />
      </Suspense>
    </Canvas>
  </div>
)

export const Portrait: Story = {
  decorators: [portraitCanvas],
  play: sceneSmokeTest,
}
