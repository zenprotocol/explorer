'use strict';

const httpStatus = require('http-status');
const blocksDAL = require('../blocks/blocksDAL');
const transactionsDAL = require('../transactions/transactionsDAL');
const addressesDAL = require('../addresses/addressesDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');

function isSearchStringValid(searchString) {
  return searchString && searchString.length >= 3;
}

module.exports = {
  index: async function(req, res) {
    let search = req.params.search;
    if (!isSearchStringValid(search)) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    search = search.trim().toLowerCase();

    const [blocks, transactions, addresses] = await Promise.all([
      blocksDAL.search(search),
      transactionsDAL.search(search),
      addressesDAL.search(search),
    ]);

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
