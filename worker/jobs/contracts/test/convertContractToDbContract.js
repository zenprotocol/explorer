'use strict';

const blockchainToDb = {
  contractId: 'id',
  address: 'address',
  expire: 'expiryBlock',
  code: 'code',
};

/**
 * Changes the contract keys to match the ones in the db
 *
 * @param {Object} contract
 * @returns {Object}
 */
module.exports = function(contract) {
  return Object.entries(contract).reduce((dbContract, cur) => {
    const key = cur[0];
    const value = cur[1];

    dbContract[blockchainToDb[key]] = value;
    return dbContract;
  }, {});
}