const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledFactoryPath = '../contracts/build/ConfidentialMultipartyRegisteredEDeliveryFactory.json';
const compiledDeliveryPath = '../contracts/build/ConfidentialMultipartyRegisteredEDelivery.json';
const compiledFactory = require(compiledFactoryPath);
const compiledDelivery = require(compiledDeliveryPath);

let factoryContract;
let deliveryContract;
let deliveryContractAddress;
let accounts;

// To prevent warning "MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 data listeners added. Use emitter.setMaxListeners() to increase limit"
require('events').EventEmitter.defaultMaxListeners = 0;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  factoryContract = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
    .deploy({ data: compiledFactory.bytecode, arguments: [] })
    .send({ from: accounts[0], gas: '3000000' });

  await factoryContract.methods
    .createDelivery([accounts[1],accounts[2]], web3.utils.keccak256("Test message"), 600, 1200)
    .send({ from: accounts[0], gas: '3000000', value: '100' });

  const addresses = await factoryContract.methods.getDeliveries().call();
  deliveryContractAddress = addresses[0];

  deliveryContract = await new web3.eth.Contract(JSON.parse(compiledDelivery.interface), deliveryContractAddress);
});

describe('Certified eDelivery Contract', () => {
  it('deploys a factory and a delivery', () => {
    assert.ok(factoryContract.options.address);
    assert.ok(deliveryContract.options.address);
  });

  it("state is created and has a hash message", async function () {
    var messageHash = await deliveryContract.methods.messageHash().call();
    assert.equal(messageHash, web3.utils.keccak256("Test message"));
  });

  it("non receivers can't accept delivery", async function() {
    try { 
      await deliveryContract.methods.accept().send({ from: accounts[3] });
      assert(false);
    } catch (err) {
      assert(err);
    } 
  });

  it("receiver can accept delivery", async function() {
    await deliveryContract.methods.accept().send({ from: accounts[1] });
    var state = await deliveryContract.methods.getState(accounts[1]).call();
    assert.equal(state, "accepted");
  });

  it("non sender can't finish delivery", async function() {
    await deliveryContract.methods.accept().send({ from: accounts[1] });
    await deliveryContract.methods.accept().send({ from: accounts[2] });
    try { 
      await deliveryContract.methods.finish("Test message").send({ from: accounts[3] });
      assert(false);
    } catch (err) {
      assert(err);
    } 
  });

  it("sender can finish delivery", async function() {
    await deliveryContract.methods.accept().send({ from: accounts[1] });
    await deliveryContract.methods.accept().send({ from: accounts[2] });
    await deliveryContract.methods.finish("Test message").send({ from: accounts[0] });
    var message = await deliveryContract.methods.message().call();
    var state = await deliveryContract.methods.getState(accounts[1]).call();
    assert.equal(message, "Test message");
    assert.equal(state, "finished");
  });
});
