import React, { Component } from 'react';
import {observer} from 'mobx-react';
import Service from './lib/Service';
import BlocksStore from './store/BlockStore';
import './App.css';
import Navbar from './components/Navbar/Navbar.jsx';
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
        <div className="container-fluid px-lg-5">
          <Navbar />
        </div>
        <div className="App-separator mb-3 mb-sm-4 mb-lg-5"></div>
        <div className="container-fluid px-lg-5">
          <div className="App-table-container border-left border-primary pl-lg-4 position-relative">
            <BlocksTable blocks={this.blocksStore.blocks} title="LATEST BLOCKS" />
          </div>
        </div>
      </div>
    );
  }
}

export default observer(App);
