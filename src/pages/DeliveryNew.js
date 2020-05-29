import React, { Component } from 'react';
import { withRouter, Link } from "react-router-dom";
import { Form, Button, Message, Input } from 'semantic-ui-react';
import factory from '../ethereum/factory';
import web3 from '../ethereum/web3';
import variables from '../ethereum/variables';

const bigInt = require("big-integer");

class DeliveryNew extends Component {
  state = {
    receiver: '',
    message: '',
    term1: '',
    term2: '',
    deposit: '',
    loading: false,
    errorMessage: ''
  };

  onSubmit = async event => {
    event.preventDefault();

    this.setState({ loading: true, errorMessage: '' });

    try {
        let c1, c2;
        
        // p, g of ElGamal algorithm
        let p = bigInt(variables.p.substr(2), 16)
        let g = bigInt(variables.g.substr(2), 16)
        // Random number r
        let r = bigInt(variables.r.substr(2), 16)
        // ya public key of A
        let ya = bigInt(variables.ya.substr(2), 16)
        
        let messageSentBuffer = Buffer.from(this.state.message, 'utf8');
        let messageSent = bigInt(messageSentBuffer.toString('hex'), 16);

        // Generation of C1 = g^r mod p
        c1 = g.modPow(r, p);

        // Generation of C2 = m·ya^r mod p
        c2 = messageSent.multiply(ya.modPow(r, p));
        
        const accounts = await web3.eth.getAccounts();
        await factory.methods
            .createDelivery([this.state.receiver], "0x"+c1.toString(16), "0x"+c2.toString(16),
              "0x"+ya.toString(16), "0x"+g.toString(16), "0x"+p.toString(16), this.state.term1, 
              this.state.term2)
            .send({ from: accounts[0], value: this.state.deposit });

        alert('Delivery created!');
        // Refresh, using withRouter
        this.props.history.push('/');
    } catch (err) {
        this.setState({ errorMessage: err.message });
    } finally {
        this.setState({ loading: false });
    }

  };

  render() {
    return (
      <div>
        <Link to='/'>Back</Link>
        <h3>Send New Delivery</h3>
        <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
          <Form.Field>
            <label>Receiver</label>
            <Input
              value={this.state.receiver}
              onChange={event => this.setState({ receiver: event.target.value })}
            />
          </Form.Field>

          <Form.Field>
            <label>Message</label>
            <Input
              value={this.state.message}
              onChange={event => this.setState({ message: event.target.value })}
            />
          </Form.Field>

          <Form.Field>
            <label>Term 1</label>
            <Input
              label="seconds"
              labelPosition="right"
              value={this.state.term1}
              onChange={event => this.setState({ term1: event.target.value })}
            />
          </Form.Field>

          <Form.Field>
            <label>Term 2</label>
            <Input
              label="seconds"
              labelPosition="right"
              value={this.state.term2}
              onChange={event => this.setState({ term2: event.target.value })}
            />
          </Form.Field>

          <Form.Field>
            <label>Deposit</label>
            <Input
              label="wei"
              labelPosition="right"
              value={this.state.deposit}
              onChange={event => this.setState({ deposit: event.target.value })}
            />
          </Form.Field>

          <Message error header="ERROR" content={this.state.errorMessage} />
          <Button primary loading={this.state.loading}>
            Send!
          </Button>
        </Form>
      </div>
    );
  }
}

export default withRouter(DeliveryNew);
