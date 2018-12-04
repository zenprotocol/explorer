'use strict';

const logger = require('../../lib/logger')('contracts');
const contractsDAL = require('../../../server/components/api/contracts/contractsDAL');
const QueueError = require('../../lib/QueueError');

class ActiveContractsUpdater {
  constructor(networkHelper) {
    this.networkHelper = networkHelper;
  }

  async doJob(job) {
    try {
      logger.info('Updating active contracts');
      const numOfRowsAffected = await this.processActiveContracts();
      logger.info(`Active contracts updated - ${numOfRowsAffected} number of rows affected`);
      return numOfRowsAffected;
    } catch (error) {
      logger.error(`An Error has occurred when processing contracts: ${error.message}`);
      throw new QueueError(error);
    }
  }

  async processActiveContracts() {
    const contracts = await this.networkHelper.getActiveContractsFromNode();
    logger.info(`Got ${contracts.length} active contracts from node`);
    return await this.updateContracts(contracts);
  }

  async updateContracts(activeContracts) {
    const promises = [];
    const activeContractsDictionary = this.getContractsDictionaryFromArray(activeContracts);
    const setToNullIds = [];

    // go over the contracts in db and update expiryBlock or set it to null
    const dbContracts = await contractsDAL.findAllActive();
    dbContracts.forEach(dbContract => {
      if (Object.keys(activeContractsDictionary).includes(dbContract.id)) {
        const expiryBlock = activeContractsDictionary[dbContract.id].expire;
        if (dbContract.expiryBlock !== expiryBlock) {
          // update expiryBlock
          promises.push(
            contractsDAL.update(dbContract.id, {
              expiryBlock,
            })
          );
        }
        // mark as processed
        activeContractsDictionary[dbContract.id].processed = true;
      } else {
        setToNullIds.push(dbContract.id);
      }
    });

    // go over the rest of the active contracts and update or create them in db
    const notProcessedActiveContracts = Object.values(activeContractsDictionary).filter(
      contract => !contract.processed
    );
    for (let i = 0; i < notProcessedActiveContracts.length; i++) {
      const contract = notProcessedActiveContracts[i];
      const { contractId, expire } = contract;
      const contractDb = await contractsDAL.findById(contractId);
      if (contractDb) {
        // if contract was found in this stage it means that it was re-activated
        promises.push(
          (async () => {
            await contractsDAL.update(contractDb.id, {
              expiryBlock: expire,
            });
          })()
        );
      }
    }

    const numOfRowsAffected = promises.length + setToNullIds.length;

    // add the set to null update
    promises.push(contractsDAL.setExpired(setToNullIds));

    await Promise.all(promises);
    return numOfRowsAffected;
  }

  getContractsDictionaryFromArray(contracts) {
    return contracts.reduce((dict, cur) => {
      if (!Object.keys(dict).includes(cur.contractId)) {
        dict[cur.contractId] = cur;
      }
      return dict;
    }, {});
  }
}

module.exports = ActiveContractsUpdater;
