import React, { Component } from 'react';
import { Icon, Button, Dimmer, Loader, Segment, Table } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import factory from '../ethereum/factory';
import web3 from '../ethereum/web3';
import DeliveryRow from '../components/DeliveryRow';

class Home extends Component {
    state = {
        loadingPage: true,
        loading: false,
        errorMessage: ''
    };

    componentDidMount = async () => {
        try {
            const accounts = await web3.eth.getAccounts();
            const senderDeliveriesCount = await factory.methods.getSenderDeliveriesCount(accounts[0]).call();
            const receiverDeliveriesCount = await factory.methods.getReceiverDeliveriesCount(accounts[0]).call();

            const senderDeliveries = await Promise.all(
                Array(parseInt(senderDeliveriesCount))
                  .fill()
                  .map((delivery, index) => {
                    return factory.methods.senderDeliveries(accounts[0], index).call();
                  })
              );

              const receiverDeliveries = await Promise.all(
                Array(parseInt(receiverDeliveriesCount))
                  .fill()
                  .map((delivery, index) => {
                    return factory.methods.receiverDeliveries(accounts[0], index).call();
                  })
              );

            this.setState({ 
                senderDeliveries: senderDeliveries, 
                receiverDeliveries: receiverDeliveries 
            });
        } finally {
            this.setState({ loadingPage: false })
        }
    }

    renderDeliveryRows(sent) {
        var deliveries;
        if (sent) {
            deliveries = this.state.senderDeliveries;
        } else {
            deliveries = this.state.receiverDeliveries;
        }
        return deliveries.map((delivery, index) => {
            return (
                <DeliveryRow
                    key={index}
                    id={index}
                    delivery={delivery}
                    sent={sent}
                />
            );
        });
    }

    render() {
        // Loading
        if (this.state.loadingPage) return (
            <div>
                <Segment style={{ height: '80vh' }}>
                    <Dimmer active inverted>
                        <Loader inverted content='Loading...' />
                    </Dimmer>
                </Segment>
            </div>
        );
      
        // Done
        return (
            <div>
                <h3><Icon name='sign in alternate' circular />&nbsp;Received deliveries</h3>
                <Table fixed>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>#</Table.HeaderCell>
                            <Table.HeaderCell>Address</Table.HeaderCell>
                            <Table.HeaderCell>Sender</Table.HeaderCell>
                            <Table.HeaderCell>Timestamp</Table.HeaderCell>
                            <Table.HeaderCell>State</Table.HeaderCell>
                            <Table.HeaderCell>Action</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>{this.renderDeliveryRows(false)}</Table.Body>
                </Table>
                <h3><Icon name='sign out alternate' circular />&nbsp;Sent deliveries</h3>
                <Table fixed>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>#</Table.HeaderCell>
                            <Table.HeaderCell>Address</Table.HeaderCell>
                            <Table.HeaderCell>Receiver</Table.HeaderCell>
                            <Table.HeaderCell>Timestamp</Table.HeaderCell>
                            <Table.HeaderCell>State</Table.HeaderCell>
                            <Table.HeaderCell>Action</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>{this.renderDeliveryRows(true)}</Table.Body>
                </Table>
                <Link to="/deliveries/new">
                    <Button
                        content = "Send New Delivery"
                        icon = "add circle"
                        primary = {true}
                        />
                </Link>
            </div>
        );
    }
}

export default Home;
