const ElGamal = require('elgamal');
const bigInt = require("big-integer");

const NUMBER_BITS = 512;
const MESSAGE = "Hola, com va tot?";

let elgamal, p, g, q, xa, ya, r;
let xb, yb;

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

  // VARIABLES FOR ACCEPT()
  // Generation of xb, yb, private and public keys of B
  // yb = g^xb mod p
  xb = bigInt.randBetween(2, q.minus(1));
  yb = g.modPow(xb, p);

  console.log("p = "+"0x"+p.toString(16));
  console.log("g = "+"0x"+g.toString(16));
  console.log("q = "+"0x"+q.toString(16));
  console.log("xa = "+"0x"+xa.toString(16));
  console.log("ya = "+"0x"+ya.toString(16));
  console.log("r = "+"0x"+r.toString(16));
  console.log("xb = "+"0x"+xb.toString(16));
  console.log("yb = "+"0x"+yb.toString(16));
}

generate();