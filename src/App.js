import React, { Component } from 'react';
import Service from './lib/Service';
import blockStore from './store/BlockStore';
import MainRoutes from './MainRoutes.jsx';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';

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
        <div className="App-separator" />
        <div className="container px-lg-5">
          <MainRoutes />
        </div>
        <div className="container px-lg-5">
          <Footer />
        </div>
      </div>
    );
  }
}

export default App;
