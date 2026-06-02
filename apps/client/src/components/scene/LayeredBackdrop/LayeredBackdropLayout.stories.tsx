import { useMemo, useRef } from 'react'
import { CanvasTexture, type Group } from 'three'
import type { Meta, StoryObj } from '@storybook/react-vite'
import LayeredBackdropLayout from './LayeredBackdropLayout'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Presentational backdrop: the drifting starfield plus a soft radial halo behind
 * the hero. The container parallax-shifts the group and supplies a radial-gradient
 * glow texture — here the story builds an equivalent CanvasTexture so the halo
 * renders standalone.
 */
function useGlowTexture() {
  return useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, 'rgba(134, 59, 255, 0.9)')
    grad.addColorStop(0.5, 'rgba(126, 20, 255, 0.35)')
    grad.addColorStop(1, 'rgba(11, 10, 20, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    const tex = new CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])
}

const meta = {
  title: 'Scene/LayeredBackdrop/LayeredBackdropLayout',
  component: LayeredBackdropLayout,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 2, 8] },
    a11y: { test: 'off' },
  },
  args: { glowOpacity: 0.32, glowSize: 19 },
  argTypes: {
    glowOpacity: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    glowSize: { control: { type: 'range', min: 4, max: 40, step: 1 } },
    groupRef: { control: false },
    glow: { control: false },
    glowPosition: { control: 'object' },
  },
} satisfies Meta<typeof LayeredBackdropLayout>

export default meta
type Story = StoryObj<typeof LayeredBackdropLayout>

export const Default: Story = {
  render: function Render(args) {
    const groupRef = useRef<Group | null>(null)
    const glow = useGlowTexture()
    return (
      <LayeredBackdropLayout
        groupRef={groupRef}
        glow={glow}
        glowOpacity={args.glowOpacity}
        glowSize={args.glowSize}
        glowPosition={args.glowPosition}
      />
    )
  },
  play: sceneSmokeTest,
}
