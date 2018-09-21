import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Blocks from './routes/blocks/Blocks.jsx';
import Block from './routes/block/Block.jsx';
import Transaction from './routes/transaction/Transaction.jsx';
import Address from './routes/address/Address.jsx';
import Search from './routes/search/Search.jsx';
import Info from './routes/info/Info.jsx';
import Chart from './routes/chart/Chart.jsx';
import BroadcastTx from './routes/broadcastTx/BroadcastTx.jsx';

export default function MainRoutes() {
  return (
    <React.Fragment>
      <Switch>
        <Route exact path="/(|blocks)" component={Blocks} />
        <Route path="/blocks/:id" component={Block} />
        <Route path="/tx/:hash" component={Transaction} />
        <Route path="/address/:address/:asset?" component={Address} />
        <Route path="/search/:search" component={Search} />
        <Route path="/blockchain/info" component={Info} />
        <Route path="/charts/:name" component={Chart} />
        <Route path="/broadcastTx/:hex?" component={BroadcastTx} />
      </Switch>
    </React.Fragment>
  );
}
