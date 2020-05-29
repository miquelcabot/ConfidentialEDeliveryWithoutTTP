import React, { Component } from 'react';
import { withRouter, Link } from "react-router-dom";
import { Form, Button, Message, Input } from 'semantic-ui-react';
import notification from '../ethereum/notification';
import web3 from '../ethereum/web3';

const dateFormat = require('dateformat');

class DeliveryShow extends Component {
  state = {
    address: '',
    sender: '',
    receiver: '',
    state: '',
    g: '',
    p: '',
    c1: '',
    c2: '',
    ya: '',
    term1: '',
    term2: '',
    start: '',
    z1: '',
    z2: '',
    yb: '',
    c: '',
    w: '',
    message: '',
    deposit: '',
    errorMessage: ''
  };

  componentDidMount = async () => {

    try {
      let address = this.props.match.params.address;
      let deliveryContract = notification(address);

      let deposit = await web3.eth.getBalance(address)

      let sender = await deliveryContract.methods.sender().call();
      let receiver = await deliveryContract.methods.receivers(0).call();
      let state = await deliveryContract.methods.getState(receiver).call();
      let g = await deliveryContract.methods.g().call();
      let p = await deliveryContract.methods.p().call();
      let c1 = await deliveryContract.methods.c1().call();
      let c2 = await deliveryContract.methods.c2().call();
      let ya = await deliveryContract.methods.ya().call();
      let term1 = await deliveryContract.methods.term1().call();
      let term2 = await deliveryContract.methods.term2().call();
      let start = await deliveryContract.methods.start().call();

      let receiversState = await deliveryContract.methods.receiversState(receiver).call();

      let z1 = receiversState.z1;
      let z2 = receiversState.z2;
      let yb = receiversState.yb;
      let c = receiversState.c;
      let w = receiversState.w;

      let d = new Date(0);
      d.setUTCSeconds(start);
      start = dateFormat(d, "dd/mm/yyyy HH:MM");

      this.setState({ 
        address: address,
        sender: sender,
        receiver: receiver,
        state: state,
        g: g,
        p: p,
        c1: c1,
        c2: c2,
        ya: ya,
        term1: term1,
        term2: term2,
        start: start,
        z1: z1,
        z2: z2,
        yb: yb,
        c: c,
        w: w,
        deposit: deposit
      });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    }
  }

  onSubmit = async event => {
    event.preventDefault();

    // Refresh, using withRouter
    this.props.history.push('/');
  };

  render() {
    return (
      <div>
        <Link to='/'>Back</Link>
        <h3>Show Delivery</h3>
        <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
          <Form.Field>
            <label>Address of Smart Contract</label>
            <Input
              readOnly
              value={this.state.address}
            />
          </Form.Field>

          <Form.Field>
            <label>Sende</label>
            <Input
              readOnly
              value={this.state.sender}
            />
          </Form.Field>

          <Form.Field>
            <label>Receiver</label>
            <Input
              readOnly
              value={this.state.receiver}
            />
          </Form.Field>

          <Form.Field>
            <label>State</label>
            <Input
              readOnly
              value={this.state.state}
            />
          </Form.Field>

          <Form.Field>
            <label>p of ElGamal algorithm</label>
            <Input
              readOnly
              value={this.state.p}
            />
          </Form.Field>

          <Form.Field>
            <label>g of ElGamal algorithm</label>
            <Input
              readOnly
              value={this.state.g}
            />
          </Form.Field>

          <Form.Field>
            <label>c1 = g^r mod p</label>
            <Input
              readOnly
              value={this.state.c1}
            />
          </Form.Field>

          <Form.Field>
            <label>c2 = m·ya^r mod p</label>
            <Input
              readOnly
              value={this.state.c2}
            />
          </Form.Field>

          <Form.Field>
            <label>ya public key of A, ya = g^xa mod p</label>
            <Input
              readOnly
              value={this.state.ya}
            />
          </Form.Field>

          <Form.Field>
            <label>Term 1</label>
            <Input
              readOnly
              label="seconds"
              labelPosition="right"
              value={this.state.term1}
            />
          </Form.Field>

          <Form.Field>
            <label>Term 2</label>
            <Input
              readOnly
              label="seconds"
              labelPosition="right"
              value={this.state.term2}
            />
          </Form.Field>

          <Form.Field>
            <label>Start (Timestamp)</label>
            <Input
              readOnly
              value={this.state.start}
            />
          </Form.Field>

          <Form.Field>
            <label>z1</label>
            <Input
              readOnly
              value={this.state.z1}
            />
          </Form.Field>

          <Form.Field>
            <label>z2</label>
            <Input
              readOnly
              value={this.state.z2}
            />
          </Form.Field>

          <Form.Field>
            <label>yb</label>
            <Input
              readOnly
              value={this.state.yb}
            />
          </Form.Field>

          <Form.Field>
            <label>c</label>
            <Input
              readOnly
              value={this.state.c}
            />
          </Form.Field>

          <Form.Field>
            <label>w</label>
            <Input
              readOnly
              value={this.state.w}
            />
          </Form.Field>

          <Form.Field>
            <label>Message</label>
            <Input
              readOnly
              value={this.state.message}
              onChange={event => this.setState({ message: event.target.value })}
            />
          </Form.Field>

          <Form.Field>
            <label>Deposit</label>
            <Input
              label="wei"
              labelPosition="right"
              value={this.state.deposit}
            />
          </Form.Field>

          <Message error header="ERROR" content={this.state.errorMessage} />
          <Button primary loading={this.state.loading}>
            Close
          </Button>
        </Form>
      </div>
    );
  }
}

export default withRouter(DeliveryShow);
