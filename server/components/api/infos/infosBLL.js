'use strict';

const infosDAL = require('./infosDAL');
const transactionsDAL = require('../transactions/transactionsDAL');
const blocksBLL = require('../blocks/blocksBLL');
const cgpBLL = require('../cgp/cgpBLL');
const cgpUtils = require('../cgp/cgpUtils');
const getChain = require('../../../lib/getChain');
const config = require('../../../config/Config');
const BlockchainParser = require('../../../lib/BlockchainParser');

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
      cgpBLL.findWinnerAllocation({ interval: currentInterval - 1, chain }),
    ]);

    const items = allItems.reduce((all, cur) => {
      all[cur.name] = cur.value;
      return all;
    }, {});

    const bcParser = new BlockchainParser(chain);

    items.transactions = transactionsCount;
    items.cgpBalance = cgpBalance;
    items.cgpAllocation = cgpAllocation;
    items.cgpFundContractId = config.get('CGP_FUND_CONTRACT_ID');
    items.cgpFundContractAddress = bcParser.getAddressFromContractId(
      config.get('CGP_FUND_CONTRACT_ID')
    );
    items.cgpVotingContractId = config.get('CGP_VOTING_CONTRACT_ID');
    items.cgpVotingContractAddress = bcParser.getAddressFromContractId(
      config.get('CGP_VOTING_CONTRACT_ID')
    );

    return items;
  },
  findByName: async function({ name } = {}) {
    return await infosDAL.findByName(name);
  },
};
