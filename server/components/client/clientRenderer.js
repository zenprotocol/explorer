import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter as Router} from 'react-router-dom';
import { useStaticRendering } from 'mobx-react';
const path = require('path');
const fs = require('fs');

useStaticRendering(true);
// import our main App component
import App from '../../../src/App';
module.exports = (req, res, next) => {
  const filePath = path.resolve(__dirname, '..', '..', '..', 'build', 'index.html');

  try {
    const htmlData = fs.readFileSync(filePath, { encoding: 'utf8' });
    // render the app as a string
    const context = {};
    const html = ReactDOMServer.renderToString(
      (<Router
        location={req.url}
        context={context}
      >
        <App />
      </Router>)
    );

    if (context.url) {
      res.redirect(301, context.url);
    } else {
      // inject the rendered app into our html and send it
      res.send(htmlData.replace('<div id="root"></div>', `<div id="root">${html}</div>`));
    }
  } catch (err) {
    next(err);
  }
};
