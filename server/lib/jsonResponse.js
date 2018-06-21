'use strict';

const httpStatus = require('http-status');
/**
 * Create a nicely formatted json response
 * 
 * @param {number} statusCode 
 * @param {object} [results=null] 
 * @param {any} [err=null] 
 * @returns 
 */
const createJsonResponse = (statusCode, results = null, err = null) => {
  let errorObj = null;
  if (statusCode >= 400) {
    errorObj = {
      message: httpStatus[statusCode],
      error: err,
    };
  }

  return {
    success: !errorObj,
    error: errorObj,
    results: results,
  };
};

module.exports = { create: createJsonResponse };
