const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const fs = require("fs");

const compiledFactoryPath = './contracts/build/ConfidentialMultipartyRegisteredEDeliveryWithoutTTPFactory.json';
const compiledFactory = require(compiledFactoryPath);

const provider = new HDWalletProvider(
  'tragic square news business dad cricket nurse athlete tide split about ring',
  'https://rinkeby.infura.io/6Fb0b6c4nUVQBb8qAKcx'
);
const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();

  console.log('Attempting to deploy from account', accounts[0]);

  const result = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
    .deploy({ data: compiledFactory.bytecode, arguments: [] })
    .send({ from: accounts[0], gas: '3000000' });

  fs.writeFileSync('./CONTRACTADDRESS', result.options.address);
  console.log('Contract deployed to Rinkeby network, at address ', result.options.address);
};
deploy();
