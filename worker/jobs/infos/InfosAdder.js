'use strict';

const infosDAL = require('../../../server/components/api/infos/infosDAL');
const logger = require('../../lib/logger');

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
    } catch (error) {
      logger.error(`An Error has occurred when adding infos: ${error.message}`);
      throw error;
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
}

module.exports = InfosAdder;
