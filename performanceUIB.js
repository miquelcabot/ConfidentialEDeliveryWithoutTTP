const ganache = require('ganache-cli');
const Web3 = require('web3');
let net = require('net');

let web3 = new Web3('/home/ether/data/geth.ipc', net); // mac os path

//const web3 = new Web3(ganache.provider());
const ElGamal = require('elgamal');
const bigInt = require("big-integer");

const compiledFactoryPath = './contracts/build/ConfidentialMultipartyRegisteredEDeliveryWithoutTTPFactory.json';
const compiledDeliveryPath = './contracts/build/ConfidentialMultipartyRegisteredEDeliveryWithoutTTP.json';
const compiledFactory = require(compiledFactoryPath);
const compiledDelivery = require(compiledDeliveryPath);

const compiledFactoryNonConfPath = './contracts_NonConfidentialMultipartyRegisteredEDelivery/build/NonConfidentialMultipartyRegisteredEDeliveryFactory.json';
const compiledDeliveryNonConfPath = './contracts_NonConfidentialMultipartyRegisteredEDelivery/build/NonConfidentialMultipartyRegisteredEDelivery.json';
const compiledFactoryNonConf = require(compiledFactoryNonConfPath);
const compiledDeliveryNonConf = require(compiledDeliveryNonConfPath);

const NUMBER_BITS = 256;
const MESSAGE = "Hola, com va tot?";

let elgamal, p, g, q, xa, ya, r, messageSent, m1, m2;
let c, s, xb, yb, z1, z2;
let w;

// To prevent warning "MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 data listeners added. Use emitter.setMaxListeners() to increase limit"
require('events').EventEmitter.defaultMaxListeners = 0;

const performance = async (functionToTest, functionName, account, results) => {
    let gasPrice = await web3.eth.getGasPrice();

    let balance1 = await web3.eth.getBalance(account);
    let hrstart = process.hrtime();
    let returnValue = await functionToTest();
    let hrend = process.hrtime(hrstart);
    let balance2 = await web3.eth.getBalance(account);
    
    let receipt;
    if (returnValue.transactionHash) {
        receipt = await web3.eth.getTransactionReceipt(returnValue.transactionHash);
    }
    console.log('Delay of function '+functionName+'(): %ds %dms', hrend[0], hrend[1] / 1000000);
    console.log('Wei cost of function '+functionName+'(): \t\t%s', (balance1-balance2).toLocaleString('en').padStart(25));
    if (receipt) {
        console.log('Gas cost of function '+functionName+'(): \t\t%s', (receipt.gasUsed).toLocaleString('en').padStart(25));
    } else {
        console.log('Gas cost of function '+functionName+'(): \t\t%s', ((balance1-balance2)/gasPrice).toLocaleString('en').padStart(25));
    }
    results.ms.push(hrend[1] / 1000000);
    results.wei.push(balance1-balance2);
    if (receipt) {
        results.gas.push(receipt.gasUsed);
    } else {
        results.gas.push((balance1-balance2)/gasPrice);
    }
    return returnValue;
};

const average = async (results) => {
    let totalms = 0;
    let totalwei = 0;
    let totalgas = 0;
    for(let i = 0; i < results.ms.length; i++) {
        totalms += results.ms[i];
        totalwei += results.wei[i];
        totalgas += results.gas[i];
    }
    console.log('AVERAGE DELAY: %dms', totalms / results.ms.length);
    console.log('AVERAGE WEI COST: %s', (totalwei / results.wei.length).toLocaleString('en'));
    console.log('AVERAGE GAS COST: %s', (totalgas / results.gas.length).toLocaleString('en'));
}

// Test confidential contract
const testPerformance = async (numberReceivers, repetitions) => {
    let accounts = await web3.eth.getAccounts();
    let gasPrice = await web3.eth.getGasPrice();
    
    let factoryContract = [];
    let deliveryContract = [];

    let results = { ms: [], wei: [], gas: []};
    
    // Add n receivers to the array of receivers
    let arrayReceivers = [];
    for (let i = 1; i<=numberReceivers; i++) {
        arrayReceivers.push(accounts[i%10]);    // i%10 --> There are only 10 addresses.
    }

    console.log('');
    console.log('For %d receiver/s', numberReceivers);
    console.log('------------------------');

    // Deploy factory
    results = { ms: [], wei: [], gas: []};
    for (let i = 0; i < repetitions; i++) {
        factoryContract.push(await performance(
            async () => {
                return await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
                    .deploy({ data: compiledFactory.bytecode, arguments: [] })
                    .send({ from: accounts[0], gas: '6000000' });
            },
            'deploy',
            accounts[0],
            results
        ));
    }
    average(results);

    // createDelivery()
    results = { ms: [], wei: [], gas: []};
    for (let i = 0; i < repetitions; i++) {
        await performance(
            async () => {
                return await factoryContract[i].methods
                    .createDelivery(arrayReceivers, "0x"+m1.toString(16), "0x"+m2.toString(16), "0x"+ya.toString(16), "0x"+g.toString(16), "0x"+p.toString(16), 600, 1200)
                    .send({ from: accounts[0], gas: '6000000', value: '1' });
            },
            'createDelivery',
            accounts[0],
            results
        );

        // Get the deployed delivery contract
        let addresses = await factoryContract[i].methods.getDeliveries().call();
        let deliveryContractAddress = addresses[0];
        deliveryContract.push(await new web3.eth.Contract(JSON.parse(compiledDelivery.interface), deliveryContractAddress));
    }
    average(results);

    // accept() from accounts[1]
    results = { ms: [], wei: [], gas: []};
    for (let i = 0; i < repetitions; i++) {
        await performance(
            async () => {
                return await deliveryContract[i].methods.accept("0x"+z1.toString(16), "0x"+z2.toString(16), "0x"+yb.toString(16), "0x"+c.toString(16))
                    .send({ from: arrayReceivers[0], gas: '6000000' });
            },
            'accept',
            arrayReceivers[0],
            results
        );
    }
    average(results);
    
    // accept() from accounts[] of the rest of receivers
    for (let i = 0; i < repetitions; i++) {
        for (let j = 1; j<numberReceivers; j++) {
            await deliveryContract[i].methods.accept("0x"+z1.toString(16), "0x"+z2.toString(16), "0x"+yb.toString(16), "0x"+c.toString(16))
                .send({ from: arrayReceivers[j], gas: '6000000' });
        }
    }

    // finish()
    results = { ms: [], wei: [], gas: []};
    for (let i = 0; i < repetitions; i++) {
        await performance(
            async () => {
                return await deliveryContract[i].methods.finish(arrayReceivers[0], "0x"+w.toString(16))
                    .send({ from: accounts[0], gas: '6000000' });
            },
            'finish',
            accounts[0],
            results
        );
    }
    average(results);
    
};

// Test non confidential contract
const testPerformanceNonConf = async (numberReceivers, repetitions) => {
    let accounts = await web3.eth.getAccounts();
    let gasPrice = await web3.eth.getGasPrice();
    
    let factoryContract = [];
    let deliveryContract = [];

    let results = { ms: [], wei: [], gas: []};
    
    // Add n receivers to the array of receivers
    let arrayReceivers = [];
    for (let i = 1; i<=numberReceivers; i++) {
        arrayReceivers.push(accounts[i%10]);    // i%10 --> There are only 10 addresses.
    }

    console.log('');
    console.log('For %d receiver/s', numberReceivers);
    console.log('------------------------');

    // Deploy factory
    results = { ms: [], wei: [], gas: []};
    for (let i = 0; i < repetitions; i++) {
        factoryContract.push(await performance(
            async () => {
                return await new web3.eth.Contract(JSON.parse(compiledFactoryNonConf.interface))
                    .deploy({ data: compiledFactoryNonConf.bytecode, arguments: [] })
                    .send({ from: accounts[0], gas: '6000000' });
            },
            'deploy',
            accounts[0],
            results
        ));
    }
    average(results);

    // createDelivery()
    results = { ms: [], wei: [], gas: []};
    for (let i = 0; i < repetitions; i++) {
        await performance(
            async () => {
                return await factoryContract[i].methods
                    .createDelivery(arrayReceivers, web3.utils.keccak256("Test message"), 600, 1200)
                    .send({ from: accounts[0], gas: '6000000', value: '1' });
            },
            'createDelivery',
            accounts[0],
            results
        );

        // Get the deployed delivery contract
        let addresses = await factoryContract[i].methods.getDeliveries().call();
        let deliveryContractAddress = addresses[0];
        deliveryContract.push(await new web3.eth.Contract(JSON.parse(compiledDeliveryNonConf.interface), deliveryContractAddress));
    }
    average(results);

    // accept() from accounts[1]
    results = { ms: [], wei: [], gas: []};
    for (let i = 0; i < repetitions; i++) {
        await performance(
            async () => {
                return await deliveryContract[i].methods.accept()
                    .send({ from: arrayReceivers[0], gas: '6000000' });
            },
            'accept',
            arrayReceivers[0],
            results
        );
    }
    average(results);
    
    // accept() from accounts[] of the rest of receivers
    for (let i = 0; i < repetitions; i++) {
        for (let j = 1; j<numberReceivers; j++) {
            await deliveryContract[i].methods.accept()
                .send({ from: arrayReceivers[j], gas: '6000000' });
        }
    }

    // finish()
    results = { ms: [], wei: [], gas: []};
    for (let i = 0; i < repetitions; i++) {
        await performance(
            async () => {
                return await deliveryContract[i].methods.finish("Test message")
                    .send({ from: accounts[0], gas: '6000000' });
            },
            'finish',
            accounts[0],
            results
        );
    }
    average(results);
};

const init = async (repetitions) => {
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

    // Generation of M1 = g^r mod p
    m1 = g.modPow(r, p);

    // Generation of M2 = m·ya^r mod p
    m2 = messageSent.multiply(ya.modPow(r, p));

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

    await testPerformance(1, repetitions);
    await testPerformance(2, repetitions);
    await testPerformance(10, repetitions);
    await testPerformanceNonConf(1, repetitions);
    await testPerformanceNonConf(2, repetitions);
    await testPerformanceNonConf(10, repetitions);
}

init(10)