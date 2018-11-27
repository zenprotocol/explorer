import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import Loadable from 'react-loadable';
import App from './App.js';
import './polyfills';
import './style/index.css';
// import registerServiceWorker from './registerServiceWorker';
const Main = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
const root = document.getElementById('root');
if (root.hasChildNodes() === true) {
  Loadable.preloadReady().then(() => {
    ReactDOM.hydrate(Main, root);
  });
} else {
  ReactDOM.render(Main, root);
}
// registerServiceWorker();
