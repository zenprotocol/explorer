'use strict';

const config = require('../../../config/Config');
const getChain = require('../../../lib/getChain');
const BlockchainParser = require('../../../lib/BlockchainParser');
const cgpDAL = require('./cgpDAL');
const blocksBLL = require('../blocks/blocksBLL');
const addressesBLL = require('../addresses/addressesBLL');
const createQueryObject = require('../../../lib/createQueryObject');
const cgpUtils = require('./cgpUtils');
const {
  getAllocationBallotContent,
  getPayoutBallotContent,
} = require('./modules/getBallotContent');
const { addBallotContentToResults } = require('./modules/addBallotContentToResults');
const calculateWinnerAllocation = require('./modules/calculateWinnerAllocation');
const calculateWinnerPayout = require('./modules/calculateWinnerPayout');

const CGP_FUND_CONTRACT_ID = config.get('CGP_FUND_CONTRACT_ID');

module.exports = {
  findIntervalAndTally: async function({ interval, phase } = {}) {
    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const relevant = cgpUtils.getRelevantIntervalBlocks({
      chain,
      currentBlock,
      interval,
      phase,
    });

    const { interval: currentInterval } = cgpUtils.getRelevantIntervalBlocks({
      chain,
      currentBlock,
    });
    if (relevant.interval > currentInterval) {
      // does not return future intervals
      return null;
    }

    if (relevant.phase === 'Nomination') {
      const [winnersNomination, zpParticipatedNomination] = await Promise.all([
        cgpDAL.findAllNominees({
          snapshot: relevant.snapshot,
          tally: relevant.tally,
          chain,
        }).then(addBallotContentToResults({ type: 'nomination', chain })),
        cgpDAL.findZpParticipated({
          snapshot: relevant.snapshot,
          tally: relevant.tally,
          type: 'nomination',
        }),
      ]);

      return {
        ...relevant,
        winnersNomination,
        winnerAllocation: null,
        winnerPayout: null,
        zpParticipatedNomination,
        zpParticipatedAllocation: '0',
        zpParticipatedPayout: '0',
      };
    } else {
      const [
        resultsAllocation,
        resultsPayout,
        zpParticipatedAllocation,
        zpParticipatedPayout,
      ] = await Promise.all([
        cgpDAL
          .findAllVoteResults({
            snapshot: relevant.snapshot,
            tally: relevant.tally,
            type: 'allocation',
          })
          .then(addBallotContentToResults({ type: 'allocation', chain })),
        cgpDAL
          .findAllVoteResults({
            snapshot: relevant.snapshot,
            tally: relevant.tally,
            type: 'payout',
            limit: 2,
          })
          .then(addBallotContentToResults({ type: 'payout', chain })),
        cgpDAL.findZpParticipated({
          snapshot: relevant.snapshot,
          tally: relevant.tally,
          type: 'allocation',
        }),
        cgpDAL.findZpParticipated({
          snapshot: relevant.snapshot,
          tally: relevant.tally,
          type: 'payout',
        }),
      ]);

      const winnerAllocation = calculateWinnerAllocation(resultsAllocation);
      const winnerPayout = calculateWinnerPayout(resultsPayout);

      return {
        ...relevant,
        winnerNomination: null,
        winnerAllocation,
        winnerPayout,
        zpParticipatedNomination: '0',
        zpParticipatedAllocation,
        zpParticipatedPayout,
      };
    }
  },
  findAllVotesByInterval: async function({ interval, type, page = 0, pageSize = 10 } = {}) {
    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const { snapshot, tally } = cgpUtils.getRelevantIntervalBlocks({
      chain,
      currentBlock,
      interval,
    });

    const query = Object.assign(
      {},
      { snapshot, tally, type },
      createQueryObject({ page, pageSize })
    );
    return await Promise.all([
      cgpDAL.countVotesInInterval({ snapshot, tally, type }),
      cgpDAL.findAllVotesInInterval(query).then(addBallotContentToResults({ chain, type })),
    ]).then(cgpDAL.getItemsAndCountResult);
  },
  findAllVoteResults: async function({ interval, type, page = 0, pageSize = 10 } = {}) {
    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const { snapshot, tally } = cgpUtils.getRelevantIntervalBlocks({
      chain,
      currentBlock,
      interval,
    });

    return await Promise.all([
      cgpDAL.countAllVoteResults({ snapshot, tally, type }),
      cgpDAL
        .findAllVoteResults(
          Object.assign({}, { snapshot, tally, type }, createQueryObject({ page, pageSize }))
        )
        .then(addBallotContentToResults({ type, chain })),
    ]).then(cgpDAL.getItemsAndCountResult);
  },
  findAllBallots: async function({ type, interval, page = 0, pageSize = 10 } = {}) {
    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const { snapshot, tally } = cgpUtils.getRelevantIntervalBlocks({
      chain,
      currentBlock,
      interval,
    });

    return await Promise.all([
      cgpDAL.countAllBallots({ type, snapshot, tally }),
      cgpDAL.findAllBallots(
        Object.assign({}, { type, snapshot, tally }, createQueryObject({ page, pageSize }))
      ),
    ]).then(cgpDAL.getItemsAndCountResult);
  },
  findNomineesBallots: async function({ interval, page = 0, pageSize } = {}) {
    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const { snapshot, tally } = cgpUtils.getRelevantIntervalBlocks({
      chain,
      currentBlock,
      interval,
    });

    return await Promise.all([
      cgpDAL.countAllNominees({ snapshot, tally, chain }),
      cgpDAL.findAllNominees(
        Object.assign({}, { snapshot, tally, chain }, createQueryObject({ page, pageSize }))
      ),
    ]).then(cgpDAL.getItemsAndCountResult);
  },
  findZpParticipated: async function({ interval, type } = {}) {
    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const { snapshot, tally } = cgpUtils.getRelevantIntervalBlocks({
      chain,
      currentBlock,
      interval,
    });

    return cgpDAL.findZpParticipated({ snapshot, tally, type });
  },
  findCgpBalance: async function({ blockNumber } = {}) {
    const chain = await getChain();
    const blockchainParser = new BlockchainParser(chain);

    const contractAddress = blockchainParser.getAddressFromContractId(CGP_FUND_CONTRACT_ID);

    return addressesBLL.balance({ address: contractAddress, blockNumber });
  },
  findWinnerAllocation: async function({ interval, chain, dbTransaction = null } = {}) {
    if (!interval || !chain) return 0;

    const { tally } = cgpUtils.getIntervalBlocks(chain, interval);
    const interval1 = cgpUtils.getIntervalBlocks(chain, 1);
    const intervalLength = cgpUtils.getIntervalLength(chain);
    const highestBlockNumberWithVote = await cgpDAL.findLastValidVoteBlockNumber({
      startBlockNumber: tally,
      intervalLength,
      interval1Snapshot: interval1.snapshot,
      interval1Tally: interval1.tally,
      type: 'allocation',
      dbTransaction,
    });

    if (!highestBlockNumberWithVote) return 0;

    const latestWinnerInterval = cgpUtils.getIntervalByBlockNumber(
      chain,
      highestBlockNumberWithVote
    );
    const latestWinnerIntervalBlocks = cgpUtils.getIntervalBlocks(chain, latestWinnerInterval);
    const voteResults = await cgpDAL
      .findAllVoteResults({
        snapshot: latestWinnerIntervalBlocks.snapshot,
        tally: latestWinnerIntervalBlocks.tally,
        type: 'allocation',
        dbTransaction,
      })
      .then(addBallotContentToResults({ chain, type: 'allocation' }));
    return calculateWinnerAllocation(voteResults);
  },
  getPayoutBallotContent: async function({ ballot } = {}) {
    const chain = await getChain();
    return getPayoutBallotContent({ ballot, chain });
  },
  getAllocationBallotContent: async function({ ballot } = {}) {
    return getAllocationBallotContent({ ballot });
  },
};
