'use strict';

// pre processing for react ssr
require('./babel');

const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/Config');
const errorHandlers = require('./errorHandlers');

// routers
const clientRouter = require('./components/client/clientRouter');
const apiRouter = require('./components/api');

const app = express();

// middleware
if(process.env.NODE_ENV === 'development') {
  app.use(logger('dev'));
  app.use(cors());
}
app.use(bodyParser.json({ limit: config.get('http:request:limit') }));
app.use(bodyParser.urlencoded({ extended: false, limit: config.get('http:request:limit') }));
app.use(helmet());

// routes
app.use('/api', apiRouter);
app.use('/', clientRouter);

// errors
errorHandlers.register(app);

module.exports = app;
