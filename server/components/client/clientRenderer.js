const path = require('path');
const fs = require('fs');
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter as Router } from 'react-router-dom';
import { useStaticRendering } from 'mobx-react';
import Loadable from 'react-loadable';
import manifest from '../../../build/asset-manifest.json';

const extractAssets = (assets, chunks) =>
  Object.keys(assets)
    .filter(asset => chunks.indexOf(asset.replace('.js', '')) > -1)
    .map(k => assets[k]);

useStaticRendering(true);
// import our main App component
import App from '../../../src/App';
module.exports = (req, res, next) => {
  const filePath = path.resolve(__dirname, '..', '..', '..', 'build', 'index.html');

  try {
    const htmlData = fs.readFileSync(filePath, { encoding: 'utf8' });
    // render the app as a string
    const modules = [];
    const context = {};
    const html = ReactDOMServer.renderToString(
      <Loadable.Capture report={m => modules.push(m)}>
        <Router location={req.url} context={context}>
          <App />
        </Router>
      </Loadable.Capture>
    );

    // then, after Loadable.Capture
    const extraChunks = extractAssets(
      manifest,
      modules.map(module => module.substring(module.lastIndexOf('/') + 1))
    ).map(c => `<script type="text/javascript" src="/public/${c}"></script>`);

    if (context.url) {
      res.redirect(301, context.url);
    } else {
      // inject the rendered app into our html and send it
      res.send(
        htmlData
          .replace('<div id="root"></div>', `<div id="root">${html}</div>${extraChunks.join('')}`)
      );
    }
  } catch (err) {
    next(err);
  }
};
