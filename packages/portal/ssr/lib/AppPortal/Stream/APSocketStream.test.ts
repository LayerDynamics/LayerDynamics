import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer, type Server } from 'node:http'
import { WebSocket } from 'ws'
import { attachStreamSocket } from './APSocketStream'
import { AppPortalManager } from '../../AppPortal/AppPortalManager'

let server: Server
let port: number

beforeAll(
  () =>
    new Promise<void>((resolve) => {
      server = createServer()
      attachStreamSocket(server, new AppPortalManager())
      server.listen(0, () => {
        port = (server.address() as { port: number }).port
        resolve()
      })
    }),
)
afterAll(() => new Promise<void>((r) => server.close(() => r())))

function once(ws: WebSocket, ev: string): Promise<unknown> {
  return new Promise((res) => ws.once(ev, res))
}

describe('APSocketStream', () => {
  it('relays a producer frame to a consumer for a registered app', async () => {
    const producer = new WebSocket(`ws://localhost:${port}/stream/demo-stream?role=producer`)
    const consumer = new WebSocket(`ws://localhost:${port}/stream/demo-stream?role=consumer`)
    await Promise.all([once(producer, 'open'), once(consumer, 'open')])
    const got = new Promise((res) => consumer.on('message', (d) => res(d.toString())))
    producer.send(JSON.stringify({ type: 'frame', portalId: 'p1', w: 4, h: 4, seq: 1 }))
    expect(JSON.parse((await got) as string)).toMatchObject({ type: 'frame', seq: 1 })
    producer.close()
    consumer.close()
  })

  it('forwards consumer input back to the producer', async () => {
    const producer = new WebSocket(`ws://localhost:${port}/stream/demo-stream?role=producer`)
    const consumer = new WebSocket(`ws://localhost:${port}/stream/demo-stream?role=consumer`)
    await Promise.all([once(producer, 'open'), once(consumer, 'open')])
    const got = new Promise((res) => producer.on('message', (d) => res(d.toString())))
    consumer.send(JSON.stringify({ type: 'input', portalId: 'p1', event: { kind: 'pointerdown', x: 0.5, y: 0.5 } }))
    expect(JSON.parse((await got) as string)).toMatchObject({ type: 'input' })
    producer.close()
    consumer.close()
  })

  it('refuses an unregistered stream id with close code 1008', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/stream/evil`)
    const code = await new Promise((res) => ws.on('close', (c) => res(c)))
    expect(code).toBe(1008)
  })
})
