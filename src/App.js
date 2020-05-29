import React, { Component } from 'react';
import { Container } from 'semantic-ui-react';
import { Switch, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import DeliveryNew from './pages/DeliveryNew';
import DeliveryShow from './pages/DeliveryShow';
/*import CampaignNew from './pages/CampaignNew';
import CampaignShow from './pages/CampaignShow';
import RequestShow from './pages/RequestShow';
import RequestNew from './pages/RequestNew';*/
import 'semantic-ui-css/semantic.min.css';

class App extends Component {
    render() {
        return (
            <Container>
                <Header />
                <main>
                    <Switch>
                        <Route exact path='/' component={Home}/>
                        <Route exact path='/deliveries/new' component={DeliveryNew}/>
                        <Route exact path='/deliveries/:address' component={DeliveryShow}/>
                        {/*<Route exact path='/campaigns/:address' component={CampaignShow}/>
                        <Route exact path='/campaigns/:address/requests' component={RequestShow}/>
                        <Route exact path='/campaigns/:address/requests/new' component={RequestNew}/>*/}
                    </Switch>
                </main>
            </Container>
        );
    }
}

export default App;
