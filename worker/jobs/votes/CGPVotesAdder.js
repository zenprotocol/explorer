'use strict';

const zen = require('@zen/zenjs');
const R = require('ramda');
const { Hash } = require('@zen/zenjs/build/src/Consensus/Types/Hash');
const { Decimal } = require('decimal.js');
const Bigi = require('bigi');
const { fromPairs } = require('ramda');
const logger = require('../../lib/logger')('votes');
const cgpDAL = require('../../../server/components/api/cgp/cgpDAL');
const {
  getAllocationBallotContent,
  getPayoutBallotContent,
} = require('../../../server/components/api/cgp/modules/getBallotContent');
const {
  addBallotContentToResults
} = require('../../../server/components/api/cgp/modules/addBallotContentToResults');
const cgpUtils = require('../../../server/components/api/cgp/cgpUtils');
const commandsDAL = require('../../../server/components/api/commands/commandsDAL');
const addressesDAL = require('../../../server/components/api/addresses/addressesDAL');
const QueueError = require('../../lib/QueueError');
const db = require('../../../server/db/sequelize/models');
const calculateWinnerAllocation = require('./CGPWinnerCalculator/modules/calculateWinnerAllocation');

class CGPVotesAdder {
  constructor({ blockchainParser, contractIdVoting, contractIdFund, chain } = {}) {
    this.blockchainParser = blockchainParser;
    this.contractIdVoting = contractIdVoting;
    this.contractIdFund = contractIdFund;
    this.chain = chain;
  }

  async doJob() {
    let dbTransaction = null;
    try {
      this.checkContractId();
      this.checkChain();
      let result = 0;

      // query for all commands with the voting contract id and that the command id is not in CGPVotes
      const commands = await cgpDAL.findAllUnprocessedCommands(this.contractIdVoting);
      if (commands.length) {
        logger.info(`${commands.length} commands to add`);
        dbTransaction = await db.sequelize.transaction();

        // commands must be processed in ascending order, intervals must be processed in ascending order
        // vallation of an interval depends on the previous interval
        for (let i = 0; i < commands.length; i++) {
          const votesToAdd = await this.getVotesFromCommand({
            command: commands[i],
            dbTransaction,
          });
          if (votesToAdd.length) {
            await cgpDAL.bulkCreate(votesToAdd, { transaction: dbTransaction });
          }
          result += votesToAdd.length;
        }

        await dbTransaction.commit();
        logger.info(`Added ${result} votes from ${commands.length} commands`);
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

  checkChain() {
    if (!this.chain) {
      throw new Error('Chain is empty');
    }
  }

  async getVotesFromCommand({ command, dbTransaction } = {}) {
    const votesToAdd = [];
    const commandBlockNumber = await commandsDAL.getCommandBlockNumber(command);
    const interval = cgpUtils.getIntervalByBlockNumber(this.chain, commandBlockNumber);

    if (!this.verifyCommandInSnapshotRange({ interval, commandBlockNumber })) {
      logger.info(
        `Command with id ${command.id} is not in the voting range, commandBlockNumber=${commandBlockNumber}`
      );
    } else if (!this.validateMessageBody(command)) {
      logger.info(`MessageBody is not valid for command with id ${command.id}`);
    } else {
      const ballotSignature = fromPairs(command.messageBody.dict);
      const type = command.command;
      const ballot = ballotSignature[type].string;

      const isBallotVerified = await this.verifyBallot({ ballot, type, interval, dbTransaction });
      if (!isBallotVerified) {
        logger.info(`Ballot is not valid for command with id ${command.id}`);
      } else {
        const dict = ballotSignature.Signature.dict;
        for (let i = 0; i < dict.length; i++) {
          const element = dict[i];
          if (this.validateSignatureDictElement(element)) {
            const publicKey = element[0];
            const signature = element[1].signature;
            const address = this.blockchainParser.getAddressFromPublicKey(publicKey);
            if (this.verifySignature({ interval, ballot, publicKey, signature })) {
              votesToAdd.push({
                CommandId: new Decimal(command.id).toNumber(),
                type: type.toLowerCase(),
                ballot,
                address,
              });
            } else {
              logger.info(
                `Signature did not pass verification: commandId:${command.id} interval:${interval} ballot:${ballot} publicKey:${publicKey}`
              );
              // do not enter any votes if any of the signatures is bad
              break;
            }
          }
        }
      }
    }
    // command does not contain any valid vote - insert an empty vote so this command is handled
    if (votesToAdd.length === 0) {
      votesToAdd.push({
        CommandId: Number(command.id),
      });
    }

    return votesToAdd;
  }

  validateMessageBody(command) {
    const { messageBody } = command;
    const isTopLevelValid = Boolean(
      messageBody && messageBody.dict && messageBody.dict.length === 2
    );
    if (!isTopLevelValid) return false;

    const ballotSignature = fromPairs(messageBody.dict);
    const ballotSignatureKeys = Object.keys(ballotSignature);
    return Boolean(
      ballotSignatureKeys.includes('Signature') &&
        (ballotSignatureKeys.includes('Payout') || ballotSignatureKeys.includes('Allocation')) &&
        ballotSignatureKeys.includes(command.command) &&
        (ballotSignature.Payout || ballotSignature.Allocation).string &&
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

  verifyCommandInSnapshotRange({ interval, commandBlockNumber } = {}) {
    const { snapshot, tally } = cgpUtils.getIntervalBlocks(this.chain, interval);
    return commandBlockNumber > snapshot && commandBlockNumber <= tally;
  }

  verifySignature({ publicKey, signature, interval, ballot } = {}) {
    const { Data, PublicKey, Signature } = zen;
    return PublicKey.fromString(publicKey).verify(
      Hash.compute(
        Data.serialize(new Data.UInt32(Bigi.valueOf(interval))).concat(
          Data.serialize(new Data.String(ballot))
        )
      ).bytes,
      Signature.fromString(signature)
    );
  }

  async verifyBallot({ ballot, type, interval, dbTransaction } = {}) {
    return type === 'Payout'
      ? await this.verifyPayoutBallot({ ballot, interval, dbTransaction })
      : await this.verifyAllocationBallot({ ballot, interval, dbTransaction });
  }

  async verifyAllocationBallot({ ballot, interval, dbTransaction } = {}) {
    try {
      const allocationBallot = getAllocationBallotContent({ ballot });
      if (!allocationBallot || !R.has('allocation', allocationBallot)) return false;

      const allocation = Number(allocationBallot.allocation);
      if (allocation < 0 || allocation > 90) return false;

      let prevAllocation =
        interval > 1
          ? await this.calcAllocationWinner({ interval: interval - 1, dbTransaction })
          : 0;
      const { maxAllocation, minAllocation } = getAllocationMinMax({ prevAllocation });
      return minAllocation <= allocation && allocation <= maxAllocation;
    } catch (error) {
      return false;
    }
  }

  async verifyPayoutBallot({ ballot, interval, dbTransaction } = {}) {
    try {
      const { spends } = getPayoutBallotContent({ ballot, chain: this.chain });
      if (spends.length <= 0 || spends.length > 100) return false;
      if (spends.some(spend => Number(spend.amount) === 0)) return false;

      // get the cgp balance at snapshot
      const { snapshot } = cgpUtils.getIntervalBlocks(this.chain, interval);
      const contractAddress = this.blockchainParser.getAddressFromContractId(this.contractIdFund);
      const balance = await addressesDAL.snapshotAddressBalancesByBlock({
        address: contractAddress,
        blockNumber: snapshot,
        dbTransaction,
      });

      if (allSpendsAreValidAgainstFund({ balance, spends })) return false;

      return true;
    } catch (error) {
      return false;
    }
  }

  async calcAllocationWinner({ interval, dbTransaction } = {}) {
    const { snapshot, tally } = cgpUtils.getIntervalBlocks(this.chain, interval);
    const voteResults = await cgpDAL.findAllVoteResults({
      snapshot,
      tally,
      type: 'allocation',
      dbTransaction,
    }).then(addBallotContentToResults({chain: this.chain, type: 'allocation'}));
    return calculateWinnerAllocation(voteResults);
  }
}

module.exports = CGPVotesAdder;

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

function allSpendsAreValidAgainstFund({ spends, balance }) {
  const fundAssets = balance.map(item => item.asset);
  return getSpendsAggregated(spends).some(
    spend =>
      !fundAssets.includes(spend.asset) ||
      balance.find(item => item.asset === spend.asset).amount < spend.amount
  );
}
