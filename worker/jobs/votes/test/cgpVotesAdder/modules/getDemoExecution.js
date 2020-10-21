'use strict';

const CONTRACT_ID = require('./cgpAdderParams').contractIdVoting;

function getDemoExecution({ id = 1, command = 'Payout', messageBody } = {}) {
  return {
    contractId: CONTRACT_ID,
    id: String(id),
    command,
    messageBody,
    indexInTx: 0,
  };
}

module.exports = getDemoExecution;