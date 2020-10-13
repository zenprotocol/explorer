'use strict';

const QueueError = require('../../lib/QueueError');
const createOrUpdateInfos = require('../../lib/createOrUpdateInfos');

class InfosAdder {
  constructor(networkHelper) {
    this.networkHelper = networkHelper;
  }

  async doJob() {
    try {
      const promises = [];
      promises.push(this.updateSoftwareVersions());

      await Promise.all(promises);
    } catch (error) {
      console.log(error);
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
}

module.exports = InfosAdder;
