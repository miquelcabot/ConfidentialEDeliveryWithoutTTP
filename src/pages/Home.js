import React, { Component } from 'react';
import { Icon, Button, Dimmer, Loader, Segment, Table } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import factory from '../ethereum/factory';
import notification from '../ethereum/notification';
import web3 from '../ethereum/web3';
import NotificationRow from '../components/NotificationRow';

class Home extends Component {
    state = {
        loadingPage: true,
        loading: false,
        errorMessage: ''
    };

    componentDidMount = async () => {
        try {
            const accounts = await web3.eth.getAccounts();
            const senderNotificationsCount = await factory.methods.getSenderNotificationsCount(accounts[0]).call();
            const receiverNotificationsCount = await factory.methods.getReceiverNotificationsCount(accounts[0]).call();
            //const senderNotifications = await factory.methods.getSenderNotifications(accounts[0]).call();
            //const receiverNotifications = await factory.methods.getReceiverNotifications(accounts[0]).call();

            const senderNotifications = await Promise.all(
                Array(parseInt(senderNotificationsCount))
                  .fill()
                  .map((notification, index) => {
                    return factory.methods.senderNotifications(accounts[0], index).call();
                  })
              );

              const receiverNotifications = await Promise.all(
                Array(parseInt(receiverNotificationsCount))
                  .fill()
                  .map((notification, index) => {
                    return factory.methods.receiverNotifications(accounts[0], index).call();
                  })
              );

            this.setState({ 
                senderNotifications: senderNotifications, 
                receiverNotifications: receiverNotifications 
            });
        } finally {
            this.setState({ loadingPage: false })
        }
    }

    renderNotificationRows(sent) {
        var notifications;
        if (sent) {
            notifications = this.state.senderNotifications;
        } else {
            notifications = this.state.receiverNotifications;
        }
        return notifications.map((notification, index) => {
            return (
                <NotificationRow
                    key={index}
                    id={index}
                    notification={notification}
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
                <h3><Icon name='sign in alternate' circular />&nbsp;Received notifications</h3>
                <Table fixed>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>#</Table.HeaderCell>
                            <Table.HeaderCell>Address</Table.HeaderCell>
                            <Table.HeaderCell>Sender</Table.HeaderCell>
                            <Table.HeaderCell>Timestamp</Table.HeaderCell>
                            <Table.HeaderCell>State</Table.HeaderCell>
                            <Table.HeaderCell>View</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>{this.renderNotificationRows(false)}</Table.Body>
                </Table>
                <h3><Icon name='sign out alternate' circular />&nbsp;Sent notifications</h3>
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>#</Table.HeaderCell>
                            <Table.HeaderCell>Address</Table.HeaderCell>
                            <Table.HeaderCell>Receiver</Table.HeaderCell>
                            <Table.HeaderCell>Timestamp</Table.HeaderCell>
                            <Table.HeaderCell>State</Table.HeaderCell>
                            <Table.HeaderCell>View</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>{this.renderNotificationRows(true)}</Table.Body>
                </Table>
                <Link to="/notifications/new">
                    <Button
                        content = "Send New Notification"
                        icon = "add circle"
                        primary = {true}
                        />
                </Link>
            </div>
        );
    }
}

export default Home;
