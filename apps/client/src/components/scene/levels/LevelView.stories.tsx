import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import LevelView, { type LevelCallbacks } from './LevelView'
import type { LevelId } from '../../../stores/useLevels'
import { setScroll } from '../../../stores/levelScroll'
import { withCanvas, withLevels } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

const cb: LevelCallbacks = { onOpen: fn(), onHire: fn() }

/**
 * Maps the active level id → its component (the id→component switch lives here so
 * the orchestrator stays generic). One story per level id renders that level in
 * isolation, exactly as LevelStage mounts it.
 */
const meta = {
  title: 'Levels/LevelView',
  component: LevelView,
  decorators: [withLevels, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 10] },
    a11y: { test: 'off' },
  },
  argTypes: {
    id: { control: 'inline-radio', options: ['hero', 'processing', 'otherWork', 'hireMe'] satisfies LevelId[] },
    cb: { control: false },
  },
} satisfies Meta<typeof LevelView>

export default meta
type Story = StoryObj<typeof LevelView>

function lit(id: LevelId): Story {
  return {
    args: { id, cb },
    render: (args) => {
      setScroll(0)
      return (
        <>
          <ambientLight intensity={0.6} />
          <pointLight position={[4, 4, 6]} intensity={50} distance={30} />
          <directionalLight position={[2, 3, 5]} intensity={1} />
          <LevelView {...args} />
        </>
      )
    },
    play: sceneSmokeTest,
  }
}

export const Hero = lit('hero')
export const Processing = lit('processing')
export const OtherWork = lit('otherWork')
export const HireMe = lit('hireMe')
