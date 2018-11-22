import React from 'react';
import { Route, Switch } from 'react-router-dom';
import NotFound from './pages/notFound';
import Blocks from './pages/blocks';
import Block from './pages/block';
import Transaction from './pages/transaction';
import Address from './pages/address';
import Contract from './pages/contract';
import Contracts from './pages/contracts';
import Search from './pages/search';
import Info from './pages/info';
import Chart from './pages/chart';
import BroadcastTx from './pages/broadcastTx';
import Oracle from './pages/oracle';
import {ContractTemplates, CreateContractTemplate} from './pages/contractTemplates';
import Assets from './pages/assets';
import Asset from './pages/asset';

export default function MainRoutes() {
  return (
    <Switch>
      <Route exact path="/(|blocks)" component={Blocks} />
      <Route path="/blocks/:id" component={Block} />
      <Route path="/tx/:hash" component={Transaction} />
      <Route path="/address/:address" component={Address} />
      <Route path="/contracts" exact={true} component={Contracts} />
      <Route path="/contracts/:address" component={Contract} />
      <Route path="/templates/contract" exact component={ContractTemplates} />
      <Route path="/templates/contract/:slug" component={CreateContractTemplate} />
      <Route path="/search/:search" component={Search} />
      <Route path="/blockchain/info" component={Info} />
      <Route path="/charts/:name" component={Chart} />
      <Route path="/broadcastTx/:hex?" component={BroadcastTx} />
      <Route path="/oracle" component={Oracle} />
      <Route path="/assets" exact={true} component={Assets} />
      <Route path="/assets/:asset" component={Asset} />
      <Route component={NotFound} />
    </Switch>
  );
}
