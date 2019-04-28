'use strict';

const logger = require('../../lib/logger')('votes');
const votesDAL = require('../../../server/components/api/votes/votesDAL');
const QueueError = require('../../lib/QueueError');
const db = require('../../../server/db/sequelize/models');

class VotesAdder {
  constructor({ blockchainParser, contractId } = {}) {
    this.blockchainParser = blockchainParser;
    this.contractId = contractId;
  }

  async doJob() {
    try {
      let dbTransaction = null;
      let result = 0;

      // query for all commands with the voting contract id and that the command id is not in RepoVotes
      const commands = await votesDAL.findAllUnprocessedCommands(this.contractId);

      if (commands.length) {
        logger.info(`${commands.length} commands to add`);
        dbTransaction = await db.sequelize.transaction();
        // for each of those commands - verify all signatures and add to RepoVotes
        const votesToAdd = this.processCommands(commands);

        if (votesToAdd.length) {
          await votesDAL.bulkCreate(votesToAdd, { transaction: dbTransaction });
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

  processCommands(commands) {
    // not all commands are added, a command can contain more than 1 vote
    return commands.reduce((all, command) => {
      all.push.apply(all, this.getVotesFromCommand(command));
      return all;
    }, []);
  }

  getVotesFromCommand(command) {
    const votesToAdd = [];

    // make sure the message body is properly formatted with an interval, commitId and dict
    if (this.validateMessageBody(command.messageBody)) {
      const interval = command.messageBody.list[0].u32;
      const commitId = command.messageBody.list[1].string;
      // go over each element in the dict and verify it against the interval and commitId
      // add only the verified votes
      const dict = command.messageBody.list[2].dict;
      for (let i = 0; i < dict.length; i++) {
        const element = dict[i];
        if (this.validateDictElement(element)) {
          const publicKey = element[0];
          const signature = element[1].signature;
          const address = this.blockchainParser.getPublicKeyHashAddress(publicKey);
          if (this.verify({ interval, commitId, publicKey, signature })) {
            votesToAdd.push({
              CommandId: Number(command.id),
              interval,
              commitId,
              address,
            });
          }
        }
      }
    }

    return votesToAdd;
  }

  validateMessageBody(messageBody) {
    return Boolean(
      messageBody &&
        messageBody.list &&
        messageBody.list.length === 3 &&
        messageBody.list[0].hasOwnProperty('u32') &&
        messageBody.list[1].hasOwnProperty('string') &&
        messageBody.list[2].hasOwnProperty('dict') &&
        Array.isArray(messageBody.list[2].dict)
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

  verify({ publicKey, signature, interval, commitId } = {}) {
    // PublicKey.fromString("FROM KEY OF THIRD ELEMENT OF DICTIONARY").verify(Buffer.from(sha
    //   .update(sha(Data.serialize(new Data.UInt32(BigInteger.valueOf(FIRST ELEMENT OF LIST)))))
    //   .update(sha(Data.serialize(new Data.String("SECOND ELEMENT OF LIST"))))
    //   .hex(), 'hex'), Signature.fromString('VALUE OF DICTIONARY IN GIVEN KEY')))
    return true;
  }
}

module.exports = VotesAdder;
