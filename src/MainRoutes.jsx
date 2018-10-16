import React from 'react';
import { Route, Switch } from 'react-router-dom';
import NotFound from './pages/notFound/NotFound.jsx';
import Blocks from './pages/blocks/Blocks.jsx';
import Block from './pages/block/Block.jsx';
import Transaction from './pages/transaction/Transaction.jsx';
import Address from './pages/address/Address.jsx';
import Contract from './pages/contract/Contract.jsx';
import Search from './pages/search/Search.jsx';
import Info from './pages/info/Info.jsx';
import Chart from './pages/chart/Chart.jsx';
import BroadcastTx from './pages/broadcastTx/BroadcastTx.jsx';
import Oracle from './pages/oracle/Oracle.jsx';
import ContractTemplates from './pages/contractTemplates/ContractTemplates.jsx';

export default function MainRoutes() {
  return (
    <Switch>
      <Route exact path="/(|blocks)" component={Blocks} />
      <Route path="/blocks/:id" component={Block} />
      <Route path="/tx/:hash" component={Transaction} />
      <Route path="/address/:address" component={Address} />
      <Route path="/contract/:address" component={Contract} />
      <Route path="/templates/contract" component={ContractTemplates} />
      <Route path="/templates/contract/:id" component={ContractTemplates} />
      <Route path="/search/:search" component={Search} />
      <Route path="/blockchain/info" component={Info} />
      <Route path="/charts/:name" component={Chart} />
      <Route path="/broadcastTx/:hex?" component={BroadcastTx} />
      <Route path="/oracle" component={Oracle} />
      <Route component={NotFound} />
    </Switch>
  );
}
