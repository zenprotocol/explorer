'use strict';

const logger = require('../../lib/logger');
const contractsDAL = require('../../../server/components/api/contracts/contractsDAL');

class ContractsAdder {
  constructor(networkHelper) {
    this.networkHelper = networkHelper;
  }

  async doJob(job) {
    try {
      logger.info('Updating active contracts');
      const numOfRowsAffected = await this.processActiveContracts();
      logger.info(`Active contracts updated - ${numOfRowsAffected} number of rows affected`);
    } catch (error) {
      logger.error(`An Error has occurred when processing contracts: ${error.message}`);
      throw error;
    }
  }

  async processActiveContracts() {
    const contracts = await this.networkHelper.getActiveContractsFromNode();
    return await this.createOrUpdateContracts(contracts);
  }

  async createOrUpdateContracts(activeContracts) {
    const promises = [];
    const activeContractsDictionary = this.getContractsDictionaryFromArray(activeContracts);
    const setToNullIds = [];

    // go over the contracts in db and update expiryBlock or set it to null
    const dbContracts = await contractsDAL.findAllActive();
    dbContracts.forEach(dbContract => {
      if (Object.keys(activeContractsDictionary).includes(dbContract.id)) {
        // update expiryBlock
        promises.push(
          contractsDAL.update(dbContract.id, {
            expiryBlock: activeContractsDictionary[dbContract.id].expire,
          })
        );
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
    notProcessedActiveContracts.forEach(contract => {
      const { contractId, address, expire, code } = contract;
      promises.push(
        (async () => {
          const contract = await contractsDAL.findById(contractId);
          if (contract) {
            // if contract was found in this stage it means that it was re-activated
            await contractsDAL.update(contract.id, {
              expiryBlock: expire,
            });
          } else {
            await contractsDAL.create({
              id: contractId,
              address,
              code,
              expiryBlock: expire,
            });
          }
        })()
      );
    });

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

module.exports = ContractsAdder;
