'use strict';

const util = require('util');
const httpStatus = require('http-status');

const isDev = process.env.NODE_ENV === 'development';

/**
 * Create a nicely formatted json response
 *
 * @param {number} statusCode
 * @param {object} [data=null]
 * @param {any} [err=null]
 * @returns
 */
const createJsonResponse = (statusCode, data = null, err = null) => {
  let errorObj = null;
  if (statusCode >= 400) {
    errorObj = {
      message: httpStatus[statusCode],
      customMessage: err.customMessage,
      error: isDev ? util.inspect(err, false, 1) : `${err.name}: ${err.message}`,
    };
  }

  return {
    success: !errorObj,
    error: errorObj,
    data: data,
  };
};

module.exports = { create: createJsonResponse };
