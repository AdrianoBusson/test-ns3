const crypto = require('crypto');

// cuckoo filter
function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}
function hash64FromString(str) {
  const d = sha256(Buffer.from(str, 'utf8'));
  // 8 bytes big-endian
  let x = 0n;
  for (let i = 0; i < 8; i++) x = (x << 8n) | BigInt(d[i]);
  return x;
}
function uint32FromDigest(d, offset) {
  return (
    ((d[offset] << 24) >>> 0) |
    (d[offset + 1] << 16) |
    (d[offset + 2] << 8) |
    d[offset + 3]
  ) >>> 0;
}
function fingerprint32FromString(str) {
  const d = sha256(Buffer.from(str, 'utf8'));
  let fp = uint32FromDigest(d, 8); // pega bytes 8..11
  if (fp === 0) fp = 1; // 0 é "vazio"
  return fp >>> 0;
}
function hash32FromUint32(u) {
  // Mistura simples (xorshift-ish) para espalhar o fp nos buckets
  let x = u >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}
function idx1(hash64, mask) {
  // mask é numBuckets-1 (potência de 2)
  return Number(hash64 & BigInt(mask)) >>> 0;
}
function idx2(i1, fp, mask) {
  const h = hash32FromUint32(fp) & mask;
  return (i1 ^ h) >>> 0;
}

function randomInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

module.exports = { sha256, hash64FromString, uint32FromDigest, fingerprint32FromString, 
    hash32FromUint32, idx1,idx2, randomInt
 };