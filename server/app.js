'use strict';

const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const helmet = require('helmet');
// const cors = require('cors');
const config = require('./config/Config');
const errorHandlers = require('./errorHandlers');

// routers
const testRouter = express.Router();
testRouter.route('/')
  .get((req, res, next) => {
    res.status(200).json({message: 'hello'});
  });

const app = express();

// middleware
app.use(logger('dev'));
// app.use(cors());
app.use(bodyParser.json({ limit: config.get('http:request:limit') }));
app.use(bodyParser.urlencoded({ extended: false, limit: config.get('http:request:limit') }));
app.use(helmet());

// routes
app.use('/test', testRouter);

// errors
errorHandlers.register(app);

module.exports = app;
