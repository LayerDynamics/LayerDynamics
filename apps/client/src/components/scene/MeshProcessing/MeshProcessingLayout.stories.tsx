import { useMemo, useRef } from 'react'
import {
  BufferGeometry,
  Color,
  IcosahedronGeometry,
  ShaderMaterial,
  type Group,
  type Mesh,
  type Points,
} from 'three'
import type { Meta, StoryObj } from '@storybook/react-vite'
import MeshProcessingLayout, { type MeshProcessingLayoutProps } from './MeshProcessingLayout'
import { brand } from '../../../styles/brand'
import { STAGES } from './constants'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Presentational mesh-processing scene graph: the point system, the solid +
 * wireframe meshes, and the heading/stage captions. The container builds the
 * real point geometry + dissolve shader and drives the refs per-frame; this story
 * supplies faithful fixtures (a sampled point geometry + a minimal points shader)
 * and pins the active `stage`. The Container story exercises the real pipeline.
 */
const meta = {
  title: 'Scene/MeshProcessing/MeshProcessingLayout',
  component: MeshProcessingLayout,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 5.5] },
    a11y: { test: 'off' },
  },
  args: { stage: 0 },
  argTypes: {
    stage: {
      control: { type: 'range', min: 0, max: STAGES.length - 1, step: 1 },
      description: 'Active pipeline-stage index → caption.',
    },
    holdRef: { control: false },
    spinRef: { control: false },
    pointsRef: { control: false },
    solidRef: { control: false },
    wireRef: { control: false },
    pointGeo: { control: false },
    material: { control: false },
    source: { control: false },
    violet: { control: false },
  },
} satisfies Meta<typeof MeshProcessingLayout>

export default meta
type Story = StoryObj<MeshProcessingLayoutProps>

const render = function Render(args: MeshProcessingLayoutProps) {
    const holdRef = useRef<Group | null>(null)
    const spinRef = useRef<Group | null>(null)
    const pointsRef = useRef<Points | null>(null)
    const solidRef = useRef<Mesh | null>(null)
    const wireRef = useRef<Mesh | null>(null)

    const { source, pointGeo, material, violet } = useMemo(() => {
      const source = new IcosahedronGeometry(1.4, 4)
      const pointGeo = new BufferGeometry()
      pointGeo.setAttribute('position', source.getAttribute('position'))
      const violet = new Color(brand.violet)
      const material = new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uColor: { value: violet } },
        vertexShader: /* glsl */ `
          void main() {
            gl_PointSize = 2.4;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          void main() { gl_FragColor = vec4(uColor, 0.85); }
        `,
      })
      return { source, pointGeo, material, violet }
    }, [])

    return (
      <>
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 5]} intensity={1.1} />
        {/* MeshProcessingLayout parks its hold group at SCENE.collectionY (−12);
            lift it back to the origin so the story camera frames it (same offset
            ProcessingLevel applies in the app). */}
        <group position={[0, 12, 0]}>
          <MeshProcessingLayout
            holdRef={holdRef}
            spinRef={spinRef}
            pointsRef={pointsRef}
            solidRef={solidRef}
            wireRef={wireRef}
            pointGeo={pointGeo}
            material={material}
            source={source}
            violet={violet}
            stage={args.stage}
          />
        </group>
      </>
    )
}

export const Default: Story = { render, play: sceneSmokeTest }

/** Final pipeline stage caption. */
export const FinalStage: Story = {
  args: { stage: STAGES.length - 1 },
  render,
  play: sceneSmokeTest,
}
