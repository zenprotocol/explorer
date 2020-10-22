import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import Loadable from 'react-loadable';
import AsyncComponentLoading from './components/AsyncComponentLoading';
import config from './lib/Config';
import Blocks from './pages/blocks'; // we want blocks pre loaded
import Info from './pages/info'; // this is the default page - pre load as well

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
const Governance = Loadable({
  loader: () => import(/* webpackChunkName: "governance" */ './pages/governance'),
  loading: AsyncComponentLoading,
  delay,
});
const CGP = Loadable({
  loader: () => import(/* webpackChunkName: "cgp" */ './pages/cgp'),
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
      <Route path="/(|blockchain/info)" component={Info} />
      <Route exact path="/blocks" component={Blocks} />
      <Route path="/blocks/:id" component={Block} />
      <Route path="/tx/:hash" component={Transaction} />
      <Route path="/address/:address" component={Address} />
      <Route path="/contracts" exact={true} component={Contracts} />
      <Route path="/contracts/:address" component={Contract} />
      <Route path="/search/:search" component={Search} />
      <Route path="/charts/:name" component={Chart} />
      <Route path="/broadcastTx/:hex?" component={BroadcastTx} />
      <Route path="/assets" exact={true} component={Assets} />
      <Route path="/assets/:asset" component={Asset} />
      <Route path="/governance/:interval/:phase" component={Governance} />
      <Route path="/cgp/:interval/:phase" component={CGP} />
      <Redirect from="/governance" to="/governance/0/Contestant" />
      <Redirect from="/cgp/:interval" to="/cgp/:interval/Nomination" />
      <Redirect from="/cgp" to="/cgp/0/0" />
      <Route component={NotFound} />
    </Switch>
  );
}
