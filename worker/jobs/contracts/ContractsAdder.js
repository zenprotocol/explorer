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
      await this.processActiveContracts();
      logger.info('Active contracts updated');
    } catch (error) {
      logger.error(`An Error has occurred when processing contracts: ${error.message}`);
      throw error;
    }
  }

  async processActiveContracts() {
    const contracts = await this.networkHelper.getActiveContractsFromNode();
    await this.createOrUpdateContracts(contracts);
  }

  async createOrUpdateContracts(activeContracts) {
    // all active contracts should be created if not exists, if exist update expiryBlock
    // all existing contracts in db with expiryBlock != null, which are not in active contracts, should be updated to expiryBlock = null
    const promises = [];
    const activeContractsDictionary = this.getContractsDictionaryFromArray(activeContracts);
    // const notProcessedActiveContracts = activeContracts.slice();
    // process db contracts and mark in notProcessedActiveContracts
    const setToNullIds = [];
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

    // add the set to null update
    promises.push(contractsDAL.setExpired(setToNullIds));

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

    return Promise.all(promises);
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
