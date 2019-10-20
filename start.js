const ElGamal = require('elgamal');
const bigInt = require("big-integer");
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledFactoryPath = './contracts/build/ConfidentialMultipartyRegisteredEDeliveryFactory.json';
const compiledDeliveryPath = './contracts/build/ConfidentialMultipartyRegisteredEDelivery.json';
const compiledFactory = require(compiledFactoryPath);
const compiledDelivery = require(compiledDeliveryPath);

let factoryContract;
let deliveryContract;
let deliveryContractAddress;
let accounts;

const NUMBER_BITS = 512;
const MESSAGE = "Hola, com va tot?";

// To prevent warning "MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 data listeners added. Use emitter.setMaxListeners() to increase limit"
require('events').EventEmitter.defaultMaxListeners = 0;

const start = async () => {
    console.log(`Number of bits: ${NUMBER_BITS}`);

    // Generation of p, g, q of ElGamal algorithm
    const elgamal = await ElGamal.default.generateAsync(NUMBER_BITS);
    const p = bigInt(elgamal.p.toString());
    console.log(`El Gamal. p (safe prime number): ${"0x"+p.toString(16)}`);
    const g = bigInt(elgamal.g.toString());
    console.log(`El Gamal. g (generator): ${"0x"+g.toString(16)}`);
    const q = p.minus(1).divide(2);
    console.log(`El Gamal. q ((p-1)/2): ${"0x"+q.toString(16)}`);
    
    // Generation of xa, ya, private and public keys of A
    // ya = g^xa mod p
    const xa = bigInt.randBetween(2, q.minus(1));
    console.log(`El Gamal. xa (private key of A): ${"0x"+xa.toString(16)}`);
    const ya = g.modPow(xa, p);
    console.log(`El Gamal. ya (public key of A): ${"0x"+ya.toString(16)}`);
    
    // Generation of random number r
    const r = bigInt.randBetween(2, q.minus(1));
    console.log(`Random r: ${"0x"+r.toString(16)}`);
    
    const messageSentBuffer = Buffer.from(MESSAGE, 'utf8');
    console.log(`Hexadecimal sent: '${MESSAGE}'`);

    const messageSent = bigInt(messageSentBuffer.toString('hex'), 16);
    console.log(`Hexadecimal message sent: ${"0x"+messageSent.toString(16)}`);

    // Generation of M1 = g^r mod p
    const m1 = g.modPow(r, p);
    console.log(`M1: ${"0x"+m1.toString(16)}`);

    // Generation of M2 = m·ya^r mod p
    //const m2 = await encrypt(message);                 // ANTERIOR, ARA HO FEIM SEGONS LA SEGUENT LINIA
    const m2 = messageSent.multiply(ya.modPow(r, p));
    console.log(`M2: ${"0x"+m2.toString(16)}`);

    // Send to SM: m1, m2, B, term1, term2, ya, g, p
    accounts = await web3.eth.getAccounts();
    factoryContract = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
        .deploy({ data: compiledFactory.bytecode, arguments: [] })
        .send({ from: accounts[0], gas: '6000000' });

    await factoryContract.methods
        .createDelivery([accounts[1],accounts[2]], "0x"+m1.toString(16), "0x"+m2.toString(16), "0x"+ya.toString(16), "0x"+g.toString(16), "0x"+p.toString(16), 600, 1200)
        .send({ from: accounts[0], gas: '6000000', value: '100' });
    
    const addresses = await factoryContract.methods.getDeliveries().call();
    deliveryContractAddress = addresses[0];
        
    deliveryContract = await new web3.eth.Contract(JSON.parse(compiledDelivery.interface), deliveryContractAddress);

    console.log(`Smart contract address: ${deliveryContractAddress}`);

    //  B --> ACCEPT

    // Generation of challenge number c
    const c = bigInt.randBetween(2, q.minus(1));      // Pot ser mes curt, meitat de bits
    console.log(`Challenge c: ${"0x"+c.toString(16)}`);
    
    // Generation of random number s
    const s = bigInt.randBetween(2, q.minus(1));
    console.log(`Random s: ${"0x"+s.toString(16)}`);

    // Generation of xb, yb, private and public keys of B
    // yb = g^xb mod p
    const xb = bigInt.randBetween(2, q.minus(1));
    console.log(`El Gamal. xb (private key of B): ${"0x"+xb.toString(16)}`);
    const yb = g.modPow(xb, p);
    console.log(`El Gamal. yb (public key of B): ${"0x"+yb.toString(16)}`);

    // Generation of z1 = g^s mod p
    const z1 = g.modPow(s, p);
    console.log(`z1: ${"0x"+z1.toString(16)}`);
    // Generation of z2 = xb·ya^s mod p
    const z2 = xb.multiply(ya.modPow(s, p));
    console.log(`z2: ${"0x"+z2.toString(16)}`);

    // Send to SM: z1, z2, yb, c

    await deliveryContract.methods
        .accept("0x"+z1.toString(16), "0x"+z2.toString(16), "0x"+yb.toString(16), "0x"+c.toString(16))
        .send({ from: accounts[1], gas: '6000000' });
    await deliveryContract.methods
        .accept("0x"+z1.toString(16), "0x"+z2.toString(16), "0x"+yb.toString(16), "0x"+c.toString(16))
        .send({ from: accounts[2], gas: '6000000' });

    // A --> FINSIH

    // Generation of w = r + c·xb mod p
    //const w = r.add(c.mod(p).multiply(xb.mod(p)).mod(p));
    const w =  r.add(c.multiply(xb.mod(p)));
    console.log(`w: ${"0x"+w.toString(16)}`);
                                                            // Pendent, enviar un w per cada B'
    
    // Generation of g^w mod p
    const check_js_1 = g.modPow(w, p);
    console.log(`check_js_1: ${"0x"+check_js_1.toString(16)}`);
    // Generation of ((g^r mod p)·(yb^c mod p)) mod p
    const check_js_2 = g.modPow(r, p).multiply(yb.modPow(c, p)).mod(p);
    console.log(`check_js_2: ${"0x"+check_js_2.toString(16)}`);

    console.log(`Check at Client? ${check_js_1.equals(check_js_2)?"OK":"NO"}`);

    const check_sm_1 = await deliveryContract.methods.check_1(accounts[1], "0x"+w.toString(16), "0x"+r.toString(16)).call();
    console.log(`check_sm_1: ${check_sm_1}`);
    const check_sm_2 = await deliveryContract.methods.check_2(accounts[1], "0x"+w.toString(16), "0x"+r.toString(16)).call();
    console.log(`check_sm_2: ${check_sm_2}`);

    console.log(`Check at Smart Contract? ${check_sm_1==check_sm_2?"OK":"NO"}`);

    await deliveryContract.methods
        .finish(accounts[1], "0x"+w.toString(16), "0x"+r.toString(16))
        .send({ from: accounts[0], gas: '6000000' });    //PENDENT

    // Generation of m2/(ya^r mod p)
    const messageReceived = m2.divide(ya.modPow(r, p));
    console.log(`Hexadecimal message received: ${"0x"+messageReceived.toString(16)}`);
    const messageReceivedBuffer = Buffer.from(messageReceived.toString(16), 'hex');
    console.log(`Hexadecimal received: '${messageReceivedBuffer}'`);
}

start();
