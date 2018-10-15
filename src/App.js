import React, { Component } from 'react';
import Service from './lib/Service';
import blockStore from './store/BlockStore';
import uiStore from './store/UIStore';
import MainRoutes from './MainRoutes.jsx';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.fetchSyncingTimeout = this.fetchSyncingTimeout.bind(this);
  }

  componentDidMount() {
    this.fetchBlocksCount();
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
    uiStore.fetchSyncing().then(() => {
      this.syncingTimer = setTimeout(this.fetchSyncingTimeout, 60000);
    });
  }

  render() {
    return (
      <div className="App">
        <div className="navbar-container">
          <div className="container">
            <Navbar />
          </div>
        </div>
        <div className="App-separator mb-3 mb-lg-7" />
        <div className="body-container">
          <div className="container">
            <MainRoutes />
          </div>
        </div>
        <div className="footer-container">
          <div className="container">
            <Footer />
          </div>
        </div>
      </div>
    );
  }
}

export default App;
