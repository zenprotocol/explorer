import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';

import config from './lib/Config';
import './App.css';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';
import Blocks from './routes/blocks/Blocks.jsx';
import Block from './routes/block/Block.jsx';
import blockStore from './store/BlockStore';
import Transaction from './routes/transaction/Transaction.jsx';
import Address from './routes/address/Address.jsx';

class App extends Component {
  componentDidMount() {
    blockStore.fetchMedianTime();
    blockStore.fetchBlocks();
    blockStore.fetchSyncing();
    this.syncingTimer = setInterval(() => {
      // I prefer to do async polling with setTimeout callback,
      // so if one call gets longer to process, or the server is swamped,
      // we are not firing any more requests until we get an answer,
      // so w eguarantee there's always one request active at a time
      blockStore.fetchSyncing();
      // I would hradcode the time right here, this is unlikely to be used anywhere else
    }, config.time.intervals.syncing);
  }

  componentWillUnmount() {
    clearInterval(this.syncingTimer);
  }

  render() {
    return (
      <div className="App">
        <div className="container px-lg-5">
          <Navbar />
        </div>
        <div className="App-separator mb-3 mb-sm-4 mb-lg-5" />
        <div className="container px-lg-5">
          <Switch>
            <Route exact path="/(|blocks)" component={Blocks} />
            <Route path="/blocks/:id" component={Block} />
            <Route path="/tx/:hash" component={Transaction} />
            <Route path="/address/:address/:asset?" component={Address} />
          </Switch>
        </div>
        <div className="container px-lg-5">
          <Footer />
        </div>
      </div>
    );
  }
}

export default App;
