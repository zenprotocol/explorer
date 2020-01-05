const path = require('path');
const fs = require('fs');
const tags = require('common-tags');
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter as Router } from 'react-router-dom';
import { useStaticRendering, Provider } from 'mobx-react';
import { Helmet } from 'react-helmet';
import Loadable from 'react-loadable';
import manifest from '../../../build/asset-manifest.json';
import getInitialStoreState from './getInitialStoreState';
const wrapAsync = require('../../lib/wrapAsyncForExpressErrors');
import RootStore from '../../../src/store/RootStore';
import App from '../../../src/App';
const config = require('../../config/Config');
const getAnalyticsScript = require('./analyticsScript');

const extractAssets = (assets, chunks, extension) =>
  Object.keys(assets)
    .filter(asset => chunks.indexOf(asset.replace(`.${extension}`, '')) > -1)
    .map(k => assets[k]);

useStaticRendering(true); // https://github.com/mobxjs/mobx-react#server-side-rendering-with-usestaticrendering

const analyticsScript = getAnalyticsScript({ googleTrackingId: config.get('GOOGLE_TRACKING_ID') });
module.exports = wrapAsync(async (req, res) => {
  const filePath = path.resolve(__dirname, '..', '..', '..', 'build', 'index.html');
  const initialState = await getInitialStoreState(req);
  const rootStore = new RootStore(initialState);
  const initialStateScript = tags.oneLine`
  <script>
      window.__INITIAL_STATE__ = JSON.parse(${JSON.stringify(JSON.stringify(initialState))});
  </script>
  `;
  const htmlData = fs.readFileSync(filePath, { encoding: 'utf8' });
  // render the app as a string
  const modules = [];
  const context = {};
  const html = ReactDOMServer.renderToString(
    <Loadable.Capture report={m => modules.push(m)}>
      <Provider rootStore={rootStore}>
        <Router location={req.url} context={context}>
          <App />
        </Router>
      </Provider>
    </Loadable.Capture>
  );
  const helmet = Helmet.renderStatic();

  const extraChunksScripts = extractAssets(
    manifest,
    modules.map(module => module.substring(module.lastIndexOf('/') + 1)),
    'js'
  ).map(c => `<script type="text/javascript" src="${c}"></script>`);
  const extraChunksStyles = extractAssets(
    manifest,
    modules.map(module => module.substring(module.lastIndexOf('/') + 1)),
    'css'
  ).map(c => `<link rel="stylesheet" href="${c}">`);

  if (context.url) {
    res.redirect(301, context.url);
  } else {
    // inject the rendered app into our html and send it
    res.send(
      htmlData
        .replace('<title></title>', helmet.title.toString())
        .replace(
          '</head>',
          extraChunksStyles.join('') + initialStateScript + analyticsScript + helmet.link.toString() + '</head>'
        )
        .replace(
          '<div id="root"></div>',
          `<div id="root">${html}</div>${extraChunksScripts.join('')}`
        )
    );
  }
});
