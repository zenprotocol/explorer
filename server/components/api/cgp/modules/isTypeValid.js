'use strict';

module.exports = function isTypeValid(type) {
  return ['payout', 'allocation'].includes(type.toLowerCase());
};
