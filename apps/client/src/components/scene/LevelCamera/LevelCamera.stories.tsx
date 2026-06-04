import type { Meta, StoryObj } from '@storybook/react-vite'
import LevelCamera from './LevelCamera'
import { useLevels } from '../../../stores/useLevels'
import { withCanvas, withLevels } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Per-level camera framing (replaces the old continuous CameraRig descent): damps
 * the camera to the active level's authored position/target/fov, adds pointer
 * parallax, and dollies back on narrow viewports. Renders nothing; the active
 * level's framing is selected by `level` (interactive control → store index). A
 * reference grid + box is shown so the framing change is observable.
 */
type CameraArgs = { level: number }

const meta = {
  title: 'Levels/LevelCamera',
  component: LevelCamera,
  decorators: [withLevels, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 10] },
    a11y: { test: 'off' },
  },
  args: { level: 0 },
  argTypes: {
    level: {
      control: 'inline-radio',
      options: [0, 1, 2, 3],
      description: '0 hero · 1 languages · 2 otherWork · 3 hireMe',
    },
  },
  render: (args: CameraArgs) => {
    useLevels.setState({ index: args.level })
    return (
      <>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1} />
        <gridHelper args={[20, 20, '#ff6750', '#1a1a1f']} />
        <mesh>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <LevelCamera />
      </>
    )
  },
} satisfies Meta<CameraArgs>

export default meta
type Story = StoryObj<CameraArgs>

/** Hero framing (index 0). */
export const HeroFraming: Story = { args: { level: 0 }, play: sceneSmokeTest }
/** Languages framing (index 1) — the logo gallery camera. */
export const LanguagesFraming: Story = { args: { level: 1 }, play: sceneSmokeTest }
/** Other Work framing (index 2) — the portals level camera. */
export const OtherWorkFraming: Story = { args: { level: 2 }, play: sceneSmokeTest }
