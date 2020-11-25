'use strict';

const { DataFactory, U32, Str, PublicKey, Signature } = require('@zen/zenjs');
const sha3 = require('js-sha3');
const BigInteger = require('bigi');
const logger = require('../../lib/logger')('votes.repo');
const repoVotesDAL = require('../../../server/components/api/repovotes/repoVotesDAL');
const repoVoteIntervalsDAL = require('../../../server/components/api/repovote-intervals/repoVoteIntervalsDAL');
const txsDAL = require('../../../server/components/api/txs/txsDAL');
const QueueError = require('../../lib/QueueError');
const db = require('../../../server/db/sequelize/models');

class VotesAdder {
  constructor({ blockchainParser, contractId, defaultCommitId } = {}) {
    this.blockchainParser = blockchainParser;
    this.contractId = contractId;
    this.defaultCommitId = defaultCommitId;
    this.dbTransaction = null;
  }

  async doJob() {
    try {
      this.checkContractId();
      let result = 0;

      // query for all executions with the voting contract id and that the execution id is not in RepoVotes
      // those executions are ordered by block number and tx index (first counts)
      const executions = await repoVotesDAL.findAllUnprocessedExecutions(this.contractId);

      if (executions.length) {
        logger.info(`${executions.length} executions to add`);
        this.dbTransaction = await db.sequelize.transaction();

        const { groups, nonValidExecutions } = await this.groupExecutionsByInterval(executions);

        // process each group seperatly, candidate phase executions will need the contestants already in DB
        for (let i = 0; i < groups.length; i++) {
          const executionsGroup = groups[i];

          // for each of those executions - verify all signatures and add to RepoVotes
          const votesToAdd = await this.processExecutions(executionsGroup);

          // filter out double votes in the new list
          this.resetDoubleVotes({ votesToAdd });

          if (votesToAdd.length) {
            result += votesToAdd.length;
            await repoVotesDAL.bulkCreate(votesToAdd, { transaction: this.dbTransaction });
          }
        }

        // add a vote per non valid execution
        await repoVotesDAL.bulkCreate(
          nonValidExecutions.map((e) => ({
            blockNumber: e.blockNumber,
            executionId: e.id,
          })),
          { transaction: this.dbTransaction }
        );
        result += nonValidExecutions.length;

        await this.dbTransaction.commit();
      }
      return result;
    } catch (error) {
      logger.error(`An Error has occurred when adding votes: ${error.message}`);
      if (this.dbTransaction) {
        logger.info('Rollback the database transaction');
        await this.dbTransaction.rollback();
      }
      throw new QueueError(error);
    }
  }

  /**
   * Group the executions by RepoVoteIntervals
   * @param {Array} executions
   */
  async groupExecutionsByInterval(executions) {
    /** @type {[{beginBlock: number, endBlock: number, executions: []}]} */
    const relevantIntervals = []; // will contain the intervals and for each the group of executions
    const nonValidExecutions = []; // executions outside interval range

    for (let i = 0; i < executions.length; i++) {
      const execution = executions[i];

      // first check the intervals we already have
      const relevantInterval = relevantIntervals.find(
        (i) => execution.blockNumber > i.beginBlock && execution.blockNumber <= i.endBlock
      );

      if (relevantInterval) {
        relevantInterval.executions.push(execution);
      } else {
        // try to find a new interval for the execution
        const interval = await repoVoteIntervalsDAL.findByBlockNumber(execution.blockNumber);

        if (interval) {
          interval.executions = [execution];
          relevantIntervals.push(interval);
        } else {
          nonValidExecutions.push(execution);
        }
      }
    }

    return { groups: relevantIntervals.map((x) => x.executions), nonValidExecutions };
  }

  checkContractId() {
    if (!this.contractId) {
      throw new Error('Contract Id is empty');
    }
  }

  async processExecutions(executions) {
    // a execution can contain more than 1 vote or none
    const arrays = await Promise.all(
      executions.map((execution) => this.getVotesFromExecution(execution))
    );
    return arrays.reduce((all, arr) => {
      all.push.apply(all, arr);
      return all;
    }, []);
  }

  async getVotesFromExecution(execution) {
    const tx = await txsDAL.findById(execution.txId);
    const votesToAdd = [];

    // make sure the message body is properly formatted with an interval, commitId and dict
    if (this.validateMessageBody(execution.messageBody)) {
      const voteInterval = await repoVoteIntervalsDAL.findByBlockNumber(execution.blockNumber);
      const commitId = execution.messageBody.list[0].string;

      if (
        await this.validateIntervalAndCandidates({
          voteInterval,
          commitId,
          execution,
        })
      ) {
        // go over each element in the dict and verify it against the interval and commitId
        // add only the verified votes
        const dict = execution.messageBody.list[1].dict;
        for (let i = 0; i < dict.length; i++) {
          const element = dict[i];

          // stop if dict element is not valid
          if (!this.validateDictElement(element)) continue;

          const publicKey = element[0];
          const signature = element[1].signature;
          const address = this.blockchainParser.getAddressFromPublicKey(publicKey);

          // stop if this is a double vote
          if (!(await this.validateDoubleVotesInDb({ voteInterval, address }))) continue;

          // stop if signature doesn't pass verification
          if (!this.verify({ voteInterval, commitId, publicKey, signature })) {
            logger.info(
              `Signature did not pass verification: executionId:${execution.id} interval:${voteInterval.interval} commitId:${commitId} publicKey:${publicKey}`
            );
            continue;
          }

          logger.info(
            `Adding a valid vote blockNumber=${execution.blockNumber} executionId:${execution.id} address=${address}`
          );

          const voteToAdd = {
            blockNumber: execution.blockNumber,
            executionId: execution.id,
            txHash: tx.hash,
            commitId,
            address,
          };
          Object.defineProperty(voteToAdd, 'interval', {
            value: voteInterval,
          });
          votesToAdd.push(voteToAdd);
        }
      }
    } else {
      logger.info(`MessageBody is not valid for execution with id ${execution.id}`);
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

  validateMessageBody(messageBody) {
    return Boolean(
      messageBody &&
        messageBody.list &&
        messageBody.list.length === 2 &&
        messageBody.list[0].hasOwnProperty('string') &&
        messageBody.list[1].hasOwnProperty('dict') &&
        Array.isArray(messageBody.list[1].dict)
    );
  }

  validateDictElement(element) {
    return Boolean(
      element &&
        element.length === 2 &&
        typeof element[0] === 'string' &&
        typeof element[1].signature === 'string'
    );
  }

  /**
   * Checks if vote is in the range of a vote interval,
   * if phase is Candidate, checks that the vote is for a valid candidate
   */
  async validateIntervalAndCandidates({ voteInterval, commitId, execution } = {}) {
    // an interval must exist in order to insert votes
    if (!voteInterval) {
      return false;
    }

    // phase is Candidate, check candidates
    if (voteInterval.phase === 'Candidate') {
      const intervalContestant = await repoVoteIntervalsDAL.findByIntervalAndPhase(
        voteInterval.interval,
        'Contestant'
      );
      if (!intervalContestant) {
        throw new Error(
          `Could not find the Contestant phase for interval ${voteInterval.interval}`
        );
      }
      const candidates = await repoVotesDAL.findContestantWinners({
        beginBlock: intervalContestant.beginBlock,
        endBlock: intervalContestant.endBlock,
        threshold: intervalContestant.threshold,
        transaction: this.dbTransaction,
      });

      // add the default commit id if exists
      if (this.defaultCommitId) {
        candidates.push({
          commitId: this.defaultCommitId,
        });
      }
      if (
        !candidates.length ||
        candidates.findIndex((candidate) => candidate.commitId === commitId) === -1
      ) {
        logger.info(
          `Valid contestant does not exist for vote with executionId=${execution.id} blockNumber=${execution.blockNumber}`
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Validate that this address have not voted already in this phase (in DB)
   */
  async validateDoubleVotesInDb({ voteInterval, address } = {}) {
    const { beginBlock, endBlock } = voteInterval;
    const votes = await repoVotesDAL.findAllInIntervalByAddress({
      address,
      beginBlock,
      endBlock,
      transaction: this.dbTransaction,
    });

    if (votes.length) return false;

    return true;
  }

  /**
   * Go over the array and reset double votes
   * Assume array is ordered by block and tx index
   */
  resetDoubleVotes({ votesToAdd } = {}) {
    for (let i = 0; i < votesToAdd.length; i++) {
      const vote = votesToAdd[i];

      // skip empty votes
      if (!vote.address) continue;

      // go over rest and reset in case they are double
      for (let j = i + 1; j < votesToAdd.length; j++) {
        const vote1 = votesToAdd[j];

        if (!vote1.address) continue;

        if (
          vote.address === vote1.address &&
          vote.interval.beginBlock === vote1.interval.beginBlock
        ) {
          logger.info(
            `Resetting a double vote: blockNumber=${vote.blockNumber} executionId=${vote.executionId}`
          );
          // double vote, reset it
          vote1.address = null;
          vote1.commitId = null;
        }
      }
    }
  }

  verify({ publicKey, signature, voteInterval, commitId } = {}) {
    const sha = sha3.sha3_256;
    return PublicKey.fromString(publicKey).verify(
      Buffer.from(
        sha
          .update(sha(DataFactory.serialize(new U32(BigInteger.valueOf(voteInterval.interval)))))
          .update(sha(DataFactory.serialize(new Str(voteInterval.phase))))
          .update(sha(DataFactory.serialize(new Str(commitId))))
          .hex(),
        'hex'
      ),
      Signature.fromString(signature)
    );
  }
}

module.exports = VotesAdder;
