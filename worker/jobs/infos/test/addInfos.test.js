'use strict';

const test = require('blue-tape');
const infosDAL = require('../../../../server/components/api/infos/infosDAL');
const truncate = require('../../../../test/lib/truncate');
const NetworkHelper = require('../../../lib/NetworkHelper');
const mock = require('./mock');
const InfosAdder = require('../InfosAdder');

test.onFinish(() => {
  infosDAL.db.sequelize.close();
});

test('INFOS ----------------------------------------------------------------------', async function() {});

test('Add software versions', async function(t) {
  await truncate();
  const networkHelper = new NetworkHelper();
  mock.mockNetworkHelper(networkHelper);
  const infosAdder = new InfosAdder(networkHelper);

  try {
    await infosAdder.doJob();

    const nodeVersion = await infosDAL.findOne({
      where: {
        name: 'nodeVersion',
      }
    });
    t.ok(nodeVersion, 'Should find a nodeVersion in infos');
    t.equals(nodeVersion.value, 'v0.9.123', 'The node version should be the same as the mocked one');

    const walletVersion = await infosDAL.findOne({
      where: {
        name: 'walletVersion',
      }
    });
    t.ok(walletVersion, 'Should find a walletVersion in infos');
    t.equals(walletVersion.value, 'v0.9.456', 'The wallet version should be the same as the mocked one');
  } catch (error) {
    t.fail('Should not throw');
  }
});

test('Update software versions', async function(t) {
  await truncate();
  const networkHelper = new NetworkHelper();
  mock.mockNetworkHelper(networkHelper);
  const infosAdder = new InfosAdder(networkHelper);

  try {
    await Promise.all([
      infosDAL.create({
        name: 'nodeVersion',
        value: 'v0.8',
      }),
      infosDAL.create({
        name: 'walletVersion',
        value: 'v0.7',
      }),
    ]);
    await infosAdder.doJob();

    const nodeVersion = await infosDAL.findOne({
      where: {
        name: 'nodeVersion',
      }
    });
    t.equals(nodeVersion.value, 'v0.9.123', 'The node version should be the same as the mocked one');

    const walletVersion = await infosDAL.findOne({
      where: {
        name: 'walletVersion',
      }
    });
    t.equals(walletVersion.value, 'v0.9.456', 'The wallet version should be the same as the mocked one');
  } catch (error) {
    t.fail('Should not throw');
  }
});
