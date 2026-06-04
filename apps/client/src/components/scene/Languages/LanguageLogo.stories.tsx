import type { Meta, StoryObj } from '@storybook/react-vite'
import LanguageLogo from './LanguageLogo'
import { languageById, languageOrder, languages } from '../../../data/languages'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * One brand-colored extruded tech-logo GLB with hover affordance. The `lang` control
 * cycles all five so every GLB + brand color is exercised as a real-browser test.
 */
type Args = { lang: string }

const meta = {
  title: 'Scene/Languages/LanguageLogo',
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 4] },
    a11y: { test: 'off' },
  },
  args: { lang: 'rust' },
  argTypes: {
    lang: {
      control: { type: 'select' },
      options: languageOrder,
      description: 'Which language logo to render.',
    },
  },
  render: ({ lang }: Args) => {
    const def = languageById(lang) ?? languages[0]
    return (
      <>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 5]} intensity={1.4} />
        <LanguageLogo lang={def} position={[0, 0, 0]} size={2.2} />
      </>
    )
  },
} satisfies Meta<Args>

export default meta
type Story = StoryObj<Args>

export const Rust: Story = { args: { lang: 'rust' }, play: sceneSmokeTest }
export const Python: Story = { args: { lang: 'python' }, play: sceneSmokeTest }
export const TypeScript: Story = { args: { lang: 'typescript' }, play: sceneSmokeTest }
export const Deno: Story = { args: { lang: 'deno' }, play: sceneSmokeTest }
export const WebAssembly: Story = { args: { lang: 'webassembly' }, play: sceneSmokeTest }
