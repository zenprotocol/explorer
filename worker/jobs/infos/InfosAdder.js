'use strict';

const infosDAL = require('../../../server/components/api/infos/infosDAL');
const statsDAL = require('../../../server/components/api/stats/statsDAL');
const logger = require('../../lib/logger')('infos');
const QueueError = require('../../lib/QueueError');

function createOrUpdateInfos(infos) {
  const promises = [];
  infos.forEach(item => {
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
      logger.info('Updating software versions in infos');
      await this.updateSoftwareVersions();
      logger.info('Software versions in infos updated');

      logger.info('Updating hash rate in infos');
      await this.updateHashRate();
      logger.info('Hash rate in infos updated');
    } catch (error) {
      logger.error(`An Error has occurred when adding infos: ${error.message}`);
      throw new QueueError(error);
    }
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
    if(hashRates.length) {
      const lastDayHashRate = hashRates[hashRates.length - 1];
      const infos = [
        {
          name: 'hashRate',
          value: lastDayHashRate.hashrate,
        },
      ];
  
      await createOrUpdateInfos(infos);
    }
  }
}

module.exports = InfosAdder;
