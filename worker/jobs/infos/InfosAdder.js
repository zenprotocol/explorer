'use strict';

const infosDAL = require('../../../server/components/api/infos/infosDAL');
const statsDAL = require('../../../server/components/api/stats/statsDAL');
const txsDAL = require('../../../server/components/api/txs/txsDAL');
const cgpBLL = require('../../../server/components/api/cgp/cgpBLL');
const cgpUtils = require('../../../server/components/api/cgp/cgpUtils');
const blocksBLL = require('../../../server/components/api/blocks/blocksBLL');
const getChain = require('../../../server/lib/getChain');
const QueueError = require('../../lib/QueueError');
const getJobData = require('../../lib/getJobData');

function createOrUpdateInfos(infos) {
  const promises = [];
  infos.forEach((item) => {
    const { name, value } = item;
    promises.push(
      (async () => {
        const info = await infosDAL.findByName(name);
        if (info) {
          await infosDAL.update(info.id, {
            name,
            value,
          });
        } else {
          await infosDAL.create({
            name,
            value,
          });
        }
      })()
    );
  });

  return Promise.all(promises);
}

class InfosAdder {
  constructor(networkHelper) {
    this.networkHelper = networkHelper;
  }

  async doJob(job) {
    try {
      const type = getJobData(job, 'type'); // should execute lengthy operations?

      const promises = [];
      if (type === 'expensive') {
        promises.push(this.updateSoftwareVersions());
        promises.push(this.updateHashRate());
      }

      // update non expensive and rapidly changing data
      promises.push(this.updateBlockchainInfos());
      promises.push(this.updateTxInfos());
      promises.push(this.updateCgpInfos());

      await Promise.all(promises);
    } catch (error) {
      throw new QueueError(error);
    }
  }

  async updateBlockchainInfos() {
    const infos = await this.networkHelper.getBlockchainInfo();
    return createOrUpdateInfos(Object.keys(infos).map((key) => ({ name: key, value: infos[key] })));
  }

  async updateSoftwareVersions() {
    const [nodeVersion, walletVersion] = await Promise.all([
      this.networkHelper.getZenNodeLatestTag(),
      this.networkHelper.getZenWalletLatestTag(),
    ]);

    const infos = [
      {
        name: 'nodeVersion',
        value: nodeVersion,
      },
      {
        name: 'walletVersion',
        value: walletVersion,
      },
    ];

    await createOrUpdateInfos(infos);
  }

  async updateHashRate() {
    const hashRates = await statsDAL.networkHashRate('1 week');
    const info = {
      name: 'hashRate',
      value: 0,
    };
    if (hashRates.length) {
      const lastDayHashRate = hashRates[hashRates.length - 1];
      info.value = lastDayHashRate.hashrate;
    }
    await createOrUpdateInfos([info]);
  }

  async updateTxInfos() {
    const txsCount = await txsDAL.count();
    const infos = [
      {
        name: 'txsCount',
        value: txsCount,
      },
    ];
    await createOrUpdateInfos(infos);
  }

  async updateCgpInfos() {
    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const currentInterval = cgpUtils.getIntervalByBlockNumber(chain, currentBlock);
    const [cgpBalance, cgpAllocation] = await Promise.all([
      cgpBLL.findCgpBalance(),
      cgpBLL.findWinnerAllocation({ interval: currentInterval - 1, chain }),
    ]);
    const infos = [
      {
        name: 'cgpBalance',
        value: JSON.stringify(cgpBalance),
      },
      {
        name: 'cgpAllocation',
        value: cgpAllocation,
      },
    ];
    await createOrUpdateInfos(infos);
  }
}

module.exports = InfosAdder;
