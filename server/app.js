'use strict';

// pre processing for react ssr
require('ignore-styles');
require('asset-require-hook')({
  extensions: [
    'jpg', 'jpeg', 'png', 'gif', 'bmp'
  ],
  name: '/static/media/[name].[hash:8].[ext]',
  limit: 10000
});
require('asset-require-hook')({
  extensions: [
    'svg'
  ],
  name: '/static/media/[name].[hash:8].[ext]',
});
require('url-loader');
require('file-loader');
require('babel-register')({
  ignore: [/(build|node_modules)/],
  presets: ['env', 'react-app'],
});

const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const helmet = require('helmet');
// const cors = require('cors');
const config = require('./config/Config');
const errorHandlers = require('./errorHandlers');

// routers
const clientRouter = require('./components/client/clientRouter');

const app = express();

// middleware
app.use(logger('dev'));
// app.use(cors());
app.use(bodyParser.json({ limit: config.get('http:request:limit') }));
app.use(bodyParser.urlencoded({ extended: false, limit: config.get('http:request:limit') }));
app.use(helmet());

// routes
app.use('/', clientRouter);

// errors
errorHandlers.register(app);

module.exports = app;
