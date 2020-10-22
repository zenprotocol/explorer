'use strict';

const EventEmitter = require('events');
const { Decimal } = require('decimal.js');
const logger = require('../../lib/logger')('reorg');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const txsDAL = require('../../../server/components/api/txs/txsDAL');
const contractsDAL = require('../../../server/components/api/contracts/contractsDAL');
const addressesDAL = require('../../../server/components/api/addresses/addressesDAL');
const assetsDAL = require('../../../server/components/api/assets/assetsDAL');
const inputsDAL = require('../../../server/components/api/inputs/inputsDAL');
const outputsDAL = require('../../../server/components/api/outputs/outputsDAL');
const difficultyPerDayDAL = require('../../../server/components/api/difficulty-per-day/difficultyPerDayDAL');
const txsPerDayDAL = require('../../../server/components/api/txs-per-day/txsPerDayDAL');
const zpSupplyPerDayDAL = require('../../../server/components/api/zp-supply-per-day/zpSupplyPerDayDAL');
const db = require('../../../server/db/sequelize/models');
const calcRewardByHeight = require('../../../server/lib/calcRewardByHeight');
const getJobData = require('../../lib/getJobData');
const QueueError = require('../../lib/QueueError');
const calcAddressesAssets = require('./calcAddressesAssetsPerTx');

const Op = db.Sequelize.Op;

const MAX_ALLOWED_BLOCKS_TO_DELETE = 500;

class ReorgProcessor extends EventEmitter {
  constructor(networkHelper, genesisTotalZp) {
    super();
    this.networkHelper = networkHelper;
    this.genesisTotalZp = genesisTotalZp;
    this.dbTransaction = null;
  }

  async doJob(job) {
    this.on('fork-found', (blockNumber) =>
      logger.info(`Fork found at block number ${blockNumber}`)
    );
    try {
      this.dbTransaction = await db.sequelize.transaction();
      const searchAll = getJobData(job, 'all') === true; // do not search all by default
      const preventDelete = getJobData(job, 'delete') === false; // delete by default
      let deleted = 0;

      logger.info('Searching for reorg forks...');
      if (searchAll) {
        logger.info('all flag is on - will search in all blocks');
      }
      const forks = await this.searchForks(searchAll);

      if (forks.length) {
        if (preventDelete) {
          logger.info('delete flag is marked false, will not delete blocks.');
        } else {
          const lowestFork = forks[forks.length - 1];
          logger.info(`Undoing Address, Asset and Contract changes in blockNumber > ${lowestFork}`);
          // get the txs, last to first
          const txs = await txsDAL.findAll({
            where: {
              blockNumber: {
                [Op.gt]: lowestFork,
              },
            },
            order: [
              ['blockNumber', 'DESC'],
              ['index', 'DESC'],
            ],
          });

          for (let i = 0; i < txs.length; i++) {
            const tx = txs[i];
            const [inputs, outputs] = await Promise.all([
              inputsDAL.findAll({ where: { txId: tx.id } }),
              outputsDAL.findAll({ where: { txId: tx.id } }),
            ]);
            await this.calcAddressAssetsPerTx({ inputs, outputs, tx });
          }

          logger.info(`Deleting all charts data with date > #${lowestFork}'s date`);
          await this.removeChartsData(lowestFork);

          logger.info(`Deleting all blocks with blockNumber > ${lowestFork}`);
          deleted = await blocksDAL.bulkDelete({
            where: {
              blockNumber: {
                [Op.gt]: lowestFork,
              },
            },
            transaction: this.dbTransaction,
          });
        }
      } else {
        logger.info('Did not find a fork');
      }

      await this.dbTransaction.commit();

      return { forks, deleted };
    } catch (error) {
      logger.error(`An Error has occurred when processing a reorg: ${error.message}`);
      if (this.dbTransaction) {
        logger.info('Rollback the database transaction');
        await this.dbTransaction.rollback();
      }
      throw new QueueError(error);
    }
  }

  async searchForks(searchAll = false) {
    const forks = [];
    const latest = await blocksDAL.findLatest();
    const lowestBlockNumber = searchAll
      ? 1
      : Math.max(1, latest.blockNumber - MAX_ALLOWED_BLOCKS_TO_DELETE);
    let blockNumber = latest ? latest.blockNumber : 0;
    let foundDifference = false;

    if (latest) {
      while (blockNumber >= lowestBlockNumber) {
        this.emit('scan-block', blockNumber);
        const [block, nodeBlock] = await Promise.all([
          blocksDAL.findById(blockNumber),
          this.networkHelper.getBlockFromNode(blockNumber),
        ]);

        if (block.hash !== nodeBlock.hash) {
          foundDifference = true;
        } else {
          if (foundDifference) {
            this.emit('fork-found', blockNumber);
            forks.push(blockNumber);
            foundDifference = false;
            if (!searchAll) {
              break;
            }
          }
        }

        blockNumber -= 1;
      }
    }

    // special case - handle block number 1
    if (foundDifference) {
      forks.push(0);
    }

    return forks;
  }

  /**
   * The opposite of the accumulate done in BlocksAdder
   * @param {*} params - all params are database entries
   */
  async calcAddressAssetsPerTx({ inputs, outputs, tx } = {}) {
    const { addresses, assets } = calcAddressesAssets({ inputs, outputs });

    // remove data from Addresses, Assets
    const promisesAddress = []; // do parallel work
    addresses.forEach((assets, address) => {
      // upsert address/asset
      const assetIds = Object.keys(assets);
      assetIds.forEach((asset) => {
        promisesAddress.push(
          (async () => {
            const dbAddress = await addressesDAL.findByAddressAsset({
              address,
              asset,
              transaction: this.dbTransaction,
            });
            await dbAddress.update(
              {
                inputSum: new Decimal(dbAddress.inputSum).minus(assets[asset].inputSum).toString(),
                outputSum: new Decimal(dbAddress.outputSum)
                  .minus(assets[asset].outputSum)
                  .toString(),
                balance: new Decimal(dbAddress.balance)
                  .minus(assets[asset].outputSum.minus(assets[asset].inputSum))
                  .toString(),
                txsCount: new Decimal(dbAddress.txsCount).minus(1).toString(),
              },
              { transaction: this.dbTransaction }
            );
          })()
        );
      });
    });

    // the addresses are needed to calculate the Asset.keyholders
    await Promise.all(promisesAddress);

    const promisesAsset = [];
    // Assets
    assets.forEach((value, asset) => {
      promisesAsset.push(
        (async () => {
          const [keyholders, dbAsset] = await Promise.all([
            addressesDAL.count({
              where: {
                [Op.and]: {
                  asset,
                  balance: {
                    [Op.gt]: 0,
                  },
                },
              },
              transaction: this.dbTransaction,
            }),
            assetsDAL.findById(asset, {
              transaction: this.dbTransaction,
            }),
          ]);
          const issued =
            asset !== '00'
              ? value.issued
              : tx.index === 0 // get reward once per block
              ? new Decimal(
                  tx.blockNumber === 1
                    ? new Decimal(this.genesisTotalZp).times(100000000)
                    : calcRewardByHeight(tx.blockNumber)
                )
              : new Decimal(0);
          await dbAsset.update(
            {
              issued: new Decimal(dbAsset.issued).minus(issued).toString(),
              destroyed: new Decimal(dbAsset.destroyed).minus(value.destroyed).toString(),
              outstanding: new Decimal(dbAsset.outstanding)
                .minus(issued.minus(value.destroyed))
                .toString(),
              keyholders,
              txsCount: new Decimal(dbAsset.txsCount).minus(1).toString(),
            },
            { transaction: this.dbTransaction }
          );
        })()
      );
    });
    await Promise.all(promisesAsset);

    // remove data from contracts
    const promisesContract = [];
    // addresses are unique
    addresses.forEach((value, address) => {
      if (address.startsWith('c')) {
        promisesContract.push(
          (async () => {
            const contract = await contractsDAL.findByAddress(address, {
              transaction: this.dbTransaction,
            });
            if (contract) {
              await contract.update(
                { txsCount: new Decimal(contract.txsCount).minus(1).toString() },
                { transaction: this.dbTransaction }
              );
            }
          })()
        );
      }
    });
    // assets are unique
    assets.forEach((value, asset) => {
      // check only is an asset was minted
      if (value.issued.gt(0)) {
        promisesContract.push(
          (async () => {
            const contractId = asset.substring(0, 72);
            const contract = await contractsDAL.findById(contractId, {
              transaction: this.dbTransaction,
            });
            if (contract) {
              const assetsIssued = await assetsDAL.count({
                where: {
                  asset: {
                    [Op.like]: `${contractId}%`,
                  },
                },
                transaction: this.dbTransaction,
              });
              await contract.update({ assetsIssued }, { transaction: this.dbTransaction });
            }
          })()
        );
      }
    });

    await Promise.all(promisesContract);
  }

  /**
   * Deletes all charts data with date >= fork date
   * using '>=' because there can be blocks from the same day of the fork after the fork
   */
  async removeChartsData(fork) {
    const forkBlock = await blocksDAL.findOne({ where: { blockNumber: fork } });
    if (forkBlock) {
      const goodDate = new Date(Number(forkBlock.timestamp));
      goodDate.setDate(goodDate.getDate() - 1);
      await Promise.all([
        txsPerDayDAL.bulkDelete({
          where: {
            date: {
              [Op.gt]: goodDate,
            },
          },
          transaction: this.dbTransaction,
        }),
        difficultyPerDayDAL.bulkDelete({
          where: {
            date: {
              [Op.gt]: goodDate,
            },
          },
          transaction: this.dbTransaction,
        }),
        zpSupplyPerDayDAL.bulkDelete({
          where: {
            date: {
              [Op.gt]: goodDate,
            },
          },
          transaction: this.dbTransaction,
        }),
      ]);
    }
  }
}

module.exports = ReorgProcessor;
