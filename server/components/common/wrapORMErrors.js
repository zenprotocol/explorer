'use strict';

const DatabaseError = require('./DatabaseError');
const ValidationError = require('./ValidationError');

module.exports = function(error) {
  // all we care about is a validation error, all others will be a DatabaseError
  if(error && error.name && error.name == 'SequelizeValidationError') {
    return new ValidationError(error);
  }

  return new DatabaseError(error);
};
