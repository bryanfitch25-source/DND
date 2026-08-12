// Generates the app's home-screen icons as plain PNG files, with no image
// library dependency (just Node's built-in zlib for the PNG's DEFLATE
// stream). Run once via `node scripts/generate-icons.js`; output is
// checked into public/ since it never needs to change unless the icon
// design does.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const BLOOD = [0x7a, 0x1f, 0x1f];
const PARCHMENT = [0xe8, 0xdf, 0xc8];
const INK = [0x1b, 0x17, 0x12];

function buildCrcTable() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c;
  }
  return t;
}

const CRC_TABLE = buildCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/** Draws a simple emblem: blood-red square, parchment diamond in the
 * middle, thin ink border -- an abstract wax-seal / RPG-shield mark. */
function pixelColor(x, y, size) {
  const cx = size / 2;
  const cy = size / 2;
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);
  const diamond = dx / (size * 0.34) + dy / (size * 0.34);

  const borderWidth = size * 0.045;
  const isBorder = x < borderWidth || y < borderWidth || x >= size - borderWidth || y >= size - borderWidth;

  if (isBorder) return INK;
  if (diamond <= 1) return PARCHMENT;
  if (diamond <= 1.08) return INK; // thin outline around the diamond
  return BLOOD;
}

function generatePng(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let offset = 0;
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0; // filter type: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixelColor(x, y, size);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 9 });

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, "..", "public");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const targets = [
  ["apple-touch-icon.png", 180],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
];

for (const [filename, size] of targets) {
  fs.writeFileSync(path.join(outDir, filename), generatePng(size));
  console.log(`wrote public/${filename} (${size}x${size})`);
}
