import web3 from './web3';

const Delivery = require('./build/ConfidentialMultipartyRegisteredEDeliveryWithoutTTP.json');

export default (address) => {
    return new web3.eth.Contract(
        JSON.parse(Delivery.interface),
        address
    );
}