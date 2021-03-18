'use strict';

const { Decimal } = require('decimal.js');
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
const getAssetName = require('../../../lib/getAssetName');
const { addBallotContentToResults } = require('./modules/addBallotContentToResults');
const calculateWinnerAllocation = require('./modules/calculateWinnerAllocation');
const calculateWinnerPayout = require('./modules/calculateWinnerPayout');

const CGP_FUND_CONTRACT_ID = config.get('CGP_FUND_CONTRACT_ID');
const GENESIS_TOTAL_ZP = config.get('GENESIS_TOTAL_ZP');

module.exports = {
  findIntervalAndTally: async function ({ interval, phase } = {}) {
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
    const middle = relevant.snapshot + (relevant.tally - relevant.snapshot) / 2;

    const threshold = cgpUtils.getThreshold({
      chain,
      height: relevant.snapshot,
      genesisTotal: GENESIS_TOTAL_ZP,
    });
    const cgpBalance = await this.findCgpBalance({ blockNumber: relevant.snapshot });
    // current allocation (up to previous interval)
    const currentAllocation =
      relevant.interval === 1
        ? 0
        : await this.findWinnerAllocation({ chain, interval: relevant.interval - 1 });

    if (relevant.phase === 'Nomination') {
      const [zpParticipatedNomination, nominees] = await Promise.all([
        cgpDAL.findZpParticipated({
          snapshot: relevant.snapshot,
          beginBlock: relevant.snapshot,
          endBlock: middle,
          type: 'nomination',
        }),
        cgpDAL.findAllNominees({
          snapshot: relevant.snapshot,
          tally: relevant.tally,
          threshold,
        }),
      ]);

      return {
        ...relevant,
        winnersNomination: await addBallotContentToResults({ type: 'nomination', chain })(nominees),
        winnerAllocation: null,
        winnerPayout: null,
        zpParticipatedNomination,
        zpParticipatedAllocation: '0',
        zpParticipatedPayout: '0',
        cgpBalance,
        currentAllocation,
        thresholdPercentage: Number(cgpUtils.getThresholdPercentage(chain)),
        threshold,
        nominees,
      };
    } else {
      const [
        resultsAllocation,
        resultsPayout,
        zpParticipatedAllocation,
        zpParticipatedPayout,
        nominees,
      ] = await Promise.all([
        cgpDAL
          .findAllVoteResults({
            snapshot: relevant.snapshot,
            beginBlock: middle,
            endBlock: relevant.tally,
            type: 'allocation',
          })
          .then(addBallotContentToResults({ type: 'allocation', chain })),
        cgpDAL
          .findAllVoteResults({
            snapshot: relevant.snapshot,
            beginBlock: middle,
            endBlock: relevant.tally,
            type: 'payout',
          })
          .then(addBallotContentToResults({ type: 'payout', chain })),
        cgpDAL.findZpParticipated({
          snapshot: relevant.snapshot,
          beginBlock: middle,
          endBlock: relevant.tally,
          type: 'allocation',
        }),
        cgpDAL.findZpParticipated({
          snapshot: relevant.snapshot,
          beginBlock: middle,
          endBlock: relevant.tally,
          type: 'payout',
        }),
        cgpDAL.findAllNominees({
          snapshot: relevant.snapshot,
          tally: relevant.tally,
          threshold,
        }),
      ]);

      const winnerAllocation = calculateWinnerAllocation(resultsAllocation);
      const winnerPayout = calculateWinnerPayout(resultsPayout.slice(0, 2));
      //add asset name to winner
      if (!!winnerPayout && !!winnerPayout.content ) winnerPayout.content.spends = (winnerPayout && winnerPayout.content.spends || []).map((data) => {
        return {
          ...data,
          metadata: getAssetName(data.asset),
        }
      });
      // add the cgp fund ballot if does not exist
      const cgpFundPayoutBallot = config.get('CGP_FUND_PAYOUT_BALLOT');
      if (
        cgpFundPayoutBallot &&
        !nominees.find((nominee) => nominee.ballot === cgpFundPayoutBallot) &&
        cgpBalance.length > 0
      ) {
        nominees.push({
          ballot: cgpFundPayoutBallot,
          amount: '0',
          zpAmount: '0',
        });
      }

      // with the nominees list, find each current amount
      const participatingNominees = nominees.map((nominee) => {
        const result = resultsPayout.find((result) => result.ballot === nominee.ballot) || {};
        return {
          ...nominee,
          amount: result.amount || '0',
          zpAmount: result.zpAmount || '0',
        };
      });
      // sort by the amount
      participatingNominees.sort((a, b) => new Decimal(a.amount || 0).minus(b.amount || 0).toNumber());

      return {
        ...relevant,
        winnersNomination: null,
        winnerAllocation,
        winnerPayout,
        zpParticipatedNomination: '0',
        zpParticipatedAllocation,
        zpParticipatedPayout,
        cgpBalance,
        currentAllocation,
        thresholdPercentage: Number(cgpUtils.getThresholdPercentage(chain)),
        threshold,
        nominees: participatingNominees,
      };
    }
  },
  findAllVotesByInterval: async function ({ interval, type, page = 0, pageSize = 10 } = {}) {
    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const { snapshot, tally } = cgpUtils.getRelevantIntervalBlocks({
      chain,
      currentBlock,
      interval,
    });
    const { beginBlock, endBlock } = cgpUtils.getPhaseBlocks({ chain, interval, type });

    const query = Object.assign(
      {},
      { snapshot, beginBlock, endBlock, type },
      createQueryObject({ page, pageSize })
    );
    return await Promise.all([
      cgpDAL.countVotesInInterval(query),
      cgpDAL.findAllVotesInInterval(query).then(addBallotContentToResults({ chain, type })),
    ]).then(cgpDAL.getItemsAndCountResult);
  },
  findAllVoteResults: async function ({ interval, type, page = 0, pageSize = 10 } = {}) {
    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const relevant = cgpUtils.getRelevantIntervalBlocks({
      chain,
      currentBlock,
      interval,
    });
    const { beginBlock, endBlock } = cgpUtils.getPhaseBlocks({
      chain,
      interval: relevant.interval,
      type,
    });

    return await Promise.all([
      cgpDAL.countAllVoteResults({ beginBlock, endBlock, type }),
      cgpDAL
        .findAllVoteResults(
          Object.assign(
            {},
            { snapshot: relevant.snapshot, beginBlock, endBlock, type },
            createQueryObject({ page, pageSize })
          )
        )
        .then(addBallotContentToResults({ type, chain })),
    ]).then(cgpDAL.getItemsAndCountResult);
  },
  findAllBallots: async function ({ type, interval, page = 0, pageSize = 10 } = {}) {
    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const { snapshot } = cgpUtils.getRelevantIntervalBlocks({
      chain,
      currentBlock,
      interval,
    });
    const { beginBlock, endBlock } = cgpUtils.getPhaseBlocks({ chain, interval, type });

    return await Promise.all([
      cgpDAL.countAllBallots({ type, beginBlock, endBlock }),
      cgpDAL.findAllBallots(
        Object.assign(
          {},
          { type, snapshot, beginBlock, endBlock },
          createQueryObject({ page, pageSize })
        )
      ),
    ]).then(cgpDAL.getItemsAndCountResult);
  },
  findNomineesBallots: async function ({ interval, page = 0, pageSize } = {}) {
    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const { snapshot, tally } = cgpUtils.getRelevantIntervalBlocks({
      chain,
      currentBlock,
      interval,
    });
    const middle = snapshot + (tally - snapshot) / 2;

    const threshold = cgpUtils.getThreshold({
      chain,
      height: snapshot,
      genesisTotal: GENESIS_TOTAL_ZP,
    });

    return await Promise.all([
      cgpDAL.countAllNominees({ snapshot, tally, threshold }),
      cgpDAL.findAllNominees(
        Object.assign({}, { snapshot, tally, threshold }, createQueryObject({ page, pageSize }))
      ),
    ]).then(cgpDAL.getItemsAndCountResult);
  },
  findZpParticipated: async function ({ interval, type } = {}) {
    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const { snapshot, tally } = cgpUtils.getRelevantIntervalBlocks({
      chain,
      currentBlock,
      interval,
    });
    const { beginBlock, endBlock } = cgpUtils.getPhaseBlocks({ chain, interval, type });

    return cgpDAL.findZpParticipated({ snapshot, beginBlock, endBlock, type });
  },
  findCgpBalance: async function ({ blockNumber } = {}) {
    const chain = await getChain();
    const blockchainParser = new BlockchainParser(chain);

    const contractAddress = blockchainParser.getAddressFromContractId(CGP_FUND_CONTRACT_ID);

    return addressesBLL.balance({ address: contractAddress, blockNumber });
  },
  findWinnerAllocation: async function ({ interval, chain, dbTransaction = null } = {}) {
    if (!interval || !chain) return 0;

    const { tally } = cgpUtils.getIntervalBlocks(chain, interval);
    const highestBlockNumberWithVote = await cgpDAL.findLastValidVoteBlockNumber({
      startBlockNumber: tally,
      type: 'allocation',
      transaction: dbTransaction,
    });

    if (!highestBlockNumberWithVote) return 0;

    const latestWinnerInterval = cgpUtils.getIntervalByBlockNumber(
      chain,
      highestBlockNumberWithVote
    );
    const latestWinnerIntervalBlocks = cgpUtils.getIntervalBlocks(chain, latestWinnerInterval);
    const { beginBlock, endBlock } = cgpUtils.getPhaseBlocks({
      chain,
      interval: latestWinnerInterval,
      type: 'allocation',
    });

    const voteResults = await cgpDAL
      .findAllVoteResults({
        snapshot: latestWinnerIntervalBlocks.snapshot,
        beginBlock,
        endBlock,
        type: 'allocation',
        transaction: dbTransaction,
      })
      .then(addBallotContentToResults({ chain, type: 'allocation' }));
    return calculateWinnerAllocation(voteResults);
  },
  getPayoutBallotContent: async function ({ ballot } = {}) {
    const chain = await getChain();
    return getPayoutBallotContent({ ballot, chain });
  },
  getAllocationBallotContent: async function ({ ballot } = {}) {
    return getAllocationBallotContent({ ballot });
  },
};
