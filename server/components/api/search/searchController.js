'use strict';

const { Decimal } = require('decimal.js');
const httpStatus = require('http-status');
const blocksDAL = require('../blocks/blocksDAL');
const txsDAL = require('../txs/txsDAL');
const addressesDAL = require('../addresses/addressesDAL');
const contractsDAL = require('../contracts/contractsDAL');
const assetsDAL = require('../assets/assetsDAL');
const outputsDAL = require('../outputs/outputsDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const AddressUtils = require('../../../../src/common/utils/AddressUtils');
const { isSearchStringValid } = require('../../../../src/common/validations/search');

function getSearchPromises(search, limit) {
  const searchFor = {
    blocks: true,
    transactions: true,
    addresses: true,
    contracts: true,
    assets: true,
    amount: false,
  };
  let shouldMultiplyAmount = true;

  if (!isNaN(Number(search))) {
    // Numeric search
    searchFor.amount = true;
  }

  if (search.indexOf('.') !== -1) {
    searchFor.blocks = false;
    searchFor.transactions = false;
    searchFor.addresses = false;
    searchFor.contracts = false;
    searchFor.assets = false;
  } else if (AddressUtils.isAddress(search) || AddressUtils.isContract(search)) {
    searchFor.blocks = false;
    searchFor.transactions = false;
  }

  return [
    searchFor.blocks ? blocksDAL.search(search, limit) : Promise.resolve([0, []]),
    searchFor.transactions ? txsDAL.search(search, limit) : Promise.resolve([0, []]),
    searchFor.addresses ? addressesDAL.search(search, limit) : Promise.resolve([0, []]),
    searchFor.contracts ? contractsDAL.search(search, limit) : Promise.resolve([0, []]),
    searchFor.assets ? assetsDAL.search(search, limit) : Promise.resolve([0, []]),
    searchFor.amount
      ? outputsDAL.searchByAmount(
          shouldMultiplyAmount ? new Decimal(search || 0).times(100000000).floor().toNumber() : search,
          limit
        )
      : Promise.resolve([0, []]),
  ];
}

module.exports = {
  index: async function (req, res) {
    let search = req.params.search;
    if (!isSearchStringValid(search)) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    search = search.trim().toLowerCase();
    const searchResultsLimit = 5;
    const [blocks, transactions, addresses, contracts, assets, outputs] = await Promise.all(
      getSearchPromises(search, searchResultsLimit)
    );

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        total: blocks[0] + transactions[0] + addresses[0] + contracts[0] + assets[0] + outputs[0],
        items: {
          blocks: blocks[1],
          transactions: transactions[1],
          addresses: addresses[1],
          contracts: contracts[1],
          assets: assets[1],
          outputs: outputs[1],
        },
      })
    );
  },
};
