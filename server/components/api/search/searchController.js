'use strict';

const httpStatus = require('http-status');
const blocksDAL = require('../blocks/blocksDAL');
const transactionsDAL = require('../transactions/transactionsDAL');
const addressesDAL = require('../addresses/addressesDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');

const NOT_VALID_REGEX = /[^a-zA-Z\d.]/g;

function isSearchStringValid(searchString) {
  return (
    searchString &&
      searchString.length >= 3 &&
      !NOT_VALID_REGEX.test(searchString) &&
      searchString !== 'zen' &&
      searchString !== 'zen1' &&
      (searchString.indexOf('zen1') !== 0 || searchString.length >= 7)
  );
}

function getSearchPromises(search, limit) {
  const searchFor = {
    blocks: true,
    transactions: true,
    addresses: true,
  };

  if (search.startsWith('zen1')) {
    searchFor.blocks = false;
    searchFor.transactions = false;
  }
  // else if (!isNaN(Number(search)) && search.length < 7) {
  //   searchFor.addresses = false;
  //   searchFor.transactions = false;
  // }

  return [
    searchFor.blocks ? blocksDAL.search(search, limit) : Promise.resolve([0, []]),
    searchFor.transactions ? transactionsDAL.search(search, limit) : Promise.resolve([0, []]),
    searchFor.addresses ? addressesDAL.search(search, limit) : Promise.resolve([0, []]),
  ];
}

module.exports = {
  index: async function(req, res) {
    let search = req.params.search;
    if (!isSearchStringValid(search)) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    search = search.trim().toLowerCase();
    const searchResultsLimit = 5;
    const [blocks, transactions, addresses] = await Promise.all(
      getSearchPromises(search, searchResultsLimit)
    );

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        total: blocks[0] + transactions[0] + addresses[0],
        items: {
          blocks: blocks[1],
          transactions: transactions[1],
          addresses: addresses[1],
        },
      })
    );
  },
};
