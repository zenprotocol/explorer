import React, { Component } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { observer } from 'mobx-react';
import Service from './lib/Service';
import BlocksStore from './store/BlockStore';
import './App.css';
import Navbar from './components/Navbar/Navbar.jsx';
import Blocks from './routes/blocks/Blocks.jsx';
import Transactions from './routes/transactions/Transactions.jsx';

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
    const blocks = this.blocksStore.blocks;
    return (
      <BrowserRouter>
        <div className="App">
          <div className="container-fluid px-lg-5">
            <Navbar />
          </div>
          <div className="App-separator mb-3 mb-sm-4 mb-lg-5" />
          <div className="container-fluid px-lg-5">
            <Route exact path="/(|blocks)" render={() => <Blocks blocks={blocks} />} />
            <Route path="/transactions" render={() => <Transactions />} />
          </div>
        </div>
      </BrowserRouter>
    );
  }
}

export default observer(App);
