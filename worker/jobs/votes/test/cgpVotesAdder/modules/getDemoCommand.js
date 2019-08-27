'use strict';

const CONTRACT_ID = require('./contractId');

function getDemoCommand({ id = 1, command = 'Payout', messageBody } = {}) {
  return {
    id: String(id),
    command,
    messageBody,
    indexInTransaction: 0,
    ContractId: CONTRACT_ID,
  };
}

module.exports = getDemoCommand;