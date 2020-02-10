'use strict';

const zen = require('@zen/zenjs');
const sha3 = require('js-sha3');
const BigInteger = require('bigi');
const logger = require('../../lib/logger')('votes');
const votesDAL = require('../../../server/components/api/votes/votesDAL');
const voteIntervalsDAL = require('../../../server/components/api/voteIntervals/voteIntervalsDAL');
const commandsDAL = require('../../../server/components/api/commands/commandsDAL');
const QueueError = require('../../lib/QueueError');
const db = require('../../../server/db/sequelize/models');

class VotesAdder {
  constructor({ blockchainParser, contractId } = {}) {
    this.blockchainParser = blockchainParser;
    this.contractId = contractId;
  }

  async doJob() {
    try {
      this.checkContractId();
      let dbTransaction = null;
      let result = 0;

      // query for all commands with the voting contract id and that the command id is not in RepoVotes
      const commands = await votesDAL.findAllUnprocessedCommands(
        this.contractId
      );
      if (commands.length) {
        logger.info(`${commands.length} commands to add`);
        dbTransaction = await db.sequelize.transaction();
        // for each of those commands - verify all signatures and add to RepoVotes
        const votesToAdd = await this.processCommands(commands);

        if (votesToAdd.length) {
          await votesDAL.bulkCreate(votesToAdd, { transaction: dbTransaction });
        }

        await dbTransaction.commit();
        logger.info(
          `Added ${votesToAdd.length} votes from ${commands.length} commands`
        );
        result = votesToAdd.length;
      }
      return result;
    } catch (error) {
      logger.error(`An Error has occurred when adding votes: ${error.message}`);
      throw new QueueError(error);
    }
  }

  checkContractId() {
    if (!this.contractId) {
      throw new Error('Contract Id is empty');
    }
  }

  async processCommands(commands) {
    // a command can contain more than 1 vote or none
    const arrays = await Promise.all(
      commands.map(command => this.getVotesFromCommand(command))
    );
    return arrays.reduce((all, arr) => {
      all.push.apply(all, arr);
      return all;
    }, []);
  }

  async getVotesFromCommand(command) {
    const votesToAdd = [];

    // make sure the message body is properly formatted with an interval, commitId and dict
    if (this.validateMessageBody(command.messageBody)) {
      const blockNumber = await commandsDAL.getCommandBlockNumber(command);
      const voteInterval = await voteIntervalsDAL.findCurrent(blockNumber);
      const commitId = command.messageBody.list[0].string;

      if (
        await this.validateIntervalAndCandidates({
          voteInterval,
          command,
          commitId
        })
      ) {
        // go over each element in the dict and verify it against the interval and commitId
        // add only the verified votes
        const dict = command.messageBody.list[1].dict;
        for (let i = 0; i < dict.length; i++) {
          const element = dict[i];
          if (this.validateDictElement(element)) {
            const publicKey = element[0];
            const signature = element[1].signature;
            const address = this.blockchainParser.getAddressFromPublicKey(
              publicKey
            );
            if (this.verify({ voteInterval, commitId, publicKey, signature })) {
              votesToAdd.push({
                CommandId: Number(command.id),
                commitId,
                address
              });
            } else {
              logger.info(
                `Signature did not pass verification: commandId:${command.id} interval:${voteInterval.interval} commitId:${commitId} publicKey:${publicKey}`
              );
            }
          }
        }
      }
    } else {
      logger.info(`MessageBody is not valid for command with id ${command.id}`);
    }

    // command does not contain any valid vote - insert an empty vote so this command is handled
    if (votesToAdd.length === 0) {
      votesToAdd.push({
        CommandId: Number(command.id)
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
  async validateIntervalAndCandidates({ voteInterval, commitId } = {}) {
    // an interval must exist in order to insert votes
    if (!voteInterval) {
      return false;
    }

    // phase is Candidate, check candidates
    if (voteInterval.phase === 'Candidate') {
      const candidates = await votesDAL.findContestantWinners({
        interval: voteInterval.interval
      });
      if (
        !candidates.length ||
        candidates.findIndex(candidate => candidate.commitId === commitId) ===
          -1
      ) {
        return false;
      }
    }

    return true;
  }

  verify({ publicKey, signature, voteInterval, commitId } = {}) {
    const { Data, PublicKey, Signature } = zen;
    const sha = sha3.sha3_256;
    return PublicKey.fromString(publicKey).verify(
      Buffer.from(
        sha
          .update(
            sha(Data.serialize(new Data.UInt32(BigInteger.valueOf(voteInterval.interval))))
          )
          .update(sha(Data.serialize(new Data.String(voteInterval.phase))))
          .update(sha(Data.serialize(new Data.String(commitId))))
          .hex(),
        'hex'
      ),
      Signature.fromString(signature)
    );
  }
}

module.exports = VotesAdder;
