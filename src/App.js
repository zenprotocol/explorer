import React, { Component } from 'react';
import { Route } from 'react-router-dom';

import './App.css';
import Navbar from './components/Navbar/Navbar.jsx';
import Blocks from './routes/blocks/Blocks.jsx';
import Block from './routes/block/Block.jsx';
import blockStore from './store/BlockStore';
// import Transactions from './routes/transactions/Transactions.jsx';

class App extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    blockStore.fetchMedianTime();
    blockStore.fetchBlocks();
  }

  render() {
    return (
      <div className="App">
        <div className="container-fluid px-lg-5">
          <Navbar />
        </div>
        <div className="App-separator mb-3 mb-sm-4 mb-lg-5" />
        <div className="container-fluid px-lg-5">
          <Route exact path="/(|blocks)" component={Blocks} />
          <Route path="/blocks/:id" component={Block} />
          {/* <Route path="/transactions" component={Transactions} /> */}
        </div>
      </div>
    );
  }
}

export default App;
