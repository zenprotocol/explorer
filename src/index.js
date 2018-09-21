import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './App.js';
import ScrollToTop from './components/scroll/ScrollToTop.jsx';
import './polyfills';
import './style/index.css';
import './index.css';
// import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(
  <BrowserRouter>
    <ScrollToTop>
      <App />
    </ScrollToTop>
  </BrowserRouter>,
  document.getElementById('root')
);
// registerServiceWorker();
