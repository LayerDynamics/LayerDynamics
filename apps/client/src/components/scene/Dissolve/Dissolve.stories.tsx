import type { Meta, StoryObj } from '@storybook/react-vite'
import { useMemo } from 'react'
import { TorusKnotGeometry } from 'three'
import { Center, Resize } from '@react-three/drei'
import { DissolvingMesh, DissolvingGLTF } from '@layerdynamics/dissolving-mesh'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * The `@layerdynamics/dissolving-mesh` erosion effect: a mesh disintegrates into rigid
 * per-triangle flakes that fly outward and burn at the dissolving edge. Two stories:
 *  - **Primitive** drives a `TorusKnotGeometry` through `DissolvingMesh`.
 *  - **Gltf** loads a real GLB (`LayerDynamicsLogo.glb`) through `DissolvingGLTF`, with
 *    the asset's PBR material preserved.
 *
 * `progress` is a controlled 0..1 scrub so each story renders a deterministic
 * mid-dissolve frame for the real-browser smoke test (it still issues draw calls when
 * fully dissolved). Set `progress` to `undefined` in the UI to watch it auto-play.
 */
interface Args {
  progress: number
  scatter: number
  spin: number
  edgeWidth: number
  color: string
  edgeColor: string
  edgeStrength: number
}

const meta = {
  title: 'Scene/Dissolve',
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 5] },
    a11y: { test: 'off' },
  },
  args: {
    progress: 0.45,
    scatter: 2.2,
    spin: 3,
    edgeWidth: 0.15,
    color: '#9bb4ff',
    edgeColor: '#ff5a1f',
    edgeStrength: 2.5,
  },
  argTypes: {
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    scatter: { control: { type: 'range', min: 0, max: 5, step: 0.1 } },
    spin: { control: { type: 'range', min: 0, max: 8, step: 0.1 } },
    edgeWidth: { control: { type: 'range', min: 0.02, max: 0.5, step: 0.01 } },
    edgeStrength: { control: { type: 'range', min: 0, max: 6, step: 0.1 } },
    color: { control: { type: 'color' } },
    edgeColor: { control: { type: 'color' } },
  },
} satisfies Meta<Args>

export default meta
type Story = StoryObj<Args>

function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 5, 6]} intensity={2.4} />
      <pointLight position={[-5, -3, -2]} intensity={20} color="#3355ff" />
    </>
  )
}

function PrimitiveScene(args: Args) {
  const geometry = useMemo(() => new TorusKnotGeometry(1, 0.32, 200, 28), [])
  return (
    <>
      <Lights />
      <DissolvingMesh
        geometry={geometry}
        progress={args.progress}
        scatter={args.scatter}
        spin={args.spin}
        edgeWidth={args.edgeWidth}
        color={args.color}
        edgeColor={args.edgeColor}
        edgeStrength={args.edgeStrength}
        metalness={0.2}
        roughness={0.4}
      />
    </>
  )
}

export const Primitive: Story = {
  render: (args) => <PrimitiveScene {...args} />,
  play: sceneSmokeTest,
}

export const Gltf: Story = {
  args: { color: '#7ad7ff', edgeColor: '#ff3ca0', scatter: 1.8, spin: 2.5 },
  render: (args) => (
    <>
      <Lights />
      <Center>
        <group scale={3.5}>
          <Resize>
            <DissolvingGLTF
              url="/assets/objects/LayerDynamicsLogo.glb"
              progress={args.progress}
              scatter={args.scatter}
              spin={args.spin}
              edgeWidth={args.edgeWidth}
              color={args.color}
              edgeColor={args.edgeColor}
              edgeStrength={args.edgeStrength}
            />
          </Resize>
        </group>
      </Center>
    </>
  ),
  play: sceneSmokeTest,
}
