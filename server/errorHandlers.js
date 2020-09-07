'use strict';

const jsonResponse = require('./lib/jsonResponse');

const register = app => {
  app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handler
  app.use(function(err, req, res, next) {
    const statusCode = err.status || 500;
    console.log(err);
    res.status(statusCode).json(jsonResponse.create(statusCode, null, err));
  });
};

module.exports = {register};
