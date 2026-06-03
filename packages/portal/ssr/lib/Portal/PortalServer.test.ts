import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer, type Server } from 'node:http'
import { WebSocket } from 'ws'
import { attachPortalSocket } from './PortalServer'

let server: Server
let port: number

beforeAll(
  () =>
    new Promise<void>((resolve) => {
      server = createServer()
      attachPortalSocket(server)
      server.listen(0, () => {
        port = (server.address() as { port: number }).port
        resolve()
      })
    }),
)
afterAll(() => new Promise<void>((r) => server.close(() => r())))

function connect(): WebSocket {
  return new WebSocket(`ws://localhost:${port}/portal/p1`)
}
function nextMessage(ws: WebSocket): Promise<unknown> {
  return new Promise((res) => ws.once('message', (d) => res(JSON.parse(d.toString()))))
}

describe('PortalServer WS lifecycle channel', () => {
  it('warm on a registered app replies state:live', async () => {
    const ws = connect()
    await new Promise((r) => ws.once('open', r))
    const reply = nextMessage(ws)
    ws.send(JSON.stringify({ type: 'warm', portalId: 'p1', appId: 'demo-static' }))
    expect(await reply).toEqual({ type: 'state', portalId: 'p1', state: 'live' })
    ws.close()
  })

  it('warm on an unregistered app replies error', async () => {
    const ws = connect()
    await new Promise((r) => ws.once('open', r))
    const reply = nextMessage(ws)
    ws.send(JSON.stringify({ type: 'warm', portalId: 'p2', appId: 'evil' }))
    expect(await reply).toMatchObject({ type: 'error', portalId: 'p2' })
    ws.close()
  })

  it('drops malformed (non-contract) messages without replying', async () => {
    const ws = connect()
    await new Promise((r) => ws.once('open', r))
    let got = false
    ws.on('message', () => { got = true })
    ws.send(JSON.stringify({ type: 'nonsense', foo: 1 }))
    await new Promise((r) => setTimeout(r, 80))
    expect(got).toBe(false)
    ws.close()
  })
})
