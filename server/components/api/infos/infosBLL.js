'use strict';

const infosDAL = require('./infosDAL');
const getChain = require('../../../lib/getChain');
const config = require('../../../config/Config');
const BlockchainParser = require('../../../lib/BlockchainParser');

module.exports = {
  findAll: async function () {
    const [chain, allItems] = await Promise.all([
      getChain(),
      infosDAL.findAll({ attributes: ['name', 'value'] }),
    ]);

    const items = allItems.reduce((all, cur) => {
      all[cur.name] = cur.value;
      return all;
    }, {});

    const bcParser = new BlockchainParser(chain);
    items.cgpBalance = items['cgpBalance'] ? JSON.parse(items['cgpBalance']) : [];
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
  findByName: async function ({ name } = {}) {
    return await infosDAL.findByName(name);
  },
};
