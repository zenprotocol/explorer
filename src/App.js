import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { inject } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import MainRoutes from './MainRoutes.jsx';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TestnetBar from './components/TestnetBar';
import bindEventHandlers from './lib/bindEventHandlers';
import './App.scss';

class App extends Component {
  constructor(props) {
    super(props);

    bindEventHandlers(['pollSyncing', 'pollBlocksCount'], this);
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
    if (!['/', '/blockchain/info'].includes(this.props.location.pathname)) {
      // infos should load from stats page
      this.infoStore.loadInfos();
    }
    this.pollBlocksCount();
    this.pollSyncing();
  }

  componentWillUnmount() {
    clearTimeout(this.blocksTimer);
    clearTimeout(this.syncingTimer);
  }

  pollBlocksCount() {
    this.blockStore.fetchBlocksCount().then(() => {
      this.blocksTimer = setTimeout(this.pollBlocksCount, 30000);
    });
  }

  pollSyncing() {
    this.uiStore.fetchSyncing().then(() => {
      this.syncingTimer = setTimeout(this.pollSyncing, 60000);
    });
  }

  render() {
    return (
      <div className="App">
        <div className="navbar-container fixed-top">
          <TestnetBar />
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

export default inject('rootStore')(withRouter(App));
