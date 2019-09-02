'use strict';

const config = require('../../../config/Config');
const getChain = require('../../../lib/getChain');
const BlockchainParser = require('../../../lib/BlockchainParser');
const cgpDAL = require('./cgpDAL');
const blocksBLL = require('../blocks/blocksBLL');
const addressesBLL = require('../addresses/addressesBLL');
const createQueryObject = require('../../../lib/createQueryObject');
const cgpUtils = require('./cgpUtils');
const formatInterval = require('./modules/formatInterval');
const isTypeValid = require('./modules/isTypeValid');
const {
  getAllocationBallotContent,
  getPayoutBallotContent,
} = require('./modules/getBallotContent');
const addBallotContentToResults = require('./modules/addBallotContentToResults');

const CGP_FUND_CONTRACT_ID = config.get('CGP_FUND_CONTRACT_ID');

module.exports = {
  findIntervalAndTally: async function({ interval } = {}) {
    const formattedInterval = formatInterval(interval);
    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const relevant = cgpUtils.getRelevantIntervalBlocks(chain, formattedInterval, currentBlock);

    const { interval: currentInterval } = cgpUtils.getRelevantIntervalBlocks(
      chain,
      null,
      currentBlock
    );
    if (relevant.interval > currentInterval) {
      // does not return future intervals
      return null;
    }

    const [winnerPayout, winnerAllocation] = await Promise.all([
      cgpDAL.findWinner({ type: 'payout', snapshot: relevant.snapshot, tally: relevant.tally }),
      cgpDAL.findWinner({ type: 'allocation', snapshot: relevant.snapshot, tally: relevant.tally }),
    ]);

    return {
      interval: relevant.interval,
      snapshot: relevant.snapshot,
      tally: relevant.tally,
      winnerAllocation,
      winnerPayout,
    };
  },
  findAllVotesByInterval: async function({ interval, type, page = 0, pageSize = 10 } = {}) {
    if (!isTypeValid(type)) return null;

    const formattedInterval = formatInterval(interval);

    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const { snapshot, tally } = cgpUtils.getRelevantIntervalBlocks(
      chain,
      formattedInterval,
      currentBlock
    );

    const query = Object.assign(
      {},
      { snapshot, tally, type },
      createQueryObject({ page, pageSize })
    );
    return await Promise.all([
      cgpDAL.countVotesInInterval({ snapshot, tally, type }),
      cgpDAL.findAllVotesInInterval(query).then(addBallotContentToResults(type)),
    ]).then(cgpDAL.getItemsAndCountResult);
  },
  findAllVoteResults: async function({ interval, type, page = 0, pageSize = 10 } = {}) {
    if (!isTypeValid(type)) return null;

    const formattedInterval = formatInterval(interval);

    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const { snapshot, tally } = cgpUtils.getRelevantIntervalBlocks(
      chain,
      formattedInterval,
      currentBlock
    );

    return await Promise.all([
      cgpDAL.countAllVoteResults({ snapshot, tally, type }),
      cgpDAL.findAllVoteResults(
        Object.assign({}, { snapshot, tally, type }, createQueryObject({ page, pageSize }))
      ).then(addBallotContentToResults(type)),
    ]).then(cgpDAL.getItemsAndCountResult);
  },
  findAllBallots: async function({ type, page = 0, pageSize = 10 }) {
    if (!isTypeValid(type)) return null;

    const chain = await getChain();
    const intervalLength = cgpUtils.getIntervalLength(chain);

    return await Promise.all([
      cgpDAL.countAllBallots({ type, intervalLength }),
      cgpDAL.findAllBallots(
        Object.assign({}, { type, intervalLength }, createQueryObject({ page, pageSize }))
      ),
    ]).then(cgpDAL.getItemsAndCountResult);
  },
  findZpParticipated: async function({ interval, type }) {
    if (!isTypeValid(type)) return null;

    const formattedInterval = formatInterval(interval);

    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const { snapshot, tally } = cgpUtils.getRelevantIntervalBlocks(
      chain,
      formattedInterval,
      currentBlock
    );

    return cgpDAL.findZpParticipated({ snapshot, tally, type });
  },
  findCgpBalance: async function({ blockNumber } = {}) {
    const chain = await getChain();
    const blockchainParser = new BlockchainParser(chain);

    const contractAddress = blockchainParser.getAddressFromContractId(CGP_FUND_CONTRACT_ID);

    return addressesBLL.balance({ address: contractAddress, blockNumber });
  },
  getPayoutBallotContent: async function({ ballot } = {}) {
    return getPayoutBallotContent({ ballot });
  },
  getAllocationBallotContent: async function({ ballot } = {}) {
    return getAllocationBallotContent({ ballot });
  },
};
