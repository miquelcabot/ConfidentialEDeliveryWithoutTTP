import React, { Component } from 'react';
import { Table, Button, Icon } from 'semantic-ui-react';
import web3 from '../ethereum/web3';
import notification from '../ethereum/notification';
//import Campaign from '../ethereum/campaign';

let dateFormat = require('dateformat');

class DeliveryRow extends Component {
  state = {
    address: '',
    timestamp: '',
    state: ''
  };

  componentDidMount = async () => {
    let deliveryContract = notification(this.props.delivery);
    let address = await deliveryContract.methods.receivers(0).call();
    let timestamp = await deliveryContract.methods.start().call();
    let state = await deliveryContract.methods.getState(address).call();

    let d = new Date(0);
    d.setUTCSeconds(timestamp);
    timestamp = dateFormat(d, "dd/mm/yyyy HH:MM");


    console.log(deliveryContract);
    console.log(await deliveryContract.methods.receivers(0).call());
    this.setState({ 
      address: address,
      timestamp: timestamp,
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

  render() {
      return (
          <Table.Row>
              <Table.Cell>{this.props.id+1}</Table.Cell>
              <Table.Cell>{this.props.delivery}</Table.Cell>
              <Table.Cell>{this.state.address}</Table.Cell>
              <Table.Cell>{this.state.timestamp}</Table.Cell>
              <Table.Cell>{this.state.state}</Table.Cell>
              <Table.Cell>
                  {
                    this.props.sent ? (
                      <Button animated='vertical' color='blue' onClick={this.onFinish} disabled={this.state.state!='accepted'}>
                        <Button.Content hidden>Finish</Button.Content>
                        <Button.Content visible>
                          <Icon name='send' />
                        </Button.Content>
                      </Button>
                    ) : (
                      <Button animated='vertical' color='blue' onClick={this.onAccept} disabled={this.state.state!='created'}>
                        <Button.Content hidden>Accept</Button.Content>
                        <Button.Content visible>
                          <Icon name='check' />
                        </Button.Content>
                    </Button>
                    )
                  }
                  {/*<Button basic color='blue' onClick={this.onView}>
                      {this.props.sent?'Finish':'Accept'}
      </Button>*/}
                  <Button animated='vertical' color='blue' onClick={this.onView}>
                    <Button.Content hidden>View</Button.Content>
                    <Button.Content visible>
                      <Icon name='eye' />
                    </Button.Content>
                  </Button>
              </Table.Cell>
          </Table.Row>
      );
    }
}

export default DeliveryRow;
