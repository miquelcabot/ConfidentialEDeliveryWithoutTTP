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
    errorMessage: '',
    p: '',
    g: '',
    q: '',
    xa: '',
    ya: '',
    r: '',
    c1: '',
    c2: ''
  };

  onSubmit = async event => {
    event.preventDefault();

    this.setState({ loading: true, errorMessage: '' });

    try {
        let r, messageSent, c1, c2;
        
        // Generation of random number r
        r = bigInt.randBetween(2, bigInt(variables.q.substr(2), 16).minus(1));
        
        let messageSentBuffer = Buffer.from(this.state.message, 'utf8');
        messageSent = bigInt(messageSentBuffer.toString('hex').substr(2), 16);

        // Generation of C1 = g^r mod p
        c1 = bigInt(variables.g.substr(2), 16).modPow(r, bigInt(variables.p.substr(2), 16));

        // Generation of C2 = m·ya^r mod p
        c2 = messageSent.multiply(bigInt(variables.ya.substr(2), 16).modPow(r, bigInt(variables.p.substr(2), 16)));
        
        const accounts = await web3.eth.getAccounts();
        await factory.methods
            .createDelivery([this.state.receiver], this.state.c1, this.state.c2,
              this.state.ya, this.state.g, this.state.p, this.state.term1, 
              this.state.term2)
            .send({ from: accounts[0], value: this.state.deposit });

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

          <Form.Field>
            <label>p of ElGamal algorithm</label>
            <Input
              disabled
              value={this.state.p}
            />
          </Form.Field>

          <Form.Field>
            <label>g of ElGamal algorithm</label>
            <Input
              disabled
              value={this.state.g}
            />
          </Form.Field>

          <Form.Field>
            <label>q of ElGamal algorithm</label>
            <Input
              disabled
              value={this.state.q}
            />
          </Form.Field>

          <Form.Field>
            <label>xa private key of A</label>
            <Input
              disabled
              value={this.state.xa}
            />
          </Form.Field>

          <Form.Field>
            <label>ya public key of A, ya = g^xa mod p</label>
            <Input
              disabled
              value={this.state.ya}
            />
          </Form.Field>

          <Form.Field>
            <label>r random number</label>
            <Input
              disabled
              value={this.state.r}
            />
          </Form.Field>

          <Form.Field>
            <label>c1 = g^r mod p</label>
            <Input
              disabled
              value={this.state.c1}
            />
          </Form.Field>

          <Form.Field>
            <label>c2 = m·ya^r mod p</label>
            <Input
              disabled
              value={this.state.c2}
            />
          </Form.Field>
        </Form>
      </div>
    );
  }
}

export default withRouter(DeliveryNew);
