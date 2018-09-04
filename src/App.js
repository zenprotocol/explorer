import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';

import DevTools from './DevTools';

import Service from './lib/Service';
import blockStore from './store/BlockStore';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';
import Blocks from './routes/blocks/Blocks.jsx';
import Block from './routes/block/Block.jsx';
import Transaction from './routes/transaction/Transaction.jsx';
import Address from './routes/address/Address.jsx';
import Search from './routes/search/Search.jsx';
import Info from './routes/info/Info.jsx';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.fetchSyncingTimeout = this.fetchSyncingTimeout.bind(this);
  }

  componentDidMount() {
    this.fetchBlocksCount();
    blockStore.fetchMedianTime();
    this.fetchSyncingTimeout();
  }

  componentWillUnmount() {
    clearInterval(this.syncingTimer);
  }

  fetchBlocksCount() {
    Service.blocks.find({ pageSize: 1 }).then(response => {
      if (response.data.total !== blockStore.blocksCount) {
        blockStore.setBlocksCount(Number(response.data.total));
      }
    });
  }


  fetchSyncingTimeout() {
    blockStore.fetchSyncing().then(() => {
      this.syncingTimer = setTimeout(this.fetchSyncingTimeout, 60000);
    });
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
            <Route path="/search/:search" component={Search} />
            <Route path="/blockchain/info" component={Info} />
          </Switch>
        </div>
        <div className="container px-lg-5">
          <Footer />
        </div>
        <DevTools />
      </div>
    );
  }
}

export default App;
