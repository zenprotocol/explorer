import React, { Component } from 'react';
import {observer} from 'mobx-react';
import Service from './lib/Service';
import BlocksStore from './store/BlockStore';
import logo from './logo_big.png';
import './App.css';
import BlocksTable from './components/BlocksTable/BlocksTable.jsx';

class App extends Component {
  constructor(props) {
    super(props);
    this.blocksStore = new BlocksStore();
  }

  componentDidMount() {
    Service.blocks.find().then(response => {
      this.blocksStore.setBlocks(response.data);
    });
  }

  render() {
    return (
      <div className="App">
        <div className="container">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" /> 
            MENU
          </header>
        </div>
        <div className="container">
          <div className="App-table-container border-left border-primary pl-lg-4 position-relative">
            <BlocksTable blocks={this.blocksStore.blocks} title="LATEST BLOCKS" />
          </div>
        </div>
      </div>
    );
  }
}

export default observer(App);
