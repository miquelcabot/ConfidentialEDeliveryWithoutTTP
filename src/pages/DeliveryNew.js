import React, { Component } from 'react';
import { withRouter, Link } from "react-router-dom";
import { Form, Button, Message, Input } from 'semantic-ui-react';
import factory from '../ethereum/factory';
import web3 from '../ethereum/web3';

class DeliveryNew extends Component {
  state = {
    receiver: '',
    message: '',
    term: '',
    deposit: '',
    loading: false,
    errorMessage: ''
  };

  onSubmit = async event => {
    event.preventDefault();

    this.setState({ loading: true, errorMessage: '' });

    try {
        const accounts = await web3.eth.getAccounts();
        await factory.methods
            .createDelivery(this.state.receiver, web3.utils.keccak256(this.state.message), this.state.term)
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
            <label>Term</label>
            <Input
              label="seconds"
              labelPosition="right"
              value={this.state.term}
              onChange={event => this.setState({ term: event.target.value })}
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

          <Message error header="Oops!" content={this.state.errorMessage} />
          <Button primary loading={this.state.loading}>
            Send!
          </Button>
        </Form>
      </div>
    );
  }
}

export default withRouter(DeliveryNew);
