import zlib from 'node:zlib'
import { WebSocket } from 'ws'

// --- Minimal, self-contained PNG encoder (RGB, no deps) ----------------------
function crc32(buf: Buffer): number {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return (~c) >>> 0
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}
function encodePng(w: number, h: number, rgb: Buffer): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type RGB
  const stride = 1 + w * 3
  const raw = Buffer.alloc(h * stride)
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0 // filter: none
    rgb.copy(raw, y * stride + 1, y * w * 3, (y + 1) * w * 3)
  }
  const idat = zlib.deflateSync(raw)
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// --- Animated frame: a coral block sweeping across a dark field ---------------
const W = 64
const H = 48
function renderFrame(seq: number): Buffer {
  const rgb = Buffer.alloc(W * H * 3)
  const bx = seq % W
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3
      const on = Math.abs(x - bx) < 6
      rgb[i] = on ? 255 : 10
      rgb[i + 1] = on ? 103 : 10
      rgb[i + 2] = on ? 80 : 10
    }
  }
  return encodePng(W, H, rgb)
}

// --- Connect as producer and push frames at ~15fps ---------------------------
const ORIGIN = process.env.PORTAL_ORIGIN ?? 'ws://localhost:5179'
const ws = new WebSocket(`${ORIGIN}/stream/demo-stream?role=producer`)
let seq = 0
ws.on('open', () => {
  console.log('[producer] connected, streaming demo-stream')
  const timer = setInterval(() => {
    if (ws.readyState !== ws.OPEN) {
      clearInterval(timer)
      return
    }
    const png = renderFrame(seq)
    ws.send(JSON.stringify({ type: 'frame', portalId: 'producer', w: W, h: H, seq }))
    ws.send(png)
    seq++
  }, 66)
})
ws.on('error', (e) => {
  console.error('[producer] error', e)
  process.exit(1)
})
