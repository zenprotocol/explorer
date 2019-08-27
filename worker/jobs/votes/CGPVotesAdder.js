'use strict';

const zen = require('@zen/zenjs');
const sha3 = require('js-sha3');
const Decimal = require('decimal.js');
const { fromPairs } = require('ramda');
const logger = require('../../lib/logger')('votes');
const cgpDAL = require('../../../server/components/api/cgp/cgpDAL');
const cgpUtils = require('../../../server/components/api/cgp/cgpUtils');
const commandsDAL = require('../../../server/components/api/commands/commandsDAL');
const QueueError = require('../../lib/QueueError');
const db = require('../../../server/db/sequelize/models');

class CGPVotesAdder {
  constructor({ blockchainParser, contractId, chain } = {}) {
    this.blockchainParser = blockchainParser;
    this.contractId = contractId;
    this.chain = chain;
  }

  async doJob() {
    try {
      this.checkContractId();
      this.checkChain();
      let dbTransaction = null;
      let result = 0;

      // query for all commands with the voting contract id and that the command id is not in RepoVotes
      const commands = await cgpDAL.findAllUnprocessedCommands(this.contractId);
      if (commands.length) {
        logger.info(`${commands.length} commands to add`);
        dbTransaction = await db.sequelize.transaction();
        // for each of those commands - verify all signatures and add to RepoVotes
        const votesToAdd = await this.processCommands(commands);
        if (votesToAdd.length) {
          await cgpDAL.bulkCreate(votesToAdd, { transaction: dbTransaction });
        }

        await dbTransaction.commit();
        logger.info(`Added ${votesToAdd.length} votes from ${commands.length} commands`);
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

  checkChain() {
    if (!this.chain) {
      throw new Error('Chain is empty');
    }
  }

  async processCommands(commands) {
    const voteGroupsToAdd = await Promise.all(commands.map(command => this.getVotesFromCommand(command)));
    // a command can contain more than 1 vote or none
    return voteGroupsToAdd.reduce((all, voteGroup) => {
      all.push.apply(all, voteGroup);
      return all;
    }, []);
  }

  async getVotesFromCommand(command) {
    const votesToAdd = [];
    const interval = await this.getCommandInterval(command);

    // make sure the message body is properly formatted
    if (this.validateMessageBody(command)) {
      const ballotSignature = fromPairs(command.messageBody.dict);
      const type = command.command;
      const ballot = ballotSignature[type].string;
      // go over each element in the dict and verify it against the interval and ballot
      // add only the verified votes
      const dict = ballotSignature.Signature.dict;
      for (let i = 0; i < dict.length; i++) {
        const element = dict[i];
        if (this.validateSignatureDictElement(element)) {
          const publicKey = element[0];
          const signature = element[1].signature;
          const address = this.blockchainParser.getAddressFromPublicKey(publicKey);
          if (this.verify({ interval, ballot, publicKey, signature })) {
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
          }
        }
      }
    } else {
      logger.info(`MessageBody is not valid for command with id ${command.id}`);
    }
    // command does not contain any valid vote - insert an empty vote so this command is handled
    if (votesToAdd.length === 0) {
      votesToAdd.push({
        CommandId: Number(command.id),
      });
    }

    return votesToAdd;
  }

  async getCommandInterval(command) {
    const commandBlockNumber = await commandsDAL.getCommandBlockNumber(command);
    return cgpUtils.getIntervalByBlockNumber(this.chain, commandBlockNumber);
  }

  validateMessageBody(command) {
    const { messageBody } = command;
    const isTopLevelValid = Boolean(messageBody && messageBody.dict && messageBody.dict.length === 2);
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
      element && element.length === 2 && typeof element[0] === 'string' && typeof element[1].signature === 'string'
    );
  }

  verify({ publicKey, signature, interval, ballot } = {}) {
    const { Data, PublicKey, Signature, Hash } = zen;
    return PublicKey.fromString(publicKey).verify(
      new Hash(
        Data.serialize(new Data.UInt32(new Decimal(interval).valueOf())).concat(
          Data.serialize(new Data.String(ballot))
        ).bytes,
        Signature.fromString(signature)
      )
    );
  }
}

module.exports = CGPVotesAdder;
