'use strict';
import { inspect } from 'util';

const httpStatus = require('http-status');
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
      error: inspect(err, false, 1),
    };
  }

  return {
    success: !errorObj,
    error: errorObj,
    data: data,
  };
};

module.exports = { create: createJsonResponse };
