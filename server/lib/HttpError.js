const httpStatus = require('http-status');

class HttpError extends Error {
  constructor(statusCode = 500, customMessage) {
    super(httpStatus[statusCode]);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }

    this.name = 'HttpError';
    this.status = statusCode;
    this.customMessage = customMessage;
  }
}

module.exports = HttpError;
