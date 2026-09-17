const crypto = require("crypto");


const running = () => {
  const PONTOS = ['|', '/', '-', '\\'];
  let i = 0;

  return setInterval(() => {
    // Imprime o caractere e usa \r para voltar ao início da linha
    process.stdout.write(`\rProcessando... ${PONTOS[i++]}`);
    i %= PONTOS.length;
  }, 100); // Velocidade da animação em milissegundos
};

/**
 * Utilidades BigInt
 */

function mod(a, n) {
  const r = a % n;
  return r >= 0n ? r : r + n;
}

function modPow(base, exp, modulus) {
  if (modulus === 1n) return 0n;

  let result = 1n;
  base = mod(base, modulus);

  while (exp > 0n) {
    if (exp & 1n) result = mod(result * base, modulus);
    exp >>= 1n;
    base = mod(base * base, modulus);
  }

  return result;
}

function randomBigIntBelow(n) {
  if (n <= 0n) throw new Error("n deve ser positivo");

  const bitLength = n.toString(2).length;
  const byteLength = Math.ceil(bitLength / 8);

  while (true) {
    const bytes = crypto.randomBytes(byteLength);
    let x = BigInt("0x" + bytes.toString("hex"));
    if (x < n) return x;
  }
}

function randomBigIntBetween(min, maxInclusive) {
  if (min > maxInclusive) throw new Error("intervalo inválido");
  return min + randomBigIntBelow(maxInclusive - min + 1n);
}

function sha256BigInt(...parts) {
  const h = crypto.createHash("sha256");

  for (const part of parts) {
    if (typeof part === "bigint") {
      h.update(part.toString(16));
    } else if (typeof part === "string") {
      h.update(part, "utf8");
    } else if (Buffer.isBuffer(part)) {
      h.update(part);
    } else {
      h.update(JSON.stringify(part));
    }

    h.update("|");
  }

  return BigInt("0x" + h.digest("hex"));
}

function hashToZq(message, r, q) {
  return mod(sha256BigInt(message, r), q);
}

/**
 * Miller-Rabin probabilístico para BigInt.
 * Suficiente para demonstração.
 */

function isProbablePrime(n, rounds = 40) {
  if (n < 2n) return false;

  const smallPrimes = [
    2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n
  ];

  for (const p of smallPrimes) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }

  let d = n - 1n;
  let s = 0n;

  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }

  for (let i = 0; i < rounds; i++) {
    const a = randomBigIntBetween(2n, n - 2n);
    let x = modPow(a, d, n);

    if (x === 1n || x === n - 1n) continue;

    let witness = true;

    for (let r = 1n; r < s; r++) {
      x = modPow(x, 2n, n);

      if (x === n - 1n) {
        witness = false;
        break;
      }
    }

    if (witness) return false;
  }

  return true;
}

function randomOddBigInt(bits) {
  const bytes = crypto.randomBytes(Math.ceil(bits / 8));
  let x = BigInt("0x" + bytes.toString("hex"));

  x |= 1n; // ímpar
  x |= 1n << BigInt(bits - 1); // garante tamanho em bits

  return x;
}

function generateSafePrime(bits) {
  if (bits < 64) throw new Error("use pelo menos 64 bits para teste");
 
  while (true) {   
 
    const q = randomOddBigInt(bits - 1);
    if (!isProbablePrime(q)) continue;

    const p = 2n * q + 1n;
    if (isProbablePrime(p)) return { p, q };
  }
}

/**
 * Gera um gerador g do subgrupo QR_p de ordem q.
 * Como p = 2q + 1, escolhemos a aleatório e usamos g = a^2 mod p.
 */
function findGeneratorQR(p, q) {
  while (true) {
    const a = randomBigIntBetween(2n, p - 2n);
    const g = modPow(a, 2n, p);

    if (g !== 1n && modPow(g, q, p) === 1n) {
      return g;
    }
  }
}

/**
 * 1. Geração de chaves
 *
 * Documento:
 * p = 2q + 1, g gerador do subgrupo de resíduos quadráticos,
 * x secreto em [1, q - 1],
 * y = g^x mod p.
 */

//#@!
function generateKeys(bits) {

    console.log(`Gerando números primos seguros com ${bits} bits (isso pode levar alguns segundos)...`);

  const { p, q } = generateSafePrime(bits);
  const g = findGeneratorQR(p, q);
  console.log(("Gerando chaves..."));
  const x = randomBigIntBetween(1n, q - 1n);
  console.log("Chaves geradas com sucesso.");
  const y = modPow(g, x, p);

  return {
    publicKey: {
      p: p.toString(),
      q: q.toString(),
      g: g.toString(),
      y: y.toString()
    },
    privateKey: x.toString()
    
  };
}

/**
 * 2. Geração do hash camaleão a partir de um texto
 *
 * e = H(m, r)
 * C = r - (y^e * g^s mod p) mod q
 */
function chameleonHash(publicKey, message) {
  const p = BigInt(publicKey.p);
  const q = BigInt(publicKey.q);
  const g = BigInt(publicKey.g);
  const y = BigInt(publicKey.y);

  const r = randomBigIntBelow(q);
  const s = randomBigIntBelow(q);

  const e = hashToZq(message, r, q);

  const ye = modPow(y, e, p);
  const gs = modPow(g, s, p);
  const term = mod(ye * gs, p);

  const C = mod(r - term, q);

  return {
    hash: C.toString(),
    message,
    r: r.toString(),
    s: s.toString()
  };
}

/**
 * Função interna para recalcular o hash de uma abertura.
 */
function computeHash(publicKey, message, rValue, sValue) {
  const p = BigInt(publicKey.p);
  const q = BigInt(publicKey.q);
  const g = BigInt(publicKey.g);
  const y = BigInt(publicKey.y);

  const r = BigInt(rValue);
  const s = BigInt(sValue);

  const e = hashToZq(message, r, q);

  const ye = modPow(y, e, p);
  const gs = modPow(g, s, p);
  const term = mod(ye * gs, p);

  return mod(r - term, q);
}

/**
 * 3. Geração de colisão
 *
 * Dado C, nova mensagem m', e chave secreta x:
 *
 * escolhe k' aleatório
 * r' = C + (g^k' mod p) mod q
 * e' = H(m', r')
 * s' = k' - e'x mod q
 *
 * Então:
 * Hash(m, r, s) = Hash(m', r', s')
 */
function generateCollision(publicKey, privateKey, originalHash, newMessage) {
  const p = BigInt(publicKey.p);
  const q = BigInt(publicKey.q);
  const g = BigInt(publicKey.g);
  const x = BigInt(privateKey);
  const C = BigInt(originalHash);

  const k = randomBigIntBetween(1n, q - 1n);

  const gk = modPow(g, k, p);
  const rPrime = mod(C + gk, q);

  const ePrime = hashToZq(newMessage, rPrime, q);
  const sPrime = mod(k - ePrime * x, q);

  return {
    hash: C.toString(),
    message: newMessage,
    r: rPrime.toString(),
    s: sPrime.toString()
  };
}

/**
 * 4. Verificação da validade do hash camaleão
 *
 * Verifica se a abertura (message, r, s) produz o hash C.
 */
function verifyChameleonHash(publicKey, expectedHash, message, r, s) {
  const computed = computeHash(publicKey, message, r, s);
  return computed === BigInt(expectedHash);
}



/**
 * Exemplo de uso:
 *
 * node chameleon-hash.js
 */
if (require.main === module) {
  const { publicKey, privateKey } = generateKeys(256);

  const original = chameleonHash(publicKey, "Texto original");
  console.log("Hash original:", original.hash);

  const okOriginal = verifyChameleonHash(
    publicKey,
    original.hash,
    original.message,
    original.r,
    original.s
  );

  console.log("Original válido?", okOriginal);

  const collision = generateCollision(
    publicKey,
    privateKey,
    original.hash,
    "Outro texto com colisão"
  );

  console.log("Hash da colisão:", collision.hash);

  const okCollision = verifyChameleonHash(
    publicKey,
    original.hash,
    collision.message,
    collision.r,
    collision.s
  );

  console.log("Colisão válida?", okCollision);

  console.log({
    publicKey,
    original,
    collision
  });
}

/**
 * Exportação
 */
module.exports = {
  generateKeys,
  chameleonHash,
  generateCollision,
  verifyChameleonHash,
  computeHash
};
