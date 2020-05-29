const ElGamal = require('elgamal');
const bigInt = require("big-integer");

const NUMBER_BITS = 512;
const MESSAGE = "Hola, com va tot?";

let elgamal, p, g, q, xa, ya, r, messageSent, c1, c2;
let c, s, xb, yb, z1, z2;
let w;

const generate = async () => {
  // VARIABLES FOR CREATE()
  // Generation of p, g, q of ElGamal algorithm
  elgamal = await ElGamal.default.generateAsync(NUMBER_BITS);
  p = bigInt(elgamal.p.toString());
  g = bigInt(elgamal.g.toString());
  q = p.minus(1).divide(2);

  // Generation of xa, ya, private and public keys of A
  // ya = g^xa mod p
  xa = bigInt.randBetween(2, q.minus(1));
  ya = g.modPow(xa, p);

  // Generation of random number r
  r = bigInt.randBetween(2, q.minus(1));

  let messageSentBuffer = Buffer.from(MESSAGE, 'utf8');
  messageSent = bigInt(messageSentBuffer.toString('hex'), 16);

  // Generation of C1 = g^r mod p
  c1 = g.modPow(r, p);

  // Generation of C2 = m·ya^r mod p
  c2 = messageSent.multiply(ya.modPow(r, p));

  // VARIABLES FOR ACCEPT()
  // Generation of challenge number c
  c = bigInt.randBetween(2, q.minus(1));      // Pot ser mes curt, meitat de bits

  // Generation of random number s
  s = bigInt.randBetween(2, q.minus(1));

  // Generation of xb, yb, private and public keys of B
  // yb = g^xb mod p
  xb = bigInt.randBetween(2, q.minus(1));
  yb = g.modPow(xb, p);

  // Generation of z1 = g^s mod p
  z1 = g.modPow(s, p);
  // Generation of z2 = xb·ya^s mod p
  z2 = xb.multiply(ya.modPow(s, p));

  // VARIABLES FOR FINISH()
  //const w = r.add(c.mod(p).multiply(xb.mod(p)).mod(p));
  w =  r.add(c.multiply(xb.mod(p)));

  console.log("p = "+"0x"+p.toString(16));
  console.log("g = "+"0x"+g.toString(16));
  console.log("q = "+"0x"+q.toString(16));
  console.log("xa = "+"0x"+xa.toString(16));
  console.log("ya = "+"0x"+ya.toString(16));
  console.log("r = "+"0x"+r.toString(16));
  console.log("c1 = "+"0x"+c1.toString(16));
  console.log("c2 = "+"0x"+c2.toString(16));
  console.log("c = "+"0x"+c.toString(16));
  console.log("s = "+"0x"+s.toString(16));
  console.log("xb = "+"0x"+xb.toString(16));
  console.log("yb = "+"0x"+yb.toString(16));
  console.log("z1 = "+"0x"+z1.toString(16));
  console.log("z2 = "+"0x"+z2.toString(16));
  console.log("w = "+"0x"+w.toString(16));
}

generate();