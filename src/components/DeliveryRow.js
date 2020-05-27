import React, { Component } from 'react';
import { Table, Button } from 'semantic-ui-react';
//import Campaign from '../ethereum/campaign';

class DeliveryRow extends Component {
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
              <Table.Cell>{this.props.delivery.account}</Table.Cell>
              <Table.Cell>{this.props.delivery.timestamp}</Table.Cell>
              <Table.Cell>{this.props.delivery.state}</Table.Cell>
              <Table.Cell>
                  <Button basic color='blue' onClick={this.onView}>
                      View
                  </Button>
              </Table.Cell>
          </Table.Row>
      );
    }
}

export default DeliveryRow;
