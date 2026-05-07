// Generates icon-192.png and icon-512.png for the PWA manifest.
// Run with: node scripts/generate-icons.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })();
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

function createIcon(size) {
  // Parchment bg, amber diamond, dark border — matches the game theme
  const bg = [0xf4, 0xec, 0xdf];
  const fill = [0xd8, 0x43, 0x15]; // #d84315 typewriter red
  const border = [0x3e, 0x27, 0x23]; // #3e2723 dark brown

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.34; // diamond radius
  const bw = size * 0.025; // border width

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = [0]; // PNG filter None
    for (let x = 0; x < size; x++) {
      const dx = Math.abs(x - cx) / r;
      const dy = Math.abs(y - cy) / r;
      const d = dx + dy;
      if (d <= 1) {
        row.push(...(d > 1 - bw ? border : fill));
      } else {
        row.push(...bg);
      }
    }
    rows.push(Buffer.from(row));
  }

  const compressed = zlib.deflateSync(Buffer.concat(rows));

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  // compression, filter, interlace = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createIcon(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createIcon(512));
console.log('Generated icon-192.png and icon-512.png');
