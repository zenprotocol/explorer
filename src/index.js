import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import Loadable from 'react-loadable';
import {Provider} from 'mobx-react';
import RootStore from './store/RootStore';
import App from './App.js';
import './polyfills';
import './style/index.scss';
import * as serviceWorker from './serviceWorker';

const Main = (
  <Provider rootStore={new RootStore(window.__INITIAL_STATE__)}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);
const root = document.getElementById('root');
if (root.hasChildNodes() === true) {
  Loadable.preloadReady().then(() => {
    ReactDOM.hydrate(Main, root);
  });
} else {
  ReactDOM.render(Main, root);
}
serviceWorker.register();
