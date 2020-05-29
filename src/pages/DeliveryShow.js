import React, { Component } from 'react';
import { withRouter, Link } from "react-router-dom";
import { Form, Button, Message, Input } from 'semantic-ui-react';
import factory from '../ethereum/factory';
import web3 from '../ethereum/web3';
import variables from '../ethereum/variables';

const bigInt = require("big-integer");

class DeliveryShow extends Component {
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
            Close
          </Button>
        </Form>
      </div>
    );
  }
}

export default withRouter(DeliveryShow);
