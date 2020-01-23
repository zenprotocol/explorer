'use strict';

const infosDAL = require('./infosDAL');
const transactionsDAL = require('../transactions/transactionsDAL');
const blocksBLL = require('../blocks/blocksBLL');
const cgpBLL = require('../cgp/cgpBLL');
const cgpUtils = require('../cgp/cgpUtils');
const getChain = require('../../../lib/getChain');

module.exports = {
  findAll: async function() {
    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const currentInterval = cgpUtils.getIntervalByBlockNumber(chain, currentBlock);

    const [allItems, transactionsCount, cgpBalance, cgpAllocation] = await Promise.all([
      infosDAL.findAll({ attributes: ['name', 'value'] }),
      transactionsDAL.count(),
      cgpBLL.findCgpBalance(),
      cgpBLL.findWinnerAllocation({interval: currentInterval - 1, chain}),
    ]);

    const items = allItems.reduce((all, cur) => {
      all[cur.name] = cur.value;
      return all;
    }, {});

    items.transactions = transactionsCount;
    items.cgpBalance = cgpBalance;
    items.cgpAllocation = cgpAllocation;

    return items;
  },
  findByName: async function({name} = {}) {
    return await infosDAL.findByName(name);
  },
};
