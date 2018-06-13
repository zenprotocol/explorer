'use strict';

const path = require('path');
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const helmet = require('helmet');
// const cors = require('cors');
const config = require('./config/Config');
const errorHandlers = require('./errorHandlers');

// routers
const clientRouter = express.Router();
clientRouter.route('/')
  .get((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
  });

const app = express();

// middleware
app.use(logger('dev'));
// app.use(cors());
app.use(bodyParser.json({ limit: config.get('http:request:limit') }));
app.use(bodyParser.urlencoded({ extended: false, limit: config.get('http:request:limit') }));
app.use(helmet());
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
console.log(path.join(__dirname, '..', 'client', 'build'));
// routes
app.use('/', clientRouter);

// errors
errorHandlers.register(app);

module.exports = app;
