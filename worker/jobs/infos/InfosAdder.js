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

      return await Promise.all(promises);
    } catch (error) {
      throw new QueueError(error);
    }
  }

  async updateSoftwareVersions() {
    const [nodeVersion, walletVersion] = await Promise.all([
      this.networkHelper.getZenNodeLatestTag(),
      this.networkHelper.getDesktopWalletVersion(),
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
    return infos;
  }
}

module.exports = InfosAdder;
