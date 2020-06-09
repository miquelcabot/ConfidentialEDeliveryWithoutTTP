import React, { Component } from 'react';
import { Link } from "react-router-dom";
import { Table, Button, Icon, Message, Label } from 'semantic-ui-react';
import web3 from '../ethereum/web3';
import notification from '../ethereum/notification';
import variables from '../ethereum/variables';

const bigInt = require("big-integer");
const dateFormat = require('dateformat');

class DeliveryRow extends Component {
  state = {
    receiver: '',
    start: '',
    state: '',
    loading: false,
    errorMessage: '',
  };

  componentDidMount = async () => {
    let deliveryContract = notification(this.props.delivery);
    let receiver = await deliveryContract.methods.receivers(0).call();
    let start = await deliveryContract.methods.start().call();
    let state = await deliveryContract.methods.getState(receiver).call();

    let d = new Date(0);
    d.setUTCSeconds(start);
    start = dateFormat(d, "dd/mm/yyyy HH:MM");

    this.setState({ 
      receiver: receiver,
      start: start,
      state: state
    });
  }

  onView = async () => {
    /*const campaign = Campaign(this.props.address);

    const accounts = await web3.eth.getAccounts();
    await campaign.methods.approveRequest(this.props.id).send({
      from: accounts[0]
    });*/
  };

  onAccept = async (contractAddress) => {

    let c, s, z1, z2;

    this.setState({ loading: true, errorMessage: '' });

    try {
      let deliveryContract = notification(contractAddress);

      const accounts = await web3.eth.getAccounts();

      // q of ElGamal algorithm
      // TODO: Com ho podem saber?
      let q = bigInt(variables.q.substr(2), 16);
      let xb = bigInt(variables.xb.substr(2), 16);
      let yb = bigInt(variables.yb.substr(2), 16);

      let p = bigInt((await deliveryContract.methods.p().call()).substr(2), 16);
      let g = bigInt((await deliveryContract.methods.g().call()).substr(2), 16);
      let ya = bigInt((await deliveryContract.methods.ya().call()).substr(2), 16);

      // VARIABLES FOR ACCEPT()
      // Generation of challenge number c
      c = bigInt.randBetween(2, q.minus(1));      // Pot ser mes curt, meitat de bits
      
      // Generation of random number s
      s = bigInt.randBetween(2, q.minus(1));

      // Generation of z1 = g^s mod p
      z1 = g.modPow(s, p);
      // Generation of z2 = xb·ya^s mod p
      z2 = xb.multiply(ya.modPow(s, p));
      
      await deliveryContract.methods
        .accept("0x"+z1.toString(16), "0x"+z2.toString(16), "0x"+yb.toString(16), "0x"+c.toString(16))
        .send({ from: accounts[0] });

      // Refresh
      alert('Delivery accepted!');
      this.setState({ state: 'accepted' });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
        this.setState({ loading: false });
    }
  };

  onFinish = async (contractAddress) => {

    let w;

    this.setState({ loading: true, errorMessage: '' });

    try {
      let deliveryContract = notification(contractAddress);

      const accounts = await web3.eth.getAccounts();

      // Random number r
      let r = bigInt(variables.r.substr(2), 16)
      // xb private key of B
      // TODO: Com ho podem saber?
      let xb = bigInt(variables.xb.substr(2), 16)

      let receiver = await deliveryContract.methods.receivers(0).call();
      let p = bigInt((await deliveryContract.methods.p().call()).substr(2), 16);
      let c = bigInt(((await deliveryContract.methods.receiversState(receiver).call()).c).substr(2), 16);

      // VARIABLES FOR FINISH()
      //const w = r.add(c.mod(p).multiply(xb.mod(p)).mod(p));
      
      w =  r.add(c.multiply(xb.mod(p)));
      
      await deliveryContract.methods
        .finish(receiver, "0x"+w.toString(16))
        .send({ from: accounts[0] });

      // Refresh
      alert('Delivery finished!');
      this.setState({ state: 'finished' });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
        this.setState({ loading: false });
    }
  };

  render() {
      return (
          <Table.Row>
              <Table.Cell>{this.props.id+1}</Table.Cell>
              <Table.Cell>{this.props.delivery}</Table.Cell>
              <Table.Cell>{this.state.receiver}</Table.Cell>
              <Table.Cell>{this.state.start}</Table.Cell>
              <Table.Cell>
                {
                 this.state.state==='finished'? 
                   (
                    <Label as='a' color='teal' horizontal>Finished</Label>
                   ) : (
                    this.state.state==='accepted'? (
                      <Label as='a' color='yellow' horizontal>Accepted</Label>
                    ) : (
                      this.state.state==='created'? (
                        <Label as='a' horizontal>Created</Label>
                      ) : (
                        <Label as='a' horizontal>-</Label>
                      )
                    )
                   )
                 }
              </Table.Cell>
              <Table.Cell>
                  {
                    this.props.sent ? (
                      <Button animated='vertical' color='blue' onClick={() => this.onFinish(this.props.delivery)} disabled={this.state.state!=='accepted'} loading={this.state.loading}>
                        <Button.Content hidden>Finish</Button.Content>
                        <Button.Content visible>
                          <Icon name='send' />
                        </Button.Content>
                      </Button>
                    ) : (
                      <Button animated='vertical' color='blue' onClick={() => this.onAccept(this.props.delivery)} disabled={this.state.state!=='created'} loading={this.state.loading}>
                        <Button.Content hidden>Accept</Button.Content>
                        <Button.Content visible>
                          <Icon name='check' />
                        </Button.Content>
                    </Button>
                    )
                  }
                  <Link to={"/deliveries/"+this.props.delivery}>
                    <Button animated='vertical' color='blue' onClick={this.onView}>
                      <Button.Content hidden>View</Button.Content>
                      <Button.Content visible>
                        <Icon name='eye' />
                      </Button.Content>
                    </Button>
                  </Link>
                  <Message error header="ERROR" content={this.state.errorMessage} hidden={!this.state.errorMessage} />
              </Table.Cell>
          </Table.Row>
          
      );
    }
}

export default DeliveryRow;
