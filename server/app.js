'use strict';

const express = require('express');
const morgan = require('morgan');
const logger = require('./lib/logger');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('./lib/cors');
const config = require('./config/Config');
const errorHandlers = require('./errorHandlers');

// routers
const clientRouter = require('./components/client/clientRouter');
const apiRouter = require('./components/api');
const sitemapsRouter = require('./components/sitemaps/sitemapRoutes');

const app = express();
app.use(compression());

// middleware
app.use(
  morgan(
    ':remote-addr ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
    { stream: logger.stream }
  )
);

cors.setup(app);

app.use(bodyParser.json({ limit: config.get('http:request:limit') }));
app.use(
  bodyParser.urlencoded({
    extended: false,
    limit: config.get('http:request:limit')
  })
);
app.use(helmet());

// routes
app.use('/api', apiRouter);
app.use('/sitemaps', sitemapsRouter);
app.get('/.well-known/pki-validation/confirmation.html', (req, res) => {
  res.send('E476-F512-0D78-51F5-66BA-2D18-2F70-2E0B');
});
app.use('/', clientRouter);

// errors
errorHandlers.register(app);

module.exports = app;
