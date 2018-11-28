import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Loadable from 'react-loadable';
import AsyncComponentLoading from './components/AsyncComponentLoading';
import config from './lib/Config';
import Blocks from './pages/blocks'; // we want blocks pre loaded

const {delay} = config.loadable;

const Block = Loadable({
  loader: () => import(/* webpackChunkName: "block" */ './pages/block'),
  loading: AsyncComponentLoading,
  delay,
});
const Transaction = Loadable({
  loader: () => import(/* webpackChunkName: "transaction" */ './pages/transaction'),
  loading: AsyncComponentLoading,
  delay,
});
const Address = Loadable({
  loader: () => import(/* webpackChunkName: "address" */ './pages/address'),
  loading: AsyncComponentLoading,
  delay,
});
const Contract = Loadable({
  loader: () => import(/* webpackChunkName: "contract" */ './pages/contract'),
  loading: AsyncComponentLoading,
  delay,
});
const Contracts = Loadable({
  loader: () => import(/* webpackChunkName: "contracts" */ './pages/contracts'),
  loading: AsyncComponentLoading,
  delay,
});
const Search = Loadable({
  loader: () => import(/* webpackChunkName: "search" */ './pages/search'),
  loading: AsyncComponentLoading,
  delay,
});
const Info = Loadable({
  loader: () => import(/* webpackChunkName: "info" */ './pages/info'),
  loading: AsyncComponentLoading,
  delay,
});
const Chart = Loadable({
  loader: () => import(/* webpackChunkName: "chart" */ './pages/chart'),
  loading: AsyncComponentLoading,
  delay,
});
const BroadcastTx = Loadable({
  loader: () => import(/* webpackChunkName: "broadcastTx" */ './pages/broadcastTx'),
  loading: AsyncComponentLoading,
  delay,
});
const Oracle = Loadable({
  loader: () => import(/* webpackChunkName: "oracle" */ './pages/oracle'),
  loading: AsyncComponentLoading,
  delay,
});
const Assets = Loadable({
  loader: () => import(/* webpackChunkName: "assets" */ './pages/assets'),
  loading: AsyncComponentLoading,
  delay,
});
const Asset = Loadable({
  loader: () => import(/* webpackChunkName: "asset" */ './pages/asset'),
  loading: AsyncComponentLoading,
  delay,
});
const ContractTemplates = Loadable({
  loader: () =>
    import(/* webpackChunkName: "contractTemplatesContainer" */ './pages/contractTemplates/ContractTemplatesContainer.jsx'),
  loading: AsyncComponentLoading,
  delay,
});
const CreateContractTemplate = Loadable({
  loader: () =>
    import(/* webpackChunkName: "createContractTemplateContainer" */ './pages/contractTemplates/CreateContractTemplateContainer.jsx'),
  loading: AsyncComponentLoading,
  delay,
});
const NotFound = Loadable({
  loader: () => import(/* webpackChunkName: "notFound" */ './pages/notFound'),
  loading: AsyncComponentLoading,
  delay,
});

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
