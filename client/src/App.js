import React, { Component } from 'react';
import {observer} from 'mobx-react';
import Service from './lib/Service';
import BlocksStore from './store/BlockStore';
import logo from './logo_big.png';
import './App.css';
import BlocksTable from './components/BlocksTable';

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
          <h1>LATEST BLOCKS</h1>
          <BlocksTable blocks={this.blocksStore.blocks} />
        </div>
      </div>
    );
  }
}

export default observer(App);
