import web3 from './web3';

const Notification = require('./build/Notification.json');

export default (address) => {
    return new web3.eth.Contract(
        JSON.parse(Notification.interface),
        address
    );
}