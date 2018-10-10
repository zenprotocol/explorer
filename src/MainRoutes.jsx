import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Blocks from './pages/blocks/Blocks.jsx';
import Block from './pages/block/Block.jsx';
import Transaction from './pages/transaction/Transaction.jsx';
import Address from './pages/address/Address.jsx';
import Contract from './pages/contract/Contract.jsx';
import Search from './pages/search/Search.jsx';
import Info from './pages/info/Info.jsx';
import Chart from './pages/chart/Chart.jsx';
import BroadcastTx from './pages/broadcastTx/BroadcastTx.jsx';
import NotFound from './pages/notFound/NotFound.jsx';

export default function MainRoutes() {
  return (
    <Switch>
      <Route exact path="/(|blocks)" component={Blocks} />
      <Route path="/blocks/:id" component={Block} />
      <Route path="/tx/:hash" component={Transaction} />
      <Route path="/address/:address" component={Address} />
      <Route path="/contract/:address" component={Contract} />
      <Route path="/search/:search" component={Search} />
      <Route path="/blockchain/info" component={Info} />
      <Route path="/charts/:name" component={Chart} />
      <Route path="/broadcastTx/:hex?" component={BroadcastTx} />
      <Route component={NotFound} />
    </Switch>
  );
}
