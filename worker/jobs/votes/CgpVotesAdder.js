'use strict';

const zen = require('@zen/zenjs');
const R = require('ramda');
const { Hash } = require('@zen/zenjs/build/src/Consensus/Types/Hash');
const { Decimal } = require('decimal.js');
const Bigi = require('bigi');
const { fromPairs } = require('ramda');
const logger = require('../../lib/logger')('votes.cgp');
const cgpDAL = require('../../../server/components/api/cgp/cgpDAL');
const {
  getAllocationBallotContent,
  getPayoutBallotContent,
} = require('../../../server/components/api/cgp/modules/getBallotContent');
const cgpUtils = require('../../../server/components/api/cgp/cgpUtils');
const cgpBLL = require('../../../server/components/api/cgp/cgpBLL');
const addressesDAL = require('../../../server/components/api/addresses/addressesDAL');
const QueueError = require('../../lib/QueueError');
const db = require('../../../server/db/sequelize/models');

class CgpVotesAdder {
  constructor({
    blockchainParser,
    contractIdVoting,
    contractIdFund,
    cgpFundPayoutBallot,
    genesisTotal,
    chain,
  } = {}) {
    this.blockchainParser = blockchainParser;
    this.contractIdVoting = contractIdVoting;
    this.contractIdFund = contractIdFund;
    this.cgpFundPayoutBallot = cgpFundPayoutBallot;
    this.chain = chain;
    this.genesisTotal = genesisTotal;
    this.contractAddress = blockchainParser.getAddressFromContractId(contractIdFund);
  }

  async doJob() {
    let dbTransaction = null;
    try {
      this.checkContractId();
      this.checkChain();
      this.checkCGPFundPayoutBallot();
      this.checkGenesisTotal();
      let result = 0;

      // query for all executions with the voting contract id and that the execution id is not in CgpVotes
      const executions = await cgpDAL.findAllUnprocessedExecutions(this.contractIdVoting);
      if (executions.length) {
        logger.info(`${executions.length} contract executions to add votes from`);
        dbTransaction = await db.sequelize.transaction();

        // executions must be processed in ascending order, intervals must be processed in ascending order
        // validation of an interval depends on the previous interval
        for (let i = 0; i < executions.length; i++) {
          const votesToAdd = await this.getVotesFromExecution({
            execution: executions[i],
            dbTransaction,
          });
          if (votesToAdd.length) {
            await cgpDAL.bulkCreate(votesToAdd, { transaction: dbTransaction });
          }
          result += votesToAdd.length;
        }

        await dbTransaction.commit();
        logger.info(`Added ${result} votes from ${executions.length} executions`);
      }
      return result;
    } catch (error) {
      logger.error(`An Error has occurred when adding votes: ${error.message}`);
      if (dbTransaction) {
        await dbTransaction.rollback();
      }
      throw new QueueError(error);
    }
  }

  checkContractId() {
    if (!this.contractIdVoting || !this.contractIdFund) {
      throw new Error('Contract Id is empty');
    }
  }

  checkCGPFundPayoutBallot() {
    if (!this.cgpFundPayoutBallot) {
      throw new Error('Fund Payout Ballot is empty');
    }
  }

  checkGenesisTotal() {
    if (typeof this.genesisTotal === 'undefined') {
      throw new Error('Genesis total is not supplied');
    }
  }

  checkChain() {
    if (!this.chain) {
      throw new Error('Chain is empty');
    }
  }

  async getVotesFromExecution({ execution, dbTransaction } = {}) {
    let votesToAdd = [];
    const executionBlockNumber = execution.blockNumber;
    const interval = cgpUtils.getIntervalByBlockNumber(this.chain, executionBlockNumber);
    if (!this.verifyExecutionInSnapshotRange({ interval, executionBlockNumber, execution })) {
      logger.info(
        `Execution with id ${execution.id} is not in the voting range or not in the right phase, blockNumber=${executionBlockNumber}, type=${execution.command}`
      );
    } else if (!this.validateMessageBody(execution)) {
      logger.info(`MessageBody is not valid for execution with id ${execution.id}`);
    } else {
      const ballotSignature = fromPairs(execution.messageBody.dict);
      const type = execution.command;
      const phase = type === 'Nomination' ? 'Nomination' : 'Vote';
      const ballot = ballotSignature[type].string;

      const verifyBallotResult = await this.verifyBallot({ ballot, type, interval, dbTransaction });
      if (verifyBallotResult.error) {
        logger.info(
          `Ballot is not valid for execution with id ${execution.id}: ${verifyBallotResult.error}, type=${type} blockNumber=${executionBlockNumber} ballot=${ballot}`
        );
      } else {
        const dict = ballotSignature.Signature.dict;
        for (let i = 0; i < dict.length; i++) {
          const element = dict[i];
          if (this.validateSignatureDictElement(element)) {
            const publicKey = element[0];
            const signature = element[1].signature;
            const address = this.blockchainParser.getAddressFromPublicKey(publicKey);
            if (this.verifySignature({ interval, ballot, phase, publicKey, signature })) {
              votesToAdd.push({
                blockNumber: execution.blockNumber,
                executionId: new Decimal(execution.id).toNumber(),
                type: type.toLowerCase(),
                ballot,
                address,
              });
            } else {
              logger.info(
                `Signature did not pass verification: executionId:${execution.id} interval:${interval} ballot:${ballot} type=${type} publicKey:${publicKey} blockNumber=${executionBlockNumber}`
              );
              // do not enter any votes if any of the signatures is bad
              votesToAdd = [];
              break;
            }
          }
        }
        if (votesToAdd.length) {
          logger.info(
            `Added votes for valid execution with id ${
              execution.id
            } interval:${interval} blockNumber=${executionBlockNumber} type=${type} ballot:${ballot} ${
              ballot === this.cgpFundPayoutBallot ? 'voted for cgp fund' : ''
            }`
          );
        }
      }
    }
    // execution does not contain any valid vote - insert an empty vote so this execution is handled
    if (votesToAdd.length === 0) {
      votesToAdd.push({
        blockNumber: execution.blockNumber,
        executionId: execution.id,
      });
    }

    return votesToAdd;
  }

  validateMessageBody(execution) {
    const { messageBody } = execution;
    const isTopLevelValid = Boolean(
      messageBody && messageBody.dict && messageBody.dict.length === 2
    );
    if (!isTopLevelValid) return false;

    const ballotSignature = fromPairs(messageBody.dict);
    const ballotSignatureKeys = Object.keys(ballotSignature);
    return Boolean(
      ballotSignatureKeys.includes('Signature') &&
        (ballotSignatureKeys.includes('Nomination') ||
          ballotSignatureKeys.includes('Payout') ||
          ballotSignatureKeys.includes('Allocation')) &&
        ballotSignatureKeys.includes(execution.command) &&
        (ballotSignature.Nomination || ballotSignature.Payout || ballotSignature.Allocation)
          .string &&
        Array.isArray(ballotSignature.Signature.dict)
    );
  }

  validateSignatureDictElement(element) {
    return Boolean(
      element &&
        element.length === 2 &&
        typeof element[0] === 'string' &&
        typeof element[1].signature === 'string'
    );
  }

  verifyExecutionInSnapshotRange({ interval, executionBlockNumber, execution } = {}) {
    const { snapshot, tally } = cgpUtils.getIntervalBlocks(this.chain, interval);
    return execution.command === 'Nomination'
      ? executionBlockNumber > snapshot && executionBlockNumber <= snapshot + (tally - snapshot) / 2
      : executionBlockNumber > snapshot + (tally - snapshot) / 2 && executionBlockNumber <= tally;
  }

  verifySignature({ publicKey, signature, interval, ballot, phase } = {}) {
    const { Data, PublicKey, Signature } = zen;
    return PublicKey.fromString(publicKey).verify(
      Hash.compute(
        Data.serialize(new Data.UInt32(Bigi.valueOf(interval)))
          .concat(Data.serialize(new Data.String(phase)))
          .concat(Data.serialize(new Data.String(ballot)))
      ).bytes,
      Signature.fromString(signature)
    );
  }

  /**
   * Each verify ballot type function should return an object with an error property
   *
   * @returns {{error: string}} an object with the validation error
   */
  async verifyBallot({ ballot, type, interval, dbTransaction } = {}) {
    return type === 'Nomination'
      ? await this.verifyNominationBallot({ ballot, dbTransaction, interval })
      : type === 'Payout'
      ? await this.verifyPayoutBallot({ ballot, interval, dbTransaction })
      : await this.verifyAllocationBallot({ ballot, interval, dbTransaction });
  }

  async verifyAllocationBallot({ ballot, interval, dbTransaction } = {}) {
    try {
      const allocationBallot = getAllocationBallotContent({ ballot });
      if (!allocationBallot || !R.has('allocation', allocationBallot)) {
        return { error: 'no allocation ballot found' };
      }

      const allocation = Number(allocationBallot.allocation);
      if (allocation < 0 || allocation > 90) {
        return { error: 'allocation is outside of the allowed range' };
      }

      let prevAllocation =
        interval > 1
          ? await cgpBLL.findWinnerAllocation({
              interval: interval - 1,
              chain: this.chain,
              dbTransaction,
            })
          : 0;
      const { maxAllocation, minAllocation } = getAllocationMinMax({ prevAllocation });
      if (allocation < minAllocation || allocation > maxAllocation) {
        return { error: 'allocation is not in the range of the prev allocation min and max' };
      }

      return { error: '' };
    } catch (error) {
      return { error: error.message };
    }
  }

  async verifyNominationBallot({ ballot, interval, dbTransaction } = {}) {
    try {
      const { spends } = getPayoutBallotContent({ ballot, chain: this.chain });
      if (spends.length <= 0 || spends.length > 100) {
        return {
          error: `there are ${spends.length <= 0 ? 'no' : 'to many'} spends`,
        };
      }
      if (spends.some(spend => spend.amount == 0)) {
        return {
          error: 'there are spends with amount 0',
        };
      }
      const spendIsNotOrdered = (spend, index) => index > 0 ? spend.asset <= spends[index-1].asset : false;
      if(spends.some(spendIsNotOrdered)) {
        return {
          error: 'spends are not ordered or not unique',
        };
      }

      // get the cgp balance at snapshot
      const { snapshot } = cgpUtils.getIntervalBlocks(this.chain, interval);
      const balance = await addressesDAL.snapshotAddressBalancesByBlock({
        address: this.contractAddress,
        blockNumber: snapshot,
        dbTransaction,
      });

      if (someSpendsAreInvalidAgainstFund({ balance, spends })) {
        return {
          error: 'some spends are invalid against the cgp fund',
        };
      }

      return { error: '' };
    } catch (error) {
      return { error: error.message };
    }
  }

  async verifyPayoutBallot({ ballot, interval, dbTransaction } = {}) {
    try {
      const { snapshot, tally } = cgpUtils.getIntervalBlocks(this.chain, interval);

      // first check that the ballot passes the normal nomination rules
      const nominationResult = await this.verifyNominationBallot({
        ballot,
        dbTransaction,
        interval,
      });
      if (nominationResult.error) return nominationResult;

      // check that the ballot is one of the nominees
      const [cgpBalance, nominees] = await Promise.all([
        addressesDAL.snapshotAddressBalancesByBlock({
          address: this.contractAddress,
          blockNumber: snapshot,
          dbTransaction,
        }),
        cgpDAL.findAllNominees({
          snapshot,
          tally,
          threshold: cgpUtils.getThreshold({
            height: snapshot,
            chain: this.chain,
            genesisTotal: this.genesisTotal,
          }),
          dbTransaction,
        }),
      ]);
      if (cgpBalance.length > 0) {
        nominees.push({
          ballot: this.cgpFundPayoutBallot,
          amount: '0',
          zpAmount: '0',
        });
      }
      if (!nominees.find(nominee => nominee.ballot === ballot)) {
        return { error: 'payout ballot is not in nominees' };
      }

      return { error: '' };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = CgpVotesAdder;

function getAllocationMinMax({ prevAllocation = 0 }) {
  const prevCoinbaseRatio = 100 - prevAllocation;
  const correctionCap = 100 - 15;
  const globalRatioMin = 100 - 90;

  const localRatioMin = (prevCoinbaseRatio * correctionCap) / 100;
  const localRatioMax = (prevCoinbaseRatio * 100) / correctionCap;
  const ratioMin = Math.max(globalRatioMin, localRatioMin);
  const ratioMax = Math.min(100, localRatioMax);

  const minAllocation = 100 - ratioMax;
  const maxAllocation = 100 - ratioMin;
  return {
    minAllocation,
    maxAllocation,
  };
}

function getSpendsAggregated(spends) {
  const aggregated = spends.reduce((aggregated, cur) => {
    if (typeof aggregated[cur.asset] === 'undefined') {
      aggregated[cur.asset] = 0;
    }
    aggregated[cur.asset] = Decimal.add(aggregated[cur.asset], cur.amount).toNumber();
    return aggregated;
  }, {});

  return Object.keys(aggregated).map(key => ({ asset: key, amount: aggregated[key] }));
}

function someSpendsAreInvalidAgainstFund({ spends, balance }) {
  const fundAssets = balance.map(item => item.asset);
  return getSpendsAggregated(spends).some(
    spend =>
      !fundAssets.includes(spend.asset) ||
      balance.find(item => item.asset === spend.asset).amount < spend.amount
  );
}
