import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { inject } from 'mobx-react';
import Service from './lib/Service';
import MainRoutes from './MainRoutes.jsx';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TestnetBar from './components/TestnetBar';

import './App.scss';

class App extends Component {
  constructor(props) {
    super(props);

    this.fetchSyncingTimeout = this.fetchSyncingTimeout.bind(this);
  }

  get infoStore() {
    return this.props.rootStore.infoStore;
  }
  get blockStore() {
    return this.props.rootStore.blockStore;
  }
  get uiStore() {
    return this.props.rootStore.uiStore;
  }

  componentDidMount() {
    this.infoStore.loadInfos();
    this.fetchBlocksCount();
    this.fetchSyncingTimeout();
  }

  componentWillUnmount() {
    clearInterval(this.syncingTimer);
  }

  fetchBlocksCount() {
    Service.blocks.count().then(response => {
      if (Number(response.data) !== this.blockStore.blocksCount) {
        this.blockStore.setBlocksCount(Number(response.data));
      }
    });
  }

  fetchSyncingTimeout() {
    this.uiStore.fetchSyncing().then(() => {
      this.syncingTimer = setTimeout(this.fetchSyncingTimeout, 60000);
    });
  }

  render() {
    return (
      <div className="App">
        <TestnetBar />
        <div className="navbar-container">
          <Navbar />
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

App.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(App);
