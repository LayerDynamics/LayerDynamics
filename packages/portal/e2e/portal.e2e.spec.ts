import { test, expect, type Page, type FrameLocator } from '@playwright/test'

// The ?e2e harness renders one centered portal (demo-static) with no orbit
// controls, so clicking the canvas centre engages it. The debug overlay is the
// readiness signal: it lists the portal and its live-cycle state.

/** Load the harness, engage the portal, and return the live guest frame. */
async function engagePortal(page: Page): Promise<FrameLocator> {
  await page.goto('/?e2e')
  const overlay = page.locator('[data-testid="portal-debug-overlay"]')
  // Wait until React has mounted and registered the portal (dormant).
  await expect(overlay).toContainText('demo-static', { timeout: 20_000 })
  // Let the R3F canvas render a frame so the portal mesh is raycastable.
  await page.waitForTimeout(800)
  // Engage: clicking the canvas centre raycasts onto the portal mesh, warming the
  // guest over the real WS lifecycle channel and mounting its iframe.
  await page.locator('canvas').click()
  await expect(overlay).toContainText('live', { timeout: 20_000 })
  await expect(page.locator('iframe')).toBeVisible({ timeout: 20_000 })
  return page.frameLocator('iframe')
}

test('a registered cross-origin app is interactive in place inside the 3D scene', async ({ page }) => {
  const guest = await engagePortal(page)

  // Real interaction #1: clicking the guest's button increments its own counter.
  await guest.locator('#b').click()
  await expect(guest.locator('#n')).toHaveText('1')
  await guest.locator('#b').click()
  await expect(guest.locator('#n')).toHaveText('2')

  // Real interaction #2: typing into the guest's input updates its output.
  await guest.locator('#t').fill('hello portal')
  await expect(guest.locator('#out')).toHaveText('hello portal')
})

test('the windowed content is the real app served same-origin (no mock)', async ({ page }) => {
  const guest = await engagePortal(page)
  // The fixture app's real markup is present — proves the full serve/proxy chain.
  await expect(guest.locator('#b')).toContainText('clicks:')
})
