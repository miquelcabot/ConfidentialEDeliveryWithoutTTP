const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const ElGamal = require('elgamal');
const bigInt = require("big-integer");

const compiledFactoryPath = '../src/ethereum/build/ConfidentialMultipartyRegisteredEDeliveryWithoutTTPFactory.json';
const compiledDeliveryPath = '../src/ethereum/build/ConfidentialMultipartyRegisteredEDeliveryWithoutTTP.json';
const compiledFactory = require(compiledFactoryPath);
const compiledDelivery = require(compiledDeliveryPath);

let factoryContract;
let deliveryContract;
let deliveryContractAddress;
let accounts; 

const NUMBER_BITS = 512;
const MESSAGE = "Hola, com va tot?";

let elgamal, p, g, q, xa, ya, r, messageSent, c1, c2;
let c, s, xb, yb, z1, z2;
let w;

// To prevent warning "MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 data listeners added. Use emitter.setMaxListeners() to increase limit"
require('events').EventEmitter.defaultMaxListeners = 0;

beforeEach(async () => {
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

  accounts = await web3.eth.getAccounts();

  factoryContract = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
    .deploy({ data: compiledFactory.bytecode, arguments: [] })
    .send({ from: accounts[0], gas: '6000000' });

  await factoryContract.methods
    .createDelivery([accounts[1],accounts[2]], "0x"+c1.toString(16), "0x"+c2.toString(16), "0x"+ya.toString(16), "0x"+g.toString(16), "0x"+p.toString(16), 600, 1200)
    .send({ from: accounts[0], gas: '6000000', value: '100' });

  const addresses = await factoryContract.methods.getDeliveries().call();
  deliveryContractAddress = addresses[0];

  deliveryContract = await new web3.eth.Contract(JSON.parse(compiledDelivery.interface), deliveryContractAddress);
});

describe('Certified eDelivery Contract', () => {
  it('deploys a factory and a delivery', () => {
    assert.ok(factoryContract.options.address);
    assert.ok(deliveryContract.options.address);
  });

  it("non receivers can't accept delivery", async function() {
    try { 
      await deliveryContract.methods
        .accept("0x"+z1.toString(16), "0x"+z2.toString(16), "0x"+yb.toString(16), "0x"+c.toString(16))
        .send({ from: accounts[3], gas: '6000000' });
      assert(false);
    } catch (err) {
      assert(err);
    } 
  });

  it("receiver can accept delivery", async function() {
    await deliveryContract.methods
      .accept("0x"+z1.toString(16), "0x"+z2.toString(16), "0x"+yb.toString(16), "0x"+c.toString(16))
      .send({ from: accounts[1], gas: '6000000' });
    let state = await deliveryContract.methods.getState(accounts[1]).call();
    assert.equal(state, "accepted");
  });

  it("non sender can't finish delivery", async function() {
    await deliveryContract.methods
      .accept("0x"+z1.toString(16), "0x"+z2.toString(16), "0x"+yb.toString(16), "0x"+c.toString(16))
      .send({ from: accounts[1], gas: '6000000' });
    await deliveryContract.methods
      .accept("0x"+z1.toString(16), "0x"+z2.toString(16), "0x"+yb.toString(16), "0x"+c.toString(16))
      .send({ from: accounts[2], gas: '6000000' });
    try { 
      await deliveryContract.methods
        .finish(accounts[1], "0x"+w.toString(16))
        .send({ from: accounts[3], gas: '6000000' });
      assert(false);
    } catch (err) {
      assert(err);
    } 
  });

  it("sender can finish delivery", async function() {
    await deliveryContract.methods
      .accept("0x"+z1.toString(16), "0x"+z2.toString(16), "0x"+yb.toString(16), "0x"+c.toString(16))
      .send({ from: accounts[1], gas: '6000000' });
    await deliveryContract.methods
      .accept("0x"+z1.toString(16), "0x"+z2.toString(16), "0x"+yb.toString(16), "0x"+c.toString(16))
      .send({ from: accounts[2], gas: '6000000' });
    await deliveryContract.methods
      .finish(accounts[1], "0x"+w.toString(16))
      .send({ from: accounts[0], gas: '6000000' });
    let state = await deliveryContract.methods.getState(accounts[1]).call();
    assert.equal(state, "finished");
  });

  it("received message is correct", async function() {
    await deliveryContract.methods
      .accept("0x"+z1.toString(16), "0x"+z2.toString(16), "0x"+yb.toString(16), "0x"+c.toString(16))
      .send({ from: accounts[1], gas: '6000000' });
    await deliveryContract.methods
      .accept("0x"+z1.toString(16), "0x"+z2.toString(16), "0x"+yb.toString(16), "0x"+c.toString(16))
      .send({ from: accounts[2], gas: '6000000' });
    await deliveryContract.methods
      .finish(accounts[1], "0x"+w.toString(16))
      .send({ from: accounts[0], gas: '6000000' });

    let _c2 = bigInt((await deliveryContract.methods.c2().call()).substr(2), 16);
    let _ya = bigInt((await deliveryContract.methods.ya().call()).substr(2), 16);
    let _p = bigInt((await deliveryContract.methods.p().call()).substr(2), 16);
    let _w = bigInt((await deliveryContract.methods.getW(accounts[1]).call()).substr(2), 16);

    let _r = _w.subtract(c.multiply(xb.mod(_p)));  // r = w-c*xb mod q

    const messageReceived = _c2.divide(_ya.modPow(_r, _p));
    const messageReceivedBuffer = Buffer.from(messageReceived.toString(16), 'hex');
    assert.equal(messageReceivedBuffer, MESSAGE);
  });
});
