'use strict';

const test = require('blue-tape');
const Service = require('../../server/lib/Service');
const NetworkHelper = require('./NetworkHelper');
const Config = require('../../server/config/Config');

test('NETWORK HELPER ----------------------------------------------------------------------', async function() {});

test('Get number of blocks from chain', async function(t) {
  Service.config.setTimeout(2000);
  try {
    const info = await Service.blocks.getChainInfo();
    t.assert(info.blocks, 'chain info should contain a "blocks" attribute');
    t.assert(typeof info.blocks === 'number', '"blocks" attribute should be a number');
  } catch (error) {
    console.log('An error had occurred trying to get the chain info! check the node status!!!');
    t.equals(error.name, 'NetworkError', 'Should throw a custom NetworkError');
  }
  Service.config.setTimeout(0);
});

test('Empty response from chain node', async function(t) {
  const networkHelper = new NetworkHelper();

  // mute the service to get empty responses
  Service.config.mute(true);

  try {
    await networkHelper.getLatestBlockNumberFromNode();
    t.fail('Should throw a network error');
  } catch (error) {
    t.equals(error.name, 'NetworkError', 'Should throw a custom NetworkError');
  }

  Service.config.mute(false);
});

test('Network error when getting blocks info from node', async function(t) {
  const networkHelper = new NetworkHelper();

  // mute the service to get empty responses
  Service.config.setBaseUrl('http://wrong.address.io');
  Service.config.setTimeout(1);
  try {
    await networkHelper.getLatestBlockNumberFromNode();
    t.fail('Should throw an error');
  } catch (error) {
    t.equals(error.name, 'NetworkError', 'Should throw a custom NetworkError');
  }

  Service.config.setBaseUrl(Config.get('zp:node'));
  Service.config.setTimeout(0);
});